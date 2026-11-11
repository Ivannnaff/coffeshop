<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Pricing\AddonSelectionValidator;
use App\Domain\Pricing\DTO\AddonChoice;
use App\Domain\Pricing\DTO\AddonGroupRule;
use App\Domain\Pricing\DTO\CartItemInput;
use App\Domain\Pricing\Exceptions\AddonInvalidException;
use App\Enums\AddonSelectionType;
use PHPUnit\Framework\TestCase;

class AddonSelectionValidatorTest extends TestCase
{
    protected AddonSelectionValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new AddonSelectionValidator;
    }

    private function makeItem(array $addons, array $groups): CartItemInput
    {
        return new CartItemInput(
            productId: 1,
            productName: 'Kopi',
            basePrice: 15000,
            qty: 1,
            addons: $addons,
            addonGroups: $groups,
        );
    }

    public function test_valid_single_selection_passes(): void
    {
        $group = new AddonGroupRule(1, 'Sugar', AddonSelectionType::Single, 1, 1);
        $addon = new AddonChoice(1, 1, 'Normal Sugar', 0);

        $this->validator->validate($this->makeItem([$addon], [$group]));

        $this->addToAssertionCount(1);
    }

    public function test_single_group_rejects_two_selections(): void
    {
        $group = new AddonGroupRule(1, 'Sugar', AddonSelectionType::Single, 1, 1);
        $addons = [
            new AddonChoice(1, 1, 'Normal Sugar', 0),
            new AddonChoice(2, 1, 'Less Sugar', 0),
        ];

        $this->expectException(AddonInvalidException::class);

        $this->validator->validate($this->makeItem($addons, [$group]));
    }

    public function test_required_group_rejects_empty_selection(): void
    {
        $group = new AddonGroupRule(1, 'Topping', AddonSelectionType::Multiple, 1, 3);

        $this->expectException(AddonInvalidException::class);

        $this->validator->validate($this->makeItem([], [$group]));
    }

    public function test_multiple_group_rejects_over_max(): void
    {
        $group = new AddonGroupRule(1, 'Topping', AddonSelectionType::Multiple, 0, 2);
        $addons = [
            new AddonChoice(1, 1, 'A', 1000),
            new AddonChoice(2, 1, 'B', 1000),
            new AddonChoice(3, 1, 'C', 1000),
        ];

        $this->expectException(AddonInvalidException::class);

        $this->validator->validate($this->makeItem($addons, [$group]));
    }

    public function test_addon_from_unattached_group_is_rejected(): void
    {
        $group = new AddonGroupRule(1, 'Topping', AddonSelectionType::Multiple, 0, 3);
        $addon = new AddonChoice(9, 99, 'Asing', 1000);

        $this->expectException(AddonInvalidException::class);

        $this->validator->validate($this->makeItem([$addon], [$group]));
    }

    public function test_sold_out_addon_is_rejected(): void
    {
        $group = new AddonGroupRule(1, 'Topping', AddonSelectionType::Multiple, 0, 3);
        $addon = new AddonChoice(1, 1, 'Habis', 1000, isSoldOut: true);

        $this->expectException(AddonInvalidException::class);

        $this->validator->validate($this->makeItem([$addon], [$group]));
    }

    public function test_duplicate_addon_is_rejected(): void
    {
        $group = new AddonGroupRule(1, 'Topping', AddonSelectionType::Multiple, 0, 3);
        $addon = new AddonChoice(1, 1, 'Extra Shot', 5000);

        $this->expectException(AddonInvalidException::class);

        $this->validator->validate($this->makeItem([$addon, $addon], [$group]));
    }
}
