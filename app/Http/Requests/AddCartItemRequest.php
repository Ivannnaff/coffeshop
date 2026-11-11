<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Addon;
use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AddCartItemRequest extends FormRequest
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
        $productId = (int) $this->input('product_id');

        return [
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'variant_ids' => ['sometimes', 'array'],
            'variant_ids.*' => [
                'integer',
                Rule::exists('product_variants', 'id')->where('product_id', $productId),
            ],
            'addon_ids' => ['sometimes', 'array'],
            'addon_ids.*' => ['integer', Rule::exists('addons', 'id')],
            'qty' => ['required', 'integer', 'min:1', 'max:99'],
            'note' => ['nullable', 'string', 'max:140'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $productId = (int) $this->input('product_id');
                $addonIds = $this->input('addon_ids', []);

                if ($addonIds !== []) {
                    $attached = Addon::query()
                        ->whereIn('id', $addonIds)
                        ->whereHas('addonGroup.products', fn ($query) => $query->whereKey($productId))
                        ->count();

                    if ($attached !== count(array_unique($addonIds))) {
                        $validator->errors()->add(
                            'addon_ids',
                            'Ada add-on yang tidak terhubung ke produk ini.'
                        );
                    }
                }

                $variantIds = $this->input('variant_ids', []);

                if ($variantIds !== []) {
                    if (count($variantIds) !== count(array_unique($variantIds))) {
                        $validator->errors()->add(
                            'variant_ids',
                            'Varian yang sama tidak boleh dipilih dua kali.'
                        );

                        return;
                    }

                    $variants = ProductVariant::query()->whereIn('id', $variantIds)->get();
                    $usedTypes = [];

                    foreach ($variants as $variant) {
                        $type = $variant->type->value;

                        if (isset($usedTypes[$type])) {
                            $validator->errors()->add(
                                'variant_ids',
                                'Hanya boleh satu varian untuk setiap tipe.'
                            );

                            return;
                        }

                        $usedTypes[$type] = true;
                    }
                }
            },
        ];
    }
}
