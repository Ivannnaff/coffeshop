<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReportSummaryRequest;
use App\Http\Resources\ReportSummaryResource;
use App\Services\ReportService;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class ReportController extends Controller
{
    private const TIMEZONE = 'Asia/Jakarta';

    public function __construct(
        protected ReportService $reportService,
    ) {}

    public function summary(ReportSummaryRequest $request): ReportSummaryResource
    {
        $from = $this->parseDate($request->validated('from'))?->startOfDay()
            ?? now(self::TIMEZONE)->startOfMonth();

        $to = $this->parseDate($request->validated('to'))?->endOfDay()
            ?? now(self::TIMEZONE)->endOfDay();

        return new ReportSummaryResource(
            $this->reportService->summary($from, $to)
        );
    }

    private function parseDate(mixed $value): ?CarbonInterface
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        return Carbon::createFromFormat('Y-m-d', $value, self::TIMEZONE);
    }
}
