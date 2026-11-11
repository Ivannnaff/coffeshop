<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\StaffResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StaffAuthController extends Controller
{
    public function login(LoginRequest $request): StaffResource
    {
        /** @var User|null $user */
        $user = User::query()->where('email', (string) $request->validated('email'))->first();

        if ($user === null || ! Hash::check((string) $request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // User nonaktif tidak boleh login meski password benar (06-SECURITY.md bagian 6).
        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun tidak aktif.'],
            ]);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return new StaffResource($user);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request): StaffResource
    {
        /** @var User $user */
        $user = $request->user();

        return new StaffResource($user);
    }
}
