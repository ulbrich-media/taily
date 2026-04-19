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

**Non-nullable text with empty string default** — `pre_inspection_summary` defaults to `''`, never null:
[`api/app/Models/Adoption.php:19`](../../api/app/Models/Adoption.php)
[`api/database/migrations/2026_01_19_000001_create_adoptions_table.php:23`](../../api/database/migrations/2026_01_19_000001_create_adoptions_table.php)

**Nullable with semantic meaning** — `transfer_planned_at` is nullable because `null` means "no transfer planned yet" (distinct from a planned date):
[`api/database/migrations/2026_01_19_000001_create_adoptions_table.php:30`](../../api/database/migrations/2026_01_19_000001_create_adoptions_table.php)
