<?php

namespace Taily\Tests\Feature;

use ReflectionMethod;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Providers\TailyServiceProvider;
use Taily\Tests\TestCase;

/**
 * Installs use the host app's config/filesystems.php, so every disk a model's
 * media collections rely on must be registered by TailyServiceProvider.
 */
class MediaDiskRegistrationTest extends TestCase
{
    public function test_provider_registers_every_disk_used_by_model_media_collections(): void
    {
        $disks = [];

        foreach ([Animal::class, Person::class, Adoption::class, ContractSigningProcess::class] as $class) {
            $model = new $class;
            $model->registerMediaCollections();

            foreach ($model->mediaCollections as $collection) {
                if (! empty($collection->diskName)) {
                    $disks[] = $collection->diskName;
                }
            }
        }

        $disks = array_values(array_unique($disks));

        $this->assertContains('contract-signing-document', $disks);

        foreach ($disks as $disk) {
            config(["filesystems.disks.{$disk}" => null]);
        }

        $method = new ReflectionMethod(TailyServiceProvider::class, 'registerFilesystemDisks');
        $method->invoke(new TailyServiceProvider($this->app));

        foreach ($disks as $disk) {
            $this->assertNotEmpty(config("filesystems.disks.{$disk}"), "Disk {$disk} is not registered by the provider.");
        }
    }
}
