import * as Forms from '@formspree/core';

export { isFieldError } from '@formspree/core';

export type FormError = Forms.FormError;
export type FieldError = Forms.FieldError;

/**
 * ExtraData values can be strings or functions that return a string, or a
 * promise that resolves to a string. Errors should be handled internally.
 * Functions can return undefined to skip this ExtraData value.
 */
export type ExtraDataValue =
  | string
  | (() => string)
  | (() => Promise<string>)
  | (() => undefined)
  | (() => Promise<undefined>);

export type ExtraData = {
  [key: string]: ExtraDataValue;
};

// @deprecated
// Will be removed in next major version
export type ErrorPayload = Forms.FormError;
