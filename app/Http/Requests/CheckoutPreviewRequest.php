<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutPreviewRequest extends FormRequest
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
            'mode' => ['required', 'string', 'in:dine_in,takeaway,delivery'],
            'latitude' => ['nullable', 'required_if:mode,delivery', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_if:mode,delivery', 'numeric', 'between:-180,180'],
        ];
    }
}
