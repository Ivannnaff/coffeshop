<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'opening_time' => ['nullable', 'date_format:H:i:s'],
            'closing_time' => ['nullable', 'date_format:H:i:s'],
            'timezone' => ['sometimes', 'required', 'timezone:all'],
            'is_accepting_orders' => ['sometimes', 'boolean'],
            'payment_expiry_minutes' => ['sometimes', 'required', 'integer', 'min:1', 'max:120'],
            'delivery_min_item_price' => ['sometimes', 'required', 'integer', 'min:0'],
        ];
    }
}
