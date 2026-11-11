<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProductImageRequest extends FormRequest
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
            // MIME dan ukuran sesuai 06-SECURITY.md bagian 8.
            'image' => ['required', 'file', 'mimes:jpeg,png,webp', 'max:2048'],
        ];
    }
}
