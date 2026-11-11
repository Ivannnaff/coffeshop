<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditAdminRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $user = $request->user();
            Log::channel('audit')->info('Admin action executed', [
                'user_id' => $user?->id,
                'email' => $user?->email,
                'role' => $user?->role?->value,
                'method' => $request->method(),
                'uri' => $request->getRequestUri(),
                'ip' => $request->ip(),
                'status' => $response->getStatusCode(),
            ]);
        }

        return $response;
    }
}
