<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductBadge: string
{
    case Promo = 'promo';
    case BestSeller = 'best_seller';
}
