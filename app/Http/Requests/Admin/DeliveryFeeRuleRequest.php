<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeliveryFeeRuleRequest extends FormRequest
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
            'min_eligible_subtotal' => [$required, 'integer', 'min:0'],
            'discount_type' => [$required, 'string', Rule::in(['free', 'percent'])],
            'discount_value' => [
                'nullable', 'integer', 'min:0', 'max:100',
                'required_if:discount_type,percent',
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
