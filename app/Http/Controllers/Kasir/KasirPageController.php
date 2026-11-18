<?php

declare(strict_types=1);

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\StaffResource;
use App\Models\Category;
use App\Models\Table;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KasirPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->with(['products' => function ($query): void {
                $query->where('is_active', true)->orderBy('sort_order')->with([
                    'variants' => fn ($relation) => $relation->orderBy('sort_order'),
                    'addonGroups' => fn ($relation) => $relation
                        ->where('is_active', true)
                        ->with(['addons' => fn ($addonQuery) => $addonQuery
                            ->where('is_active', true)
                            ->orderBy('sort_order')]),
                ]);
            }])
            ->orderBy('sort_order')
            ->get();

        $tables = Table::query()
            ->where('is_active', true)
            ->orderBy('number')
            ->get(['id', 'number']);

        return Inertia::render('Kasir/Index', [
            'staff' => (new StaffResource($request->user()))->resolve($request),
            'categories' => CategoryResource::collection($categories)->resolve($request),
            'tables' => $tables->map(fn (Table $table): array => [
                'id' => $table->id,
                'number' => $table->number,
            ])->values()->all(),
        ]);
    }
}
