<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPageController extends Controller
{
    public function dashboard(Request $request): Response
    {
        return $this->page($request, 'Admin/Dashboard');
    }

    public function products(Request $request): Response
    {
        return $this->page($request, 'Admin/Products');
    }

    public function categories(Request $request): Response
    {
        return $this->page($request, 'Admin/Categories');
    }

    public function addons(Request $request): Response
    {
        return $this->page($request, 'Admin/Addons');
    }

    public function tables(Request $request): Response
    {
        return $this->page($request, 'Admin/Tables');
    }

    public function store(Request $request): Response
    {
        return $this->page($request, 'Admin/Store');
    }

    public function delivery(Request $request): Response
    {
        return $this->page($request, 'Admin/Delivery');
    }

    private function page(Request $request, string $component): Response
    {
        return Inertia::render($component, [
            'staff' => (new StaffResource($request->user()))->resolve($request),
        ]);
    }
}
