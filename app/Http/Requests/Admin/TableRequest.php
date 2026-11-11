<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Table;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TableRequest extends FormRequest
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
        /** @var Table|null $table */
        $table = $this->route('table');
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $storeId = (int) $this->input('store_id', $table->store_id ?? 1);

        return [
            'store_id' => ['nullable', 'integer', 'min:1'],
            'number' => [
                $required, 'string', 'max:50',
                Rule::unique('tables', 'number')
                    ->where('store_id', $storeId)
                    ->ignore($table?->id),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
