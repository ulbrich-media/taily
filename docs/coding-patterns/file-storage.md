# File Storage

Every distinct category of uploaded file gets its own storage disk. This makes the privacy posture of each file type structural rather than implicit in controller logic, and allows independent migration to cloud storage per category.

---

## Rule: one disk per file type

Each model that stores media must declare a dedicated disk in `api/config/filesystems.php` and reference it in `registerMediaCollections()`. No two different model types may share a disk.

**Real-world examples:**

| Model | Collection | Disk |
|-------|-----------|------|
| [`Animal`](../../api/src/Models/Animal.php) | `pictures` | `animal-pictures` |
| [`Person`](../../api/src/Models/Person.php) | `pictures` | `person-pictures` |
| [`Adoption`](../../api/src/Models/Adoption.php) | `contract` | `contracts` |

## Adding a new file type

**1. Register the disk** in `api/config/filesystems.php`:

```php
'my-type' => [
    'driver' => 'local',
    'root' => storage_path('app/my-type'),
    'throw' => false,
    'report' => false,
],
```

The disk root must be a top-level directory under `storage/app/` — never nested inside another disk's root.

**2. Declare the collection** in the model's `registerMediaCollections()`:

```php
public function registerMediaCollections(): void
{
    $this->addMediaCollection('documents')->useDisk('my-type');
}
```

**3. Never use `useDisk('local')` or `useDisk('public')`** for model-specific collections. The generic `local` disk is a Laravel default and has no semantic meaning for any particular data category.

## Cloud storage

When a file type needs to move to S3 or another cloud provider, only the disk driver and credentials in `filesystems.php` change — model code, controller code, and the `MediaController` serving logic are unaffected. This is the primary reason for the per-type disk isolation.
