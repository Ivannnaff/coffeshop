<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware role:admin, role:barista, atau role:barista,admin.
 * Lihat 06-SECURITY.md bagian 6.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_if($user === null, 401);
        abort_unless($user->is_active, 403, 'Akun tidak aktif.');
        abort_unless(in_array($user->role->value, $roles, true), 403, 'Akses ditolak.');

        return $next($request);
    }
}
