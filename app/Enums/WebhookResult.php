<?php

declare(strict_types=1);

namespace App\Enums;

enum WebhookResult: string
{
    case Processed = 'processed';
    case Duplicate = 'duplicate';
    case Rejected = 'rejected';
    case LateAfterExpired = 'late_after_expired';
}
