<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductImageRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageController extends Controller
{
    public function store(ProductImageRequest $request, Product $product): JsonResponse
    {
        $file = $request->file('image');

        if ($file === null) {
            return response()->json(['message' => 'Berkas gambar tidak ditemukan.'], 422);
        }

        $disk = (string) config('filesystems.default');
        $extension = $file->extension() ?: 'jpg';
        // Nama file dari UUID, bukan nama asli (06-SECURITY.md bagian 8).
        $path = 'products/'.Str::uuid()->toString().'.'.$extension;

        Storage::disk($disk)->put($path, $file->get());

        if ($product->image_path !== null) {
            Storage::disk($disk)->delete($product->image_path);
        }

        $product->update(['image_path' => $path]);

        return response()->json([
            'data' => [
                'image_path' => $path,
                'image_url' => Storage::disk($disk)->url($path),
            ],
        ]);
    }
}
