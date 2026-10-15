<?php

namespace Taily\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Taily\Enums\UserRole;
use Taily\Mail\PasswordResetMail;
use Taily\Models\Concerns\SearchesWithLike;

class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable, PasskeyAuthenticatable, SearchesWithLike, TwoFactorAuthenticatable;

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'person_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        // Fortify's TwoFactorAuthenticatable trait does not hide these itself,
        // and ProfileController serializes the user via toArray(); keep the
        // (encrypted) secret and recovery codes out of every response.
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /**
     * Send the password reset notification.
     *
     * Overrides the framework default (English markdown notification) with
     * Taily's German mail pointing at the frontend reset page.
     *
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        Mail::to($this->email)->send(new PasswordResetMail($this, $token));
    }

    /**
     * Check if the user has admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    /**
     * Get the person record linked to this user (optional).
     */
    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    /**
     * Get the user's invitation.
     */
    public function invitation(): HasOne
    {
        return $this->hasOne(UserInvitation::class);
    }

    /**
     * Apply the filters of the user list. Unknown names are ignored here; the
     * list request rejects them before they get this far.
     *
     * @param  array<string, string|list<string>>  $filters
     */
    public function scopeFilterBy(Builder $query, array $filters): void
    {
        foreach ($filters as $name => $value) {
            if ($value === [] || $value === null || $value === '') {
                continue;
            }

            $has = $value === '1';

            match ($name) {
                'role' => $query->whereIn('users.role', $value),
                'has_person' => $has
                    ? $query->whereNotNull('users.person_id')
                    : $query->whereNull('users.person_id'),
                // Confirmed second factor only, as UserResource reports it.
                'has_two_factor' => $has
                    ? $query->whereNotNull('users.two_factor_confirmed_at')
                    : $query->whereNull('users.two_factor_confirmed_at'),
                // Never logged in covers invited users and expired invitations.
                'has_logged_in' => $has
                    ? $query->whereNotNull('users.last_login_at')
                    : $query->whereNull('users.last_login_at'),
                default => null,
            };
        }
    }

    /**
     * Match the user's name or email, or the first name, last name or email
     * of the linked person. Every word of the term has to match the first or
     * last name of the person, so "Anna Müller" and "Müller Anna" agree.
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $words = preg_split('/\s+/u', $term, -1, PREG_SPLIT_NO_EMPTY);

        $query->where(function (Builder $search) use ($term, $words) {
            self::whereLike($search, 'users.name', $term);
            self::whereLike($search, 'users.email', $term, 'or');

            $search->orWhereHas('person', function (Builder $person) use ($term, $words) {
                $person->where(function (Builder $match) use ($term, $words) {
                    $match->where(function (Builder $name) use ($words) {
                        foreach ($words as $word) {
                            $name->where(function (Builder $part) use ($word) {
                                self::whereLike($part, 'people.first_name', $word);
                                self::whereLike($part, 'people.last_name', $word, 'or');
                            });
                        }
                    });
                    self::whereLike($match, 'people.email', $term, 'or');
                });
            });
        });
    }

    /**
     * Sort keys: name, email, last_login_at and created_at. Users that never
     * logged in come last in both directions. Ties are broken by id, so rows
     * never repeat or vanish between pages.
     */
    public function scopeSortedBy(Builder $query, string $key, string $direction = 'asc'): void
    {
        match ($key) {
            'name' => $query->orderBy('users.name', $direction)->orderBy('users.email', $direction),
            'last_login_at' => $query->orderByRaw('users.last_login_at is null')->orderBy('users.last_login_at', $direction),
            default => $query->orderBy("users.{$key}", $direction),
        };

        $query->orderBy('users.id');
    }
}
