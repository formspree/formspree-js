import type { PaymentMethodResult } from '@stripe/stripe-js';

export type SubmissionData<T extends FieldValues = FieldValues> = FormData | T;

export type FieldValues = Record<
  string,
  string | number | boolean | null | undefined
>;

export type SubmissionOptions = {
  clientName?: string;
  createPaymentMethod?: () => Promise<PaymentMethodResult>;
  endpoint?: string;
};

export type SubmissionResult<T extends FieldValues> =
  | SubmissionRedirectResult
  | SubmissionStripePluginPendingResult
  | SubmissionErrorResult<T>;

export class SubmissionRedirectResult {
  readonly kind = 'redirect';
  readonly next: string;

  constructor(serverResponse: ServerRedirectResponse) {
    this.next = serverResponse.next;
  }
}

type ServerRedirectResponse = { next: string };

export function isServerRedirectResponse(
  obj: object
): obj is ServerRedirectResponse {
  return 'next' in obj && typeof obj.next === 'string';
}

export class SubmissionStripePluginPendingResult {
  readonly kind = 'stripePluginPending';

  constructor(
    readonly paymentIntentClientSecret: string,
    readonly resubmitKey: string
  ) {}
}

export type ServerStripePluginPendingResponse = {
  resubmitKey: string;
  stripe: { paymentIntentClientSecret: string };
};

export function isServerStripePluginPendingResponse(
  obj: object
): obj is ServerStripePluginPendingResponse {
  if (
    'stripe' in obj &&
    'resubmitKey' in obj &&
    typeof obj.resubmitKey === 'string'
  ) {
    const { stripe } = obj;
    return (
      typeof stripe === 'object' &&
      stripe != null &&
      'paymentIntentClientSecret' in stripe &&
      typeof stripe.paymentIntentClientSecret === 'string'
    );
  }
  return false;
}

export class SubmissionErrorResult<T extends FieldValues> {
  readonly kind = 'error';

  private readonly formErrors: FormError[] = [];
  private readonly fieldErrors: Map<keyof T, FieldError[]> = new Map();

  constructor(...serverErrors: ServerError[]) {
    for (const err of serverErrors) {
      // form errors
      if (!err.field) {
        this.formErrors.push({
          code:
            err.code && isFormErrorCode(err.code) ? err.code : 'UNSPECIFIED',
          message: err.message,
        });
        continue;
      }

      const fieldErrors = this.fieldErrors.get(err.field) ?? [];
      fieldErrors.push({
        code: err.code && isFieldErrorCode(err.code) ? err.code : 'UNSPECIFIED',
        message: err.message,
      });
      this.fieldErrors.set(err.field, fieldErrors);
    }
  }

  getFormErrors(): readonly FormError[] {
    return [...this.formErrors];
  }

  getFieldErrors<K extends keyof T>(field: K): readonly FieldError[] {
    return this.fieldErrors.get(field) ?? [];
  }

  getAllFieldErrors(): readonly [keyof T, readonly FieldError[]][] {
    return Array.from(this.fieldErrors);
  }
}

export const emptySubmissionErrorResult = new SubmissionErrorResult();

export type FormError = {
  readonly code: FormErrorCode | 'UNSPECIFIED';
  readonly message: string;
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

export type FieldError = {
  readonly code: FieldErrorCode | 'UNSPECIFIED';
  readonly message: string;
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
  // Stripe
  STRIPE_CLIENT_ERROR: 'STRIPE_CLIENT_ERROR',
  STRIPE_SCA_ERROR: 'STRIPE_SCA_ERROR',
} as const;

export function isServerErrorResponse(obj: object): obj is ServerErrorResponse {
  return (
    ('errors' in obj &&
      Array.isArray(obj.errors) &&
      obj.errors.every((err) => typeof err.message === 'string')) ||
    ('error' in obj && typeof obj.error === 'string')
  );
}

export type ServerErrorResponse = {
  error: string;
  errors?: ServerError[];
};

type ServerError = {
  code?: string;
  details?: Record<string, string>;
  field?: string;
  message: string;
};

type ValueOf<T> = T[keyof T];
