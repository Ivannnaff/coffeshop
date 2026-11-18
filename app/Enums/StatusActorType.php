<?php

declare(strict_types=1);

namespace App\Enums;

enum StatusActorType: string
{
    case System = 'system';
    case User = 'user';
    case Cashier = 'cashier';
    case Webhook = 'webhook';
}
