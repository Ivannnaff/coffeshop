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
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->has('qty') && ! $this->has('note')) {
                    $validator->errors()->add('qty', 'Isi qty atau note.');
                }
            },
        ];
    }
}
