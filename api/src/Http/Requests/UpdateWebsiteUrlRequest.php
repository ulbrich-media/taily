<?php

namespace Taily\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWebsiteUrlRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'website_url' => ['present', 'nullable', 'url:http,https', 'max:2048'],
        ];
    }
}
