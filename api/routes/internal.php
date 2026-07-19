<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\ConfirmablePasswordController;
use Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController;
use Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Laravel\Fortify\Http\Controllers\PasswordController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\RecoveryCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController;
use Laravel\Passkeys\Http\Controllers\PasskeyLoginController;
use Laravel\Passkeys\Http\Controllers\PasskeyRegistrationController;
use Taily\Http\Controllers\Internal\AdoptionContractController;
use Taily\Http\Controllers\Internal\AdoptionController;
use Taily\Http\Controllers\Internal\AnimalController;
use Taily\Http\Controllers\Internal\AnimalPictureController;
use Taily\Http\Controllers\Internal\AnimalTypeController;
use Taily\Http\Controllers\Internal\ApiTokenController;
use Taily\Http\Controllers\Internal\EmailChangeController;
use Taily\Http\Controllers\Internal\FormTemplateController;
use Taily\Http\Controllers\Internal\InvitationController;
use Taily\Http\Controllers\Internal\MediaController;
use Taily\Http\Controllers\Internal\MedicalTestController;
use Taily\Http\Controllers\Internal\OrganizationController;
use Taily\Http\Controllers\Internal\PasskeyController;
use Taily\Http\Controllers\Internal\PersonController;
use Taily\Http\Controllers\Internal\PersonPictureController;
use Taily\Http\Controllers\Internal\PreInspectionController;
use Taily\Http\Controllers\Internal\PreInspectionSubmissionController;
use Taily\Http\Controllers\Internal\ProfileController;
use Taily\Http\Controllers\Internal\SessionController;
use Taily\Http\Controllers\Internal\TransportController;
use Taily\Http\Controllers\Internal\UserController;
use Taily\Http\Controllers\Internal\VaccinationController;

/*
|--------------------------------------------------------------------------
| Internal API Routes
|--------------------------------------------------------------------------
|
| These routes are for the internal React application. They require
| authentication via Laravel Sanctum and provide full CRUD access to
| all resources.
|
*/

// Media serve route (signed URL is the auth mechanism)
Route::get('/media/{mediaUuid}', [MediaController::class, 'serve'])->name('media.serve');

// Authentication routes (Laravel Fortify controllers, see ADR-008)
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Second factor of the login. When a user with confirmed 2FA logs in, the
// login endpoint answers `{ "two_factor": true }` and holds the pending login
// in the session; the SPA then posts the TOTP or a recovery code here. The
// throttle guards against brute-forcing the six-digit code.
Route::post('/two-factor-challenge', [TwoFactorAuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:6,1');

// Password reset (login throttling lives in Fortify's login pipeline; these
// public endpoints need their own request-level limit against reset spam)
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('throttle:6,1');
Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('throttle:6,1');

// Passkey login (laravel/passkeys controllers, pulled in by Fortify). A
// resident-key WebAuthn ceremony already proves possession of the device plus
// a biometric/PIN unlock, so this authenticates on its own without a
// subsequent two-factor challenge — the same treatment GitHub and Google give
// passkey sign-ins. `options` starts the ceremony and stashes its challenge in
// the session; `login` verifies the signed assertion against it.
Route::get('/passkeys/login/options', [PasskeyLoginController::class, 'index'])->middleware('throttle:6,1');
Route::post('/passkeys/login', [PasskeyLoginController::class, 'store'])->middleware('throttle:6,1');

// Public invitation routes. The 64-character token is the credential; the
// throttle is defense in depth against token guessing, matching the other
// unauthenticated endpoints above. The `invitations` key prefix gives these
// routes their own bucket — unauthenticated inline throttles otherwise share
// one per-IP counter, and accepting an invitation shouldn't compete with,
// say, password-reset attempts from the same network.
Route::get('/invitations/{token}', [InvitationController::class, 'show'])->middleware('throttle:6,1,invitations');
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept'])->middleware('throttle:6,1,invitations');

// Public email change confirmation. The 64-character token is the credential
// (same trust model as password reset/invitation accept above), so this stays
// outside the auth:sanctum group — the browser confirming a pending change
// need not be logged in as the account it belongs to.
Route::post('/profile/email/confirm/{token}', [EmailChangeController::class, 'confirm'])->middleware('throttle:6,1');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    // Current user
    Route::get('/user', [UserController::class, 'current']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [PasswordController::class, 'update']);
    Route::delete('/profile/email', [EmailChangeController::class, 'destroy']);

    // Password confirmation (re-authentication) gating the sensitive 2FA
    // operations below. `status` lets the SPA check whether a fresh
    // confirmation is still valid before prompting; `confirm` records one. The
    // throttle guards the password against brute-forcing.
    Route::get('/user/confirmed-password-status', [ConfirmedPasswordStatusController::class, 'show']);
    Route::post('/user/confirm-password', [ConfirmablePasswordController::class, 'store'])
        ->middleware('throttle:6,1');

    // Two-factor authentication management (Laravel Fortify controllers).
    // Enabling generates the secret and recovery codes; the second factor only
    // becomes active once the user confirms a code (see the `confirm` option in
    // FortifyServiceProvider). The management endpoints match Fortify's own
    // paths so the upstream controllers keep working unchanged.
    //
    // Every endpoint sits behind `password.confirm`: disabling, revealing the
    // secret, and viewing or regenerating recovery codes all expose or weaken
    // the second factor, so a stolen or unattended session must re-prove the
    // password first. Enrolment shares the same confirmation window, so the
    // user is prompted once. This mirrors Fortify's own confirmPassword default,
    // applied explicitly here because Taily registers these routes itself.
    Route::middleware('password.confirm')->group(function () {
        // Requesting an email change starts a login-credential change, so it
        // sits behind the same fresh-password gate as the security-sensitive
        // endpoints below.
        Route::post('/profile/email', [EmailChangeController::class, 'store']);

        Route::post('/user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'store']);
        Route::delete('/user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'destroy']);
        // Same brute-force guard as the login challenge: confirmation also
        // checks a six-digit TOTP code.
        Route::post('/user/confirmed-two-factor-authentication', [ConfirmedTwoFactorAuthenticationController::class, 'store'])
            ->middleware('throttle:6,1');
        Route::get('/user/two-factor-qr-code', [TwoFactorQrCodeController::class, 'show']);
        Route::get('/user/two-factor-secret-key', [TwoFactorSecretKeyController::class, 'show']);
        Route::get('/user/two-factor-recovery-codes', [RecoveryCodeController::class, 'index']);
        Route::post('/user/two-factor-recovery-codes', [RecoveryCodeController::class, 'store']);

        // Passkey management (laravel/passkeys controllers). Registering
        // stores a new WebAuthn credential for the account; deleting removes
        // one. Both create or narrow how the account can be signed into, so
        // they sit behind the same fresh-password gate as the 2FA endpoints
        // above. `options` also lives here (not in the public group) so the
        // registration ceremony is scoped to the already-authenticated user.
        Route::get('/user/passkeys/options', [PasskeyRegistrationController::class, 'index']);
        Route::post('/user/passkeys', [PasskeyRegistrationController::class, 'store']);
        Route::delete('/user/passkeys/{passkey}', [PasskeyRegistrationController::class, 'destroy']);
    });

    // Passkeys listing (Taily's own controller; the package only ships
    // options/store/destroy). Read-only, so it does not need the fresh-password
    // gate the mutating endpoints above require.
    Route::get('/user/passkeys', [PasskeyController::class, 'index']);

    // Active sessions listing. Read-only, same reasoning as the passkeys
    // listing above.
    Route::get('/user/sessions', [SessionController::class, 'index']);

    // Active sessions ("sign out this device" / "sign out everywhere"). Not
    // behind `password.confirm` like the mutations above: these validate the
    // plaintext password directly (see SessionController), the same
    // convention PasswordController uses, because rotating the "remember me"
    // token needs the plaintext rather than a session-based confirmation flag.
    Route::delete('/user/sessions/{sessionId}', [SessionController::class, 'destroy']);
    Route::delete('/user/sessions', [SessionController::class, 'destroyOthers']);

    // Users administration
    Route::apiResource('users', UserController::class);

    // Animals
    Route::apiResource('animals', AnimalController::class);
    Route::post('/animals/{animal}/pictures', [AnimalPictureController::class, 'store']);
    Route::put('/animals/{animal}/pictures/reorder', [AnimalPictureController::class, 'reorder']);
    Route::delete('/animals/{animal}/pictures/{picture}', [AnimalPictureController::class, 'destroy']);

    // Animal Types
    Route::get('/animal-types/{animalType}/trait-suggestions', [AnimalTypeController::class, 'traitSuggestions']);
    Route::apiResource('animal-types', AnimalTypeController::class);

    // Vaccinations and Medical Tests
    Route::apiResource('vaccinations', VaccinationController::class);
    Route::apiResource('medical-tests', MedicalTestController::class);

    // People
    Route::apiResource('persons', PersonController::class);
    Route::post('/persons/{person}/pictures', [PersonPictureController::class, 'store']);
    Route::put('/persons/{person}/pictures/reorder', [PersonPictureController::class, 'reorder']);
    Route::delete('/persons/{person}/pictures/{picture}', [PersonPictureController::class, 'destroy']);

    // Organizations
    Route::apiResource('organizations', OrganizationController::class);

    // Transports
    Route::apiResource('transports', TransportController::class)->except('show');
    Route::post('/transports/{transport}/mark-done', [TransportController::class, 'markDone']);

    // Adoptions
    Route::get('/adoptions/options', [AdoptionController::class, 'options']);
    Route::apiResource('adoptions', AdoptionController::class);
    Route::put('/adoptions/{adoption}/contract', [AdoptionContractController::class, 'store']);

    // API Tokens
    Route::get('/api-tokens/abilities', [ApiTokenController::class, 'abilities']);
    Route::get('/api-tokens', [ApiTokenController::class, 'index']);
    Route::post('/api-tokens', [ApiTokenController::class, 'store']);
    Route::delete('/api-tokens/{tokenId}', [ApiTokenController::class, 'destroy']);

    // Form Templates
    Route::get('/form-templates', [FormTemplateController::class, 'index']);
    Route::post('/form-templates', [FormTemplateController::class, 'store']);
    Route::get('/form-templates/{formTemplate}', [FormTemplateController::class, 'show']);
    Route::put('/form-templates/{formTemplate}', [FormTemplateController::class, 'update']);
    Route::post('/form-templates/{formTemplate}/validate', [FormTemplateController::class, 'validateData']);

    // Pre-Inspections
    Route::apiResource('pre-inspections', PreInspectionController::class);
    Route::put('/pre-inspections/{preInspection}/inspector', [PreInspectionController::class, 'updateInspector']);
});

// Public pre-inspection submission routes (token-protected, no auth required)
Route::get('/inspect/{token}', [PreInspectionSubmissionController::class, 'show']);
Route::post('/inspect/{token}/submit', [PreInspectionSubmissionController::class, 'submit']);
