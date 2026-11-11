<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddonGroupRequest extends FormRequest
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
            'name' => [$required, 'string', 'max:255'],
            'selection_type' => [$required, 'string', Rule::in(['single', 'multiple'])],
            'min_select' => ['nullable', 'integer', 'min:0'],
            'max_select' => ['nullable', 'integer', 'min:0', 'gte:min_select'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
