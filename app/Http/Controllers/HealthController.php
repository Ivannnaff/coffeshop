<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Health check publik. Detail error tidak pernah dikembalikan ke klien,
 * hanya dicatat ke log agar tidak membocorkan konfigurasi/infrastruktur.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
            'queue' => $this->checkQueue(),
        ];

        $healthy = ! in_array(false, array_column($checks, 'ok'), true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    private function checkDatabase(): array
    {
        $driver = (string) config('database.default');

        try {
            DB::select('SELECT 1');

            return ['ok' => true, 'driver' => $driver];
        } catch (Throwable $e) {
            $this->reportFailure('database', $e);

            return ['ok' => false, 'driver' => $driver];
        }
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    private function checkCache(): array
    {
        $driver = (string) config('cache.default');

        try {
            $key = 'health-check:'.bin2hex(random_bytes(4));
            Cache::put($key, 'ok', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            return ['ok' => $value === 'ok', 'driver' => $driver];
        } catch (Throwable $e) {
            $this->reportFailure('cache', $e);

            return ['ok' => false, 'driver' => $driver];
        }
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    private function checkStorage(): array
    {
        $disk = (string) config('filesystems.default');

        try {
            $path = 'health-check/'.bin2hex(random_bytes(4)).'.txt';
            Storage::disk($disk)->put($path, 'ok');
            $contents = Storage::disk($disk)->get($path);
            Storage::disk($disk)->delete($path);

            return ['ok' => $contents === 'ok', 'driver' => $disk];
        } catch (Throwable $e) {
            $this->reportFailure('storage', $e);

            return ['ok' => false, 'driver' => $disk];
        }
    }

    /**
     * @return array{ok: bool, driver: string, size: int|null}
     */
    private function checkQueue(): array
    {
        $driver = (string) config('queue.default');

        try {
            $size = null;
            if ($driver !== 'sync') {
                $size = Queue::connection($driver)->size();
            }

            return ['ok' => true, 'driver' => $driver, 'size' => $size];
        } catch (Throwable $e) {
            $this->reportFailure('queue', $e);

            return ['ok' => false, 'driver' => $driver, 'size' => null];
        }
    }

    private function reportFailure(string $check, Throwable $exception): void
    {
        Log::error('Health check gagal.', [
            'check' => $check,
            'error' => $exception->getMessage(),
        ]);
    }
}
