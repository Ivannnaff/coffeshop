<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCartItemRequest extends FormRequest
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
            'qty' => ['sometimes', 'required', 'integer', 'min:1', 'max:99'],
            'note' => ['sometimes', 'nullable', 'string', 'max:140'],
            'variant_ids' => ['sometimes', 'array'],
            'variant_ids.*' => ['integer', 'exists:product_variants,id'],
            'addon_ids' => ['sometimes', 'array'],
            'addon_ids.*' => ['integer', 'exists:addons,id'],
            'addons' => ['sometimes', 'array'],
            'addons.*.addon_id' => ['required', 'integer', 'distinct', 'exists:addons,id'],
            'addons.*.qty' => ['sometimes', 'integer', 'min:1', 'max:99'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $fields = ['qty', 'note', 'variant_ids', 'addon_ids', 'addons'];

                foreach ($fields as $field) {
                    if ($this->has($field)) {
                        return;
                    }
                }

                $validator->errors()->add('qty', 'Isi qty, note, varian, atau add-on.');
            },
        ];
    }
}
