<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use App\Models\Cart;
use App\Models\Order;
use App\Services\Checkout\DTO\CheckoutInput;
use Illuminate\Support\Facades\DB;

/**
 * Pesanan yang dibuat staf di kasir. Memakai pricing dan snapshot checkout
 * yang sama dengan pesanan pelanggan, lalu langsung ditandai lunas (tunai).
 */
class CashierOrderService
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService,
        protected OrderStatusService $orderStatusService,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $staffId): Order
    {
        return DB::transaction(function () use ($data, $staffId): Order {
            $mode = OrderMode::from((string) $data['mode']);

            /** @var Cart $cart */
            $cart = $this->cartService->create();
            $cart->update([
                'mode' => $mode->value,
                'table_id' => isset($data['table_id']) ? (int) $data['table_id'] : null,
            ]);
            $cart->load('table');

            /** @var array<int, array<string, mixed>> $items */
            $items = $data['items'];

            foreach ($items as $item) {
                $qty = (int) $item['qty'];

                $this->cartService->addItem(
                    $cart,
                    (int) $item['product_id'],
                    array_map('intval', $item['variant_ids'] ?? []),
                    array_fill_keys(array_map('intval', $item['addon_ids'] ?? []), $qty),
                    $qty,
                    isset($item['note']) ? (string) $item['note'] : null,
                );
            }

            $name = trim((string) ($data['customer_name'] ?? ''));
            $phone = trim((string) ($data['customer_phone'] ?? ''));

            $input = new CheckoutInput(
                customerName: $name !== '' ? $name : 'Tamu Kasir',
                customerPhone: $phone !== '' ? $phone : $this->placeholderPhone(),
                mode: $mode,
                pickupNote: isset($data['pickup_note']) && $data['pickup_note'] !== ''
                    ? (string) $data['pickup_note']
                    : null,
            );

            $order = $this->checkoutService->checkout($cart, $input);

            return $this->orderStatusService->transition(
                $order,
                OrderStatus::Paid,
                StatusActorType::Cashier,
                $staffId,
                'Dibayar tunai di kasir.',
            );
        });
    }

    private function placeholderPhone(): string
    {
        return '08'.str_pad((string) random_int(0, 9_999_999_999), 10, '0', STR_PAD_LEFT);
    }
}
