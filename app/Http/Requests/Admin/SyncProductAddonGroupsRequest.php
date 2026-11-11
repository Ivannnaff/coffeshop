<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SyncProductAddonGroupsRequest extends FormRequest
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
            'addon_group_ids' => ['present', 'array'],
            'addon_group_ids.*' => ['integer', 'exists:addon_groups,id'],
        ];
    }
}
