import { PaymentMethodResult } from '@stripe/stripe-js';

export type SubmissionData = FormData | any;

export interface SubmissionOptions {
  endpoint?: string;
  clientName?: string;
  fetchImpl?: typeof fetch;
  createPaymentMethod?: () => Promise<PaymentMethodResult>;
}

enum FormErrorCodeEnum {
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  EMPTY = 'EMPTY',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  FORM_NOT_FOUND = 'FORM_NOT_FOUND',
  NO_FILE_UPLOADS = 'NO_FILE_UPLOADS',
  TOO_MANY_FILES = 'TOO_MANY_FILES',
  FILES_TOO_BIG = 'FILES_TOO_BIG',
  STRIPE_CLIENT_ERROR = 'STRIPE_CLIENT_ERROR',
  STRIPE_SCA_ERROR = 'STRIPE_SCA_ERROR'
}

enum FieldErrorCodeEnum {
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  REQUIRED_FIELD_EMPTY = 'REQUIRED_FIELD_EMPTY',
  TYPE_EMAIL = 'TYPE_EMAIL',
  TYPE_NUMERIC = 'TYPE_NUMERIC',
  TYPE_TEXT = 'TYPE_TEXT'
}

export type FormErrorCode = keyof typeof FormErrorCodeEnum;
export type FieldErrorCode = keyof typeof FieldErrorCodeEnum;

export interface FormError {
  field?: string;
  code?: FormErrorCode | FieldErrorCode;
  message: string;
  details?: {
    stripeCode?: string;
  };
}

export interface FieldError extends FormError {
  field: string;
  code: FieldErrorCode;
}

export function isFieldError(error: FormError): error is FieldError {
  return (
    (error as FieldError).code in FieldErrorCodeEnum &&
    (error as FieldError).field !== undefined
  );
}

type KnownError<T> = T extends
  | { code: FormErrorCode }
  | { code: FieldErrorCode }
  ? T
  : never;

export function isKnownError(error: FormError): error is KnownError<FormError> {
  return (
    !!error.code &&
    (error.code in FormErrorCodeEnum || error.code in FieldErrorCodeEnum)
  );
}

export interface SuccessBody {
  id: string;
  data: object;
}

export interface ErrorBody {
  errors: FormError[];
}

export type SubmissionBody = SuccessBody | ErrorBody;

export function hasErrors(body: SubmissionBody): body is ErrorBody {
  return (body as ErrorBody).errors !== undefined;
}

export interface SubmissionResponse {
  body: SubmissionBody;
  response: Response | null;
}
