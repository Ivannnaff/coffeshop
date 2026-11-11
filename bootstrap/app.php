<?php

declare(strict_types=1);

use App\Domain\Cart\Exceptions\CartExpiredException;
use App\Domain\Delivery\Exceptions\OutOfDeliveryAreaException;
use App\Domain\Order\Exceptions\InvalidOrderTransitionException;
use App\Domain\Order\Exceptions\StoreClosedException;
use App\Domain\Order\Exceptions\TooManyActiveOrdersException;
use App\Domain\Payment\Exceptions\PaymentGatewayException;
use App\Domain\Pricing\Exceptions\AddonInvalidException;
use App\Domain\Pricing\Exceptions\ProductUnavailableException;
use App\Domain\Store\Exceptions\StoreConfigurationException;
use App\Http\Controllers\Webhook\PaymentWebhookController;
use App\Http\Middleware\AuditAdminRequests;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveCart;
use App\Http\Middleware\SecurityHeaders;
use App\Models\Order;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function (): void {
            // Webhook berada di root (bukan /api) dan tanpa CSRF/session auth.
            Route::post('/webhooks/payment/midtrans', [PaymentWebhookController::class, 'midtrans'])
                ->middleware('throttle:payment-webhook')
                ->name('webhooks.payment.midtrans');

            // KDS dan Admin: prefix root sesuai 05-API.md, memakai session staff (Breeze-style).
            Route::middleware('web')->group(base_path('routes/kds.php'));
            Route::middleware('web')->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(SecurityHeaders::class);
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'resolve.cart' => ResolveCart::class,
            'audit.admin' => AuditAdminRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            $error = static function (
                string $message,
                string $code,
                int $status,
                array $errors = []
            ): JsonResponse {
                $payload = [
                    'message' => $message,
                    'code' => $code,
                ];

                if ($errors !== []) {
                    $payload['errors'] = $errors;
                }

                return response()->json($payload, $status);
            };

            return match (true) {
                $e instanceof ValidationException => $error(
                    'Data yang dikirim tidak valid.',
                    'VALIDATION_FAILED',
                    422,
                    $e->errors(),
                ),
                $e instanceof ProductUnavailableException => $error(
                    $e->getMessage(),
                    'PRODUCT_UNAVAILABLE',
                    422,
                ),
                $e instanceof AddonInvalidException => $error(
                    $e->getMessage(),
                    'ADDON_INVALID',
                    422,
                ),
                $e instanceof OutOfDeliveryAreaException => $error(
                    $e->getMessage(),
                    'OUT_OF_DELIVERY_AREA',
                    422,
                ),
                $e instanceof StoreClosedException => $error(
                    $e->getMessage(),
                    'STORE_CLOSED',
                    409,
                ),
                $e instanceof StoreConfigurationException => $error(
                    $e->getMessage(),
                    'STORE_CONFIGURATION_ERROR',
                    503,
                ),
                $e instanceof CartExpiredException => $error(
                    $e->getMessage(),
                    'CART_EXPIRED',
                    410,
                ),
                $e instanceof InvalidOrderTransitionException => $error(
                    $e->getMessage(),
                    'INVALID_TRANSITION',
                    409,
                ),
                $e instanceof PaymentGatewayException => $error(
                    $e->getMessage(),
                    'PAYMENT_GATEWAY_ERROR',
                    502,
                ),
                $e instanceof TooManyActiveOrdersException,
                $e instanceof ThrottleRequestsException => $error(
                    $e instanceof TooManyActiveOrdersException
                        ? $e->getMessage()
                        : 'Terlalu banyak permintaan. Coba lagi nanti.',
                    'RATE_LIMITED',
                    429,
                ),
                $e instanceof ModelNotFoundException && $e->getModel() === Order::class => $error(
                    'Pesanan tidak ditemukan.',
                    'ORDER_NOT_FOUND',
                    404,
                ),
                default => null,
            };
        });
    })->create();
