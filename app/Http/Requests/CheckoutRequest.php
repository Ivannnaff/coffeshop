<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'regex:/^08[0-9]{8,13}$/'],
            'mode' => ['required', 'string', 'in:dine_in,takeaway,delivery'],
            'pickup_note' => ['nullable', 'string', 'max:140'],
            'delivery' => ['array', 'required_if:mode,delivery', 'prohibited_unless:mode,delivery'],
            'delivery.address' => ['required_if:mode,delivery', 'string', 'max:255'],
            'delivery.latitude' => ['required_if:mode,delivery', 'numeric', 'between:-90,90'],
            'delivery.longitude' => ['required_if:mode,delivery', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_phone.regex' => 'Nomor WhatsApp harus diawali 08 dan berisi 10-15 digit.',
            'delivery.prohibited_unless' => 'Data pengiriman hanya boleh dikirim untuk mode delivery.',
        ];
    }
}
