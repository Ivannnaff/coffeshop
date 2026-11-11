<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductVariantRequest extends FormRequest
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
        /** @var ProductVariant|null $variant */
        $variant = $this->route('variant');
        /** @var Product|null $product */
        $product = $this->route('product');

        $productId = $variant->product_id ?? $product?->id;
        $type = (string) $this->input('type', $variant?->type->value ?? '');
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'type' => [$required, 'string', Rule::in(['size', 'temperature'])],
            'name' => [
                $required, 'string', 'max:255',
                Rule::unique('product_variants', 'name')
                    ->where('product_id', $productId)
                    ->where('type', $type)
                    ->ignore($variant?->id),
            ],
            'price_delta' => [$required, 'integer'],
            'is_default' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
