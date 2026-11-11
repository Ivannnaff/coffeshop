<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentGateway: string
{
    case Midtrans = 'midtrans';
    case Xendit = 'xendit';
}
