<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Services\CartService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Mengaitkan request dengan cart_token di cookie.
 * Lihat 02-ARCHITECTURE.md bagian 4.1 dan 06-SECURITY.md bagian 4.
 */
class ResolveCart
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('cart_token');

        $cart = is_string($token) ? $this->cartService->findActiveByToken($token) : null;

        if ($cart === null) {
            $cart = $this->cartService->create();
        }

        $request->attributes->set('cart', $cart);

        $response = $next($request);

        $response->headers->setCookie(cookie(
            name: 'cart_token',
            value: $cart->token,
            minutes: (int) config('menanti.cart_cookie_minutes', 60 * 24 * 7),
            path: '/',
            domain: null,
            secure: $request->isSecure() || app()->environment('production'),
            httpOnly: true,
            raw: false,
            sameSite: 'lax',
        ));

        return $response;
    }

    public static function cart(Request $request): Cart
    {
        /** @var Cart $cart */
        $cart = $request->attributes->get('cart');

        return $cart;
    }
}
