# Form Reset After Submit

After a successful save, react-hook-form must be reset so `isDirty` clears and `FormBlocker` no longer blocks navigation.

## The Pattern

**Wrap the form in `FormProvider`** — `FormBlocker` reads `isDirty` and `isSubmitting` from context automatically. No props needed.

**Use `handleFormSubmit`** — an async wrapper around the `onSubmit` prop that calls `form.reset(data)` on success. Because `mutateAsync` throws on error, the reset is skipped and the form stays dirty so the user can fix and retry.

**Use `mutateAsync` in pages** — wrap in `async (data) => { await mutateAsync(data) }` so the return type is `Promise<void>` and errors propagate correctly.

## Examples

**Form component** — `FormProvider`, `handleFormSubmit`, `<FormBlocker />` with no props:
[`frontend/src/admin/module/animals/components/AnimalFormBasic.tsx`](../../frontend/src/admin/module/animals/components/AnimalFormBasic.tsx)

**Edit page** — `mutateAsync` async wrapper:
[`frontend/src/admin/module/animals/pages/AnimalEditBasicPage.tsx`](../../frontend/src/admin/module/animals/pages/AnimalEditBasicPage.tsx)

**Create page with "save and new"** — `mutateAsync` + `shouldReset` key remount:
[`frontend/src/admin/module/animals/pages/AnimalCreatePage.tsx`](../../frontend/src/admin/module/animals/pages/AnimalCreatePage.tsx)

**Custom dirty state outside react-hook-form** — pass `isDirty` to `FormBlocker` for state it can't see (additive, OR'd with the form's own `isDirty`):
[`frontend/src/admin/module/form-templates/components/FormBuilderEditor.tsx`](../../frontend/src/admin/module/form-templates/components/FormBuilderEditor.tsx)

## Limitation: backend-transformed data

`form.reset(data)` baselines the submitted values. If the backend normalises or derives fields, reset with the server response instead. See `onSuccess` in:
[`frontend/src/admin/module/pre-inspections/pages/PreInspectionEditPage.tsx`](../../frontend/src/admin/module/pre-inspections/pages/PreInspectionEditPage.tsx)
