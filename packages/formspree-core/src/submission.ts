import type { PaymentMethodResult } from '@stripe/stripe-js';

export type SubmissionData<T extends FieldValues = FieldValues> = FormData | T;

export type FieldValues = Record<
  string,
  string | number | boolean | null | undefined
>;

export type SubmissionOptions = {
  endpoint?: string;
  clientName?: string;
  createPaymentMethod?: () => Promise<PaymentMethodResult>;
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

type ServerStripePluginPendingResponse = {
  stripe: {
    paymentIntentClientSecret: string;
    requiresAction: boolean;
  };
  resubmitKey: string;
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
      typeof stripe.paymentIntentClientSecret === 'string' &&
      'requiresAction' in stripe &&
      typeof stripe.requiresAction === 'boolean'
    );
  }
  return false;
}

export class SubmissionErrorResult<T extends FieldValues> {
  private formError?: FormError;
  private readonly fieldErrors: Map<keyof T, FieldError> = new Map();

  readonly kind = 'error';

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

  getAllFieldErrors(): [keyof T, FieldError][] {
    return Array.from(this.fieldErrors);
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

export type FormError = {
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

export type FieldError = {
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
  details?: Record<string, string>;
  field?: string;
  message: string;
};

type ValueOf<T> = T[keyof T];
