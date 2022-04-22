type FieldErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'REQUIRED_FIELD_EMPTY'
  | 'TYPE_EMAIL'
  | 'TYPE_NUMERIC'
  | 'TYPE_TEXT';
export interface ErrorPayload {
  field?: string;
  code: FieldErrorCode | null;
  message: string;
}
