import type { PaymentMethodResult } from '@stripe/stripe-js';

/*
export type SubmitForm = <T extends FieldValues>(
  formKey: string,
  data: SubmissionData, // ...
  opts?: SubmissionOptions
) => Promise<SubmissionResult<T>>;
*/

export type SubmissionData = FormData | Record<string, string | Blob>;

export type SubmissionOptions = {
  endpoint?: string;
  clientName?: string;
  fetchImpl?: typeof fetch;
  createPaymentMethod?: () => Promise<PaymentMethodResult>;
};

export type SubmissionResult<T extends FieldValues> =
  | SubmissionSuccess
  | SubmissionError<T>;

export class SubmissionSuccess {
  readonly ok = true;
  readonly next: string;

  constructor(serverResponse: ServerSuccessResponse) {
    this.next = serverResponse.next;
  }
}

type ServerSuccessResponse = { next: string };

export function isServerSuccessResponse(
  obj: object
): obj is ServerSuccessResponse {
  return 'next' in obj && typeof obj.next === 'string';
}

export class SubmissionError<T extends FieldValues> {
  private formError?: FormError;
  private readonly fieldErrors: Map<keyof T, FieldError> = new Map();

  readonly ok = false;

  constructor(...serverErrors: ServerError[]) {
    for (const err of serverErrors) {
      // form error
      if (!err.field) {
        this.formError = {
          code:
            err.code && isFormErrorCode(err.code) ? err.code : 'UNSPECIFIED',
          message: err.message,
        };
        continue;
      }

      this.fieldErrors.set(err.field, {
        code: err.code && isFieldErrorCode(err.code) ? err.code : 'UNSPECIFIED',
        message: err.message,
      });
    }
  }

  getFormError(): FormError | undefined {
    return this.formError;
  }

  getFieldError<K extends keyof T>(field: K): FieldError | undefined {
    return this.fieldErrors.get(field);
  }
}

/*
{
  errors: {
    _$root: FormError { code, message: "..." },
    email: FieldError { code, message: "..." },
    password: FieldError { code, message: "..." },
  }
}

{
  errors: [
    FormError { code, message: "..." },
    FieldError { code, field: "email", message: "..." },
    FieldError { code, field: "password", message: "..." },
  ]
}
*/

type FormError = {
  readonly code: FormErrorCode | 'UNSPECIFIED';
  readonly message: string;
  // metadata: Record<string, string>;
};

function isFormErrorCode(code: string): code is FormErrorCode {
  return code in FormErrorCodeEnum;
}

export type FormErrorCode = ValueOf<typeof FormErrorCodeEnum>;

export const FormErrorCodeEnum = {
  BLOCKED: 'BLOCKED',
  EMPTY: 'EMPTY',
  FILES_TOO_BIG: 'FILES_TOO_BIG',
  FORM_NOT_FOUND: 'FORM_NOT_FOUND',
  INACTIVE: 'INACTIVE',
  NO_FILE_UPLOADS: 'NO_FILE_UPLOADS',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  // Stripe
  STRIPE_CLIENT_ERROR: 'STRIPE_CLIENT_ERROR',
  STRIPE_SCA_ERROR: 'STRIPE_SCA_ERROR',
} as const;

// export type FieldErrors<T extends FieldValues> = Record<keyof T, FieldError>;

type FieldError = {
  readonly code: FieldErrorCode | 'UNSPECIFIED';
  readonly message: string;
  // metadata: Record<string, string>;
};

function isFieldErrorCode(code: string): code is FieldErrorCode {
  return code in FieldErrorCodeEnum;
}

export type FieldErrorCode = ValueOf<typeof FieldErrorCodeEnum>;

export const FieldErrorCodeEnum = {
  REQUIRED_FIELD_EMPTY: 'REQUIRED_FIELD_EMPTY',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  TYPE_EMAIL: 'TYPE_EMAIL',
  TYPE_NUMERIC: 'TYPE_NUMERIC',
  TYPE_TEXT: 'TYPE_TEXT',
} as const;

export function isServerErrorResponse(obj: object): obj is ServerErrorResponse {
  return 'error' in obj && typeof obj.error === 'string';
}

export type ServerErrorResponse = {
  error: string;
  errors?: ServerError[];
};

type ServerError = {
  code?: string;
  field?: string;
  message: string;
};

/**
 * Experimenting
 */

// export type FieldValues = Record<string, any>;
export type FieldValues = Record<string, unknown>;
// <TFieldValues extends FieldValues>

type ValueOf<T> = T[keyof T];

/**
 * Draft
 */

export interface StripePaymentError {
  code: 'STRIPE_PAYMENT_ERROR';
  details: {
    stripeCode: string;
  };
  field: 'paymentMethod';
  message: string;
}
