<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Store\Exceptions\StoreConfigurationException;
use App\Models\StoreSetting;

final class StoreSettingsService
{
    private ?StoreSetting $settings = null;

    public function get(): StoreSetting
    {
        if ($this->settings === null) {
            $settings = StoreSetting::query()->orderBy('id')->first();

            if ($settings === null) {
                throw StoreConfigurationException::missingStoreSettings();
            }

            $this->settings = $settings;
        }

        return $this->settings;
    }

    public function minItemPrice(): int
    {
        return (int) $this->get()->delivery_min_item_price;
    }

    public function paymentExpiryMinutes(): int
    {
        return (int) $this->get()->payment_expiry_minutes;
    }
}
