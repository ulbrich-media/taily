<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Taily\Enums\UserRole;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\UserIndexRequest;
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
        $request->user()->load('person');

        if ($request->user()->isAdmin()) {
            $request->user()->load('invitation');
        }

        return response()->json(new UserResource($request->user()));
    }

    /**
     * Display a page of users (see UserIndexRequest for the query contract).
     * `per_page=0` only counts the filtered users. Without any list
     * parameter all users are returned, which the pickers in other forms
     * still rely on.
     */
    public function index(UserIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        $relations = $request->user()->isAdmin() ? ['person', 'invitation'] : ['person'];

        if (! $request->wantsListView()) {
            return response()->json(UserResource::collection(User::with($relations)->orderBy('name')->get()));
        }

        $query = User::query()
            ->filterBy($request->filters())
            ->search($request->searchTerm());

        if ($request->perPage() === 0) {
            return $request->countResponse($query);
        }

        return UserResource::collection(
            $query->with($relations)
                ->sortedBy($request->sortKey(), $request->sortDirection())
                ->paginate($request->perPage())
        );
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        $user->load('person');

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
            'person_id' => ['nullable', 'uuid', 'exists:people,id', 'unique:users,person_id'],
        ]);

        // Generate a random password that will be replaced during invitation/password reset
        $validated['password'] = Hash::make(bin2hex(random_bytes(32)));
        $user = User::create($validated);

        // Create invitation and send email
        $invitation = UserInvitation::createForUser($user);
        Mail::to($user->email)->send(new UserInvitationMail($invitation, $invitation->plainTextToken));

        $user->load('invitation', 'person');

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
            'person_id' => [
                'nullable',
                'uuid',
                'exists:people,id',
                Rule::unique('users', 'person_id')->ignore($user->id),
            ],
        ]);

        $user->update($validated);
        $user->load('person');

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
