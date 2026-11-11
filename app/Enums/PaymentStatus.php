<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Settled = 'settled';
    case Failed = 'failed';
    case Expired = 'expired';
}
