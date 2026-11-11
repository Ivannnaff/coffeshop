<?php

declare(strict_types=1);

namespace App\Domain\Pricing;

use App\Domain\Pricing\DTO\AddonGroupRule;
use App\Domain\Pricing\DTO\CartItemInput;
use App\Domain\Pricing\Exceptions\AddonInvalidException;

/**
 * Validasi pilihan add-on sesuai 04-BUSINESS-RULES.md bagian 3.5.
 */
final class AddonSelectionValidator
{
    public function validate(CartItemInput $item): void
    {
        /** @var array<int, AddonGroupRule> $groups */
        $groups = [];
        foreach ($item->addonGroups as $group) {
            $groups[$group->id] = $group;
        }

        /** @var array<int, int> $selectedCounts */
        $selectedCounts = [];
        /** @var array<int, true> $selectedAddonIds */
        $selectedAddonIds = [];

        foreach ($item->addons as $addon) {
            if (isset($selectedAddonIds[$addon->id])) {
                throw AddonInvalidException::because(
                    "add-on '{$addon->name}' dipilih lebih dari sekali."
                );
            }

            $selectedAddonIds[$addon->id] = true;

            if (! $addon->isAvailable()) {
                throw AddonInvalidException::because(
                    "add-on '{$addon->name}' sedang tidak tersedia."
                );
            }

            $group = $groups[$addon->groupId] ?? null;

            if ($group === null) {
                throw AddonInvalidException::because(
                    "add-on '{$addon->name}' tidak termasuk grup add-on produk '{$item->productName}'."
                );
            }

            $selectedCounts[$group->id] = ($selectedCounts[$group->id] ?? 0) + 1;
        }

        foreach ($groups as $group) {
            $count = $selectedCounts[$group->id] ?? 0;

            if ($count < $group->minSelect) {
                throw AddonInvalidException::because(
                    "grup '{$group->name}' minimal {$group->minSelect} pilihan, saat ini {$count}."
                );
            }

            $maxSelect = $group->effectiveMaxSelect();

            if ($maxSelect !== null && $count > $maxSelect) {
                throw AddonInvalidException::because(
                    "grup '{$group->name}' maksimal {$maxSelect} pilihan, saat ini {$count}."
                );
            }
        }
    }
}
