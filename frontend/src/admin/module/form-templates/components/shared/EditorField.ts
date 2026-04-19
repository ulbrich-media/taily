import type { FormField } from '../../api/types'

export interface EditorField extends FormField {
  _deleted?: boolean
  /** True for fields added in this session that haven't been saved yet. */
  _isNew?: boolean
}
