import * as Forms from '@formspree/core/forms';

export { isFieldError } from '@formspree/core/forms';

export type FormError = Forms.FormError;
export type FieldError = Forms.FieldError;

// @deprecated
// Will be removed in next major version
export type ErrorPayload = Forms.FormError;
