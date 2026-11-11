<?php

declare(strict_types=1);

namespace App\Domain\Pricing\DTO;

use App\Enums\VariantType;

final readonly class VariantChoice
{
    public function __construct(
        public int $id,
        public VariantType $type,
        public string $name,
        public int $priceDelta,
    ) {}
}
