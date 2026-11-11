<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryZoneRequest extends FormRequest
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
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'store_id' => ['nullable', 'integer', 'min:1'],
            'name' => [$required, 'string', 'max:255'],
            'max_distance_km' => [$required, 'numeric', 'gt:0', 'max:999.99'],
            'base_fee' => [$required, 'integer', 'min:0'],
            'free_fee_min_subtotal' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
