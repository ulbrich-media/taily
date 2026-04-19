import { useState } from 'react'
import { getRandomKey } from '@/lib/utils.ts'

export const useFormSaveAndResetHook = () => {
  const [shouldReset, setShouldReset] = useState(false)
  const [formKey, setFormKey] = useState<string>(getRandomKey())

  const enableShouldReset = () => {
    setShouldReset(true)
  }

  const onFormSubmit = () => {
    if (shouldReset) {
      setFormKey(getRandomKey())
      setShouldReset(false)
    }
  }

  return {
    formKey,
    shouldReset,
    enableShouldReset,
    onFormSubmit,
  }
}
