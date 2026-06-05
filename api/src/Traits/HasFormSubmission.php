<?php

namespace Taily\Traits;

use Illuminate\Database\Eloquent\Relations\MorphOne;
use Taily\Models\FormSubmission;

trait HasFormSubmission
{
    public function formSubmission(): MorphOne
    {
        return $this->morphOne(FormSubmission::class, 'submittable');
    }
}
