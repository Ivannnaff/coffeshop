<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SyncProductAddonGroupsRequest;
use App\Http\Resources\AddonGroupResource;
use App\Models\Product;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductAddonGroupController extends Controller
{
    public function sync(SyncProductAddonGroupsRequest $request, Product $product): AnonymousResourceCollection
    {
        /** @var array<int, int> $ids */
        $ids = array_map('intval', (array) $request->validated('addon_group_ids'));

        $sync = [];

        foreach ($ids as $index => $id) {
            $sync[$id] = ['sort_order' => $index];
        }

        $product->addonGroups()->sync($sync);

        return AddonGroupResource::collection($product->addonGroups()->get());
    }
}
