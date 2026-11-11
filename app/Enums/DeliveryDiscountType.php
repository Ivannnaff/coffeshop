<?php

declare(strict_types=1);

namespace App\Enums;

enum DeliveryDiscountType: string
{
    case Free = 'free';
    case Percent = 'percent';
}
