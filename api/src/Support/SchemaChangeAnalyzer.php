<?php

namespace Taily\Support;

/**
 * Determines whether a schema change is breaking (requiring a new version)
 * or non-breaking (safe to update in place).
 *
 * Non-breaking changes (in-place update):
 *   - Text-only changes: name/title/description strings
 *   - Adding new optional properties (not in `required`)
 *   - Adding enum values (more permissive)
 *   - Loosening numeric constraints (lower minimum, higher maximum)
 *   - Removing additionalProperties: false
 *
 * Breaking changes (new version):
 *   - Removing existing properties
 *   - Changing a property's type
 *   - Adding fields to `required`
 *   - Removing enum values
 *   - Tightening numeric constraints (higher minimum, lower maximum)
 *   - Adding additionalProperties: false
 */
class SchemaChangeAnalyzer
{
    public function requiresNewVersion(array $oldSchema, array $newSchema): bool
    {
        return $this->isBreaking($oldSchema, $newSchema);
    }

    private function isBreaking(array $old, array $new): bool
    {
        // New required fields
        $oldRequired = $old['required'] ?? [];
        $newRequired = $new['required'] ?? [];

        if (! empty(array_diff($newRequired, $oldRequired))) {
            return true;
        }

        // additionalProperties: false added
        $oldAdditional = $old['additionalProperties'] ?? null;
        $newAdditional = $new['additionalProperties'] ?? null;

        if ($oldAdditional !== false && $newAdditional === false) {
            return true;
        }

        // Property-level checks
        $oldProps = $old['properties'] ?? [];
        $newProps = $new['properties'] ?? [];

        foreach ($oldProps as $key => $oldProp) {
            // Property removed
            if (! array_key_exists($key, $newProps)) {
                return true;
            }

            if ($this->isPropertyBreaking($oldProp, $newProps[$key])) {
                return true;
            }
        }

        return false;
    }

    private function isPropertyBreaking(array $old, array $new): bool
    {
        // Type changed
        if (($old['type'] ?? null) !== ($new['type'] ?? null)) {
            return true;
        }

        // Enum values removed
        if (isset($old['enum'])) {
            $removed = array_diff($old['enum'], $new['enum'] ?? []);
            if (! empty($removed)) {
                return true;
            }
        }

        // Numeric minimum raised (more restrictive)
        if (isset($old['minimum']) && isset($new['minimum']) && $new['minimum'] > $old['minimum']) {
            return true;
        }

        // New minimum added where none existed
        if (! isset($old['minimum']) && isset($new['minimum'])) {
            return true;
        }

        // Numeric maximum lowered (more restrictive)
        if (isset($old['maximum']) && isset($new['maximum']) && $new['maximum'] < $old['maximum']) {
            return true;
        }

        // New maximum added where none existed
        if (! isset($old['maximum']) && isset($new['maximum'])) {
            return true;
        }

        // String minLength raised
        if (isset($old['minLength']) && isset($new['minLength']) && $new['minLength'] > $old['minLength']) {
            return true;
        }

        if (! isset($old['minLength']) && isset($new['minLength'])) {
            return true;
        }

        // String maxLength lowered
        if (isset($old['maxLength']) && isset($new['maxLength']) && $new['maxLength'] < $old['maxLength']) {
            return true;
        }

        if (! isset($old['maxLength']) && isset($new['maxLength'])) {
            return true;
        }

        // Recurse into nested object schemas
        if (isset($old['properties']) || isset($new['properties'])) {
            if ($this->isBreaking($old, $new)) {
                return true;
            }
        }

        return false;
    }
}
