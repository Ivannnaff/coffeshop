<?php

declare(strict_types=1);

namespace App\Domain\Pricing\DTO;

final readonly class AddonChoice
{
    public function __construct(
        public int $id,
        public int $groupId,
        public string $name,
        public int $priceDelta,
        public bool $isActive = true,
        public bool $isSoldOut = false,
    ) {}

    public function isAvailable(): bool
    {
        return $this->isActive && ! $this->isSoldOut;
    }
}
