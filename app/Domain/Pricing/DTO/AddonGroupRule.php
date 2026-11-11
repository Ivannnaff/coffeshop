<?php

declare(strict_types=1);

namespace App\Domain\Pricing\DTO;

use App\Enums\AddonSelectionType;

final readonly class AddonGroupRule
{
    public function __construct(
        public int $id,
        public string $name,
        public AddonSelectionType $selectionType,
        public int $minSelect = 0,
        public ?int $maxSelect = null,
    ) {}

    /**
     * Batas atas efektif: grup single selalu maksimal satu pilihan.
     */
    public function effectiveMaxSelect(): ?int
    {
        if ($this->selectionType === AddonSelectionType::Single) {
            return 1;
        }

        return $this->maxSelect;
    }
}
