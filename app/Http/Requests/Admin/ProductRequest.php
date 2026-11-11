<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
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
        /** @var Product|null $product */
        $product = $this->route('product');
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:255'],
            'slug' => [
                'nullable', 'string', 'max:255',
                Rule::unique('products', 'slug')->ignore($product?->id),
            ],
            'description' => ['nullable', 'string'],
            'base_price' => [$required, 'integer', 'min:0'],
            'is_sold_out' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'badge' => ['nullable', 'string', Rule::in(['promo', 'best_seller'])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
