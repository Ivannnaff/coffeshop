<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;

/**
 * Ringkasan penjualan admin (Fase 7).
 * Aturan: 04-BUSINESS-RULES.md bagian 7.
 */
class ReportService
{
    private const CACHE_TTL_MINUTES = 30;

    private const CACHE_VERSION_KEY = 'report_cache_version';

    /**
     * @return array{
     *     from: string,
     *     to: string,
     *     total_revenue: int,
     *     total_orders: int,
     *     total_items_sold: int,
     *     top_products: array<int, array{name: string, qty: int}>
     * }
     */
    public function summary(CarbonInterface $from, CarbonInterface $to): array
    {
        $version = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
        $cacheKey = sprintf(
            'report_summary_v%d_%s_%s',
            $version,
            $from->format('Y-m-d'),
            $to->format('Y-m-d'),
        );

        /** @var array{from: string, to: string, total_revenue: int, total_orders: int, total_items_sold: int, top_products: array<int, array{name: string, qty: int}>} $data */
        $data = Cache::remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
            fn (): array => $this->build($from, $to),
        );

        return $data;
    }

    /**
     * Dipanggil setiap ada pesanan yang masuk hitungan penjualan atau berubah status.
     * Versi cache naik sehingga key lama tidak dipakai lagi.
     */
    public function invalidate(): void
    {
        Cache::forever(self::CACHE_VERSION_KEY, $this->currentVersion() + 1);
    }

    private function currentVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    /**
     * @return array{
     *     from: string,
     *     to: string,
     *     total_revenue: int,
     *     total_orders: int,
     *     total_items_sold: int,
     *     top_products: array<int, array{name: string, qty: int}>
     * }
     */
    private function build(CarbonInterface $from, CarbonInterface $to): array
    {
        $countedStatuses = OrderStatus::countedAsSales();

        $baseQuery = Order::query()
            ->whereIn('status', $countedStatuses)
            ->whereBetween('paid_at', [$from, $to]);

        $totalRevenue = (int) (clone $baseQuery)->sum('total');
        $totalOrders = (int) (clone $baseQuery)->count();

        $totalItemsSold = (int) OrderItem::query()
            ->whereHas('order', function ($query) use ($countedStatuses, $from, $to): void {
                $query->whereIn('status', $countedStatuses)
                    ->whereBetween('paid_at', [$from, $to]);
            })
            ->sum('qty');

        $topProducts = OrderItem::query()
            ->whereHas('order', function ($query) use ($countedStatuses, $from, $to): void {
                $query->whereIn('status', $countedStatuses)
                    ->whereBetween('paid_at', [$from, $to]);
            })
            ->selectRaw('product_name, SUM(qty) as total_qty')
            ->groupBy('product_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(fn (OrderItem $item): array => [
                'name' => $item->product_name,
                'qty' => (int) $item->getAttribute('total_qty'),
            ])
            ->all();

        return [
            'from' => $from->format('Y-m-d'),
            'to' => $to->format('Y-m-d'),
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'total_items_sold' => $totalItemsSold,
            'top_products' => $topProducts,
        ];
    }
}
