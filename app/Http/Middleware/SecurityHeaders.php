<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $isProduction = app()->environment('production');

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');

        if ($isProduction) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($isProduction));

        return $response;
    }

    private function contentSecurityPolicy(bool $isProduction): string
    {
        $scriptSrc = ["'self'", "'unsafe-inline'"];
        $styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'];
        $fontSrc = ["'self'", 'https://fonts.gstatic.com'];
        $connectSrc = ["'self'"];

        // Dokumentasi API memakai Tailwind dari CDN dan hanya tersedia di non-production.
        if (! $isProduction) {
            $scriptSrc[] = 'https://cdn.tailwindcss.com';
            $connectSrc[] = 'http://localhost:8080';
            $connectSrc[] = 'ws://localhost:8080';
        }

        $realtimeUrl = trim((string) config('menanti.realtime_url', ''));
        if ($realtimeUrl !== '') {
            $connectSrc[] = $realtimeUrl;
            $connectSrc[] = (string) preg_replace('#^http#', 'ws', $realtimeUrl);
        }

        return sprintf(
            "default-src 'self'; script-src %s; style-src %s; font-src %s; img-src 'self' data: https:; connect-src %s;",
            implode(' ', array_unique($scriptSrc)),
            implode(' ', array_unique($styleSrc)),
            implode(' ', array_unique($fontSrc)),
            implode(' ', array_unique($connectSrc)),
        );
    }
}
