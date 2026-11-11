<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TableRequest;
use App\Http\Resources\TableResource;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class TableController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TableResource::collection(Table::query()->orderBy('number')->get());
    }

    public function store(TableRequest $request): TableResource
    {
        $data = $request->validated();

        $table = Table::create([
            'store_id' => (int) ($data['store_id'] ?? 1),
            'number' => (string) $data['number'],
            'qr_token' => Str::random(48),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return new TableResource($table);
    }

    public function update(TableRequest $request, Table $table): TableResource
    {
        $table->update($request->validated());

        return new TableResource($table->fresh());
    }

    public function destroy(Table $table): JsonResponse
    {
        $table->delete();

        return response()->json(null, 204);
    }

    public function regenerateToken(Table $table): TableResource
    {
        // Token lama langsung tidak berlaku (03-DATABASE.md bagian 2.3).
        $table->update(['qr_token' => Str::random(48)]);

        return new TableResource($table->fresh());
    }
}
