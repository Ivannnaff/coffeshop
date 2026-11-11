<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Domain\Payment\Exceptions\PaymentGatewayException;
use App\Enums\OrderMode;
use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveCart;
use App\Http\Requests\CheckoutPreviewRequest;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\CheckoutPreviewResource;
use App\Http\Resources\OrderResource;
use App\Services\Checkout\DTO\CheckoutInput;
use App\Services\CheckoutService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService,
        protected PaymentService $paymentService,
    ) {}

    public function preview(CheckoutPreviewRequest $request): CheckoutPreviewResource
    {
        $cart = ResolveCart::cart($request);
        $data = $request->validated();

        $preview = $this->checkoutService->preview(
            $cart,
            OrderMode::from((string) $data['mode']),
            isset($data['latitude']) ? (float) $data['latitude'] : null,
            isset($data['longitude']) ? (float) $data['longitude'] : null,
        );

        return new CheckoutPreviewResource($preview);
    }

    public function store(CheckoutRequest $request): JsonResponse
    {
        $cart = ResolveCart::cart($request);
        $data = $request->validated();

        $delivery = $data['delivery'] ?? null;

        $input = new CheckoutInput(
            customerName: (string) $data['customer_name'],
            customerPhone: (string) $data['customer_phone'],
            mode: OrderMode::from((string) $data['mode']),
            pickupNote: isset($data['pickup_note']) ? (string) $data['pickup_note'] : null,
            deliveryAddress: is_array($delivery) ? (string) $delivery['address'] : null,
            deliveryLatitude: is_array($delivery) ? (float) $delivery['latitude'] : null,
            deliveryLongitude: is_array($delivery) ? (float) $delivery['longitude'] : null,
        );

        $order = $this->checkoutService->checkout($cart, $input);

        // Transaksi gateway dibuat setelah order tersimpan agar kegagalan HTTP
        // tidak membatalkan pesanan yang sudah sah. Jika gateway gagal, klien
        // tetap menerima public_token agar bisa mengulang pembayaran (B-04).
        try {
            $payment = $this->paymentService->initiatePayment($order);
        } catch (PaymentGatewayException $exception) {
            Log::channel('payment')->error('Gagal membuat transaksi gateway setelah checkout.', [
                'order_number' => $order->order_number,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Pesanan tersimpan, tetapi pembayaran gagal dibuat. Silakan ulangi pembayaran.',
                'code' => 'PAYMENT_INITIATION_FAILED',
                'order' => [
                    'order_number' => $order->order_number,
                    'public_token' => $order->public_token,
                    'status' => $order->status->value,
                    'total' => $order->total,
                    'payment_retry_url' => url('/api/public/orders/'.$order->public_token.'/payment'),
                ],
            ], 502);
        }

        $order->setRelation('payments', collect([$payment]));

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }
}
