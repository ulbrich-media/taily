# Empty strings

The `ConvertEmptyStringsToNull` middleware is disabled. `TrimStrings` stays active.

**Default:** string fields are non-nullable at the database level and default to `''` on the model. Never use `null` to mean "empty" for strings.

**Exception:** a text field may be nullable only when `null` carries distinct semantic meaning — i.e. when you need to distinguish "not yet provided" from "intentionally empty".

## Setting the empty string default

String/text defaults **cannot be set at the database level** in Laravel migrations — `->default('')` is not reliable across drivers. Instead, set the default in the model via `$attributes`:

```php
protected $attributes = [
    'my_field' => '',
];
```

The migration column should be declared as plain non-nullable with no `->default()` call:

```php
$table->string('my_field');  // NOT ->nullable(), NOT ->default('')
```

## Examples

**Non-nullable text with empty string default** — the adoption's `notes` default to `''`, never null:
[`api/src/Models/Adoption.php:27`](../../api/src/Models/Adoption.php)

**Nullable with semantic meaning** — `handed_over_at` is nullable because `null` means "not handed over yet" (distinct from a handover date):
[`api/database/migrations/2026_05_05_000000_rework_adoption_process_schema.php:51`](../../api/database/migrations/2026_05_05_000000_rework_adoption_process_schema.php)
