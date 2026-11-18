<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CashierOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', 'in:dine_in,takeaway'],
            'table_id' => [
                'nullable',
                'required_if:mode,dine_in',
                'integer',
                Rule::exists('tables', 'id')->where('is_active', true),
            ],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'pickup_note' => ['nullable', 'string', 'max:140'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'items.*.variant_ids' => ['sometimes', 'array'],
            'items.*.variant_ids.*' => ['integer', Rule::exists('product_variants', 'id')],
            'items.*.addon_ids' => ['sometimes', 'array'],
            'items.*.addon_ids.*' => ['integer', Rule::exists('addons', 'id')],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.note' => ['nullable', 'string', 'max:140'],
        ];
    }
}
