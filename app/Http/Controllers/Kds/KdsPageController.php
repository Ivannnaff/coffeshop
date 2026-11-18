<?php

declare(strict_types=1);

namespace App\Http\Controllers\Kds;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KdsPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Kds/Index', [
            'staff' => (new StaffResource($request->user()))->resolve($request),
        ]);
    }
}
