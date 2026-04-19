<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Taily\Enums\UserRole;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\UserResource;
use Taily\Mail\UserInvitationMail;
use Taily\Models\User;
use Taily\Models\UserInvitation;

class UserController extends Controller
{
    /**
     * Apply middleware to protect write operations.
     */
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    /**
     * Get the authenticated user.
     */
    public function current(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $request->user()->load('invitation');
        }

        return response()->json(new UserResource($request->user()));
    }

    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::orderBy('name');

        if ($request->user()->isAdmin()) {
            $query->with('invitation');
        }

        return response()->json(UserResource::collection($query->get()));
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $user->load('invitation');
        }

        return response()->json(new UserResource($user));
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        // Generate a random password that will be replaced during invitation/password reset
        $validated['password'] = Hash::make(bin2hex(random_bytes(32)));
        $user = User::create($validated);

        // Create invitation and send email
        $invitation = UserInvitation::createForUser($user);
        Mail::to($user->email)->send(new UserInvitationMail($invitation));

        $user->load('invitation');

        return response()->json([
            'message' => 'Benutzer erfolgreich erstellt.',
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Benutzer erfolgreich aktualisiert.',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'message' => 'Benutzer erfolgreich gelöscht.',
        ]);
    }
}
