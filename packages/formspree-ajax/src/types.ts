import type {
  Client,
  FieldValues,
  SubmissionError,
  SubmissionSuccess,
} from '@formspree/core';

/**
 * Data attributes used by @formspree/ajax for DOM element identification.
 * These attributes enable declarative form behavior without JavaScript configuration.
 */
export const DataAttributes = {
  /**
   * Marks an element to display errors.
   *
   * **With a value** (`data-fs-error="fieldName"`) — displays field-level validation errors
   * for the named field. If the element has content, it is shown/hidden as-is.
   * If the element is empty, the error message from the API is injected.
   *
   * **Without a value** (`data-fs-error`) — displays form-level errors (errors without
   * a `field` property in the API response). Same content policy applies.
   *
   * Elements are hidden by default and shown via the `data-fs-active` attribute.
   *
   * @example Field-level error
   * ```html
   * <input type="email" name="email" />
   * <span data-fs-error="email"></span>
   * ```
   *
   * @example Form-level error with custom message
   * ```html
   * <div data-fs-error>Whoops! Something went wrong.</div>
   * ```
   */
  ERROR: 'data-fs-error',

  /**
   * Marks an element to display a success message after a successful submission.
   * If the element has content, it is shown/hidden as-is. If the element is empty,
   * a default "Thank you!" message is injected.
   *
   * Elements are hidden by default and shown via the `data-fs-active` attribute.
   *
   * @example With custom message
   * ```html
   * <div data-fs-success>Thanks for reaching out!</div>
   * ```
   *
   * @example Without content (uses default message)
   * ```html
   * <div data-fs-success></div>
   * ```
   */
  SUCCESS: 'data-fs-success',

  /**
   * Marks an input element to receive `aria-invalid="true"` when validation fails.
   * The field name is read from the element's `name` attribute.
   *
   * @example
   * ```html
   * <input type="email" name="email" data-fs-field />
   * ```
   *
   * @example CSS for styling invalid fields
   * ```css
   * [data-fs-field][aria-invalid="true"] {
   *   border-color: red;
   * }
   * ```
   */
  FIELD: 'data-fs-field',

  /**
   * Marks a button to be automatically disabled during form submission
   * and re-enabled when the submission completes.
   *
   * @example
   * ```html
   * <button type="submit" data-fs-submit-btn>Send</button>
   * ```
   */
  SUBMIT_BTN: 'data-fs-submit-btn',

  /**
   * Programmatically set on `data-fs-error` and `data-fs-success` elements to
   * control their visibility. Added when the element should be shown, removed
   * when it should be hidden.
   *
   * @example CSS (default styles are injected automatically)
   * ```css
   * [data-fs-error]:not([data-fs-active]),
   * [data-fs-success]:not([data-fs-active]) {
   *   display: none;
   * }
   * ```
   */
  ACTIVE: 'data-fs-active',
} as const;

/**
 * Represents a form element, either as a direct HTMLFormElement reference or a CSS selector string.
 */
export type FormElement = HTMLFormElement | string;

/**
 * The type of form-level message to display.
 * - `'success'` — shown after a successful submission
 * - `'error'` — shown after a validation or unexpected error
 */
export type MessageType = 'success' | 'error';

/**
 * Configuration options for initializing a Formspree form.
 * @template T - The type of field values for the form, defaults to FieldValues.
 */
export interface FormConfig<T extends FieldValues = FieldValues> {
  /**
   * The Formspree project ID. When provided, submissions are sent to
   * `/p/{projectId}/f/{formId}` instead of `/f/{formId}`.
   */
  projectId?: string;

  /**
   * The form element to attach to, either as an HTMLFormElement or a CSS selector string.
   */
  formElement: FormElement;

  /**
   * The Formspree form ID (e.g., "zkrvodeq").
   */
  formId: string;

  /**
   * The Formspree API origin URL. Defaults to "https://formspree.io".
   */
  origin?: string;

  /**
   * Extra data to include with form submissions. Can be a static object or a function
   * that returns data based on the form context.
   */
  data?: ExtraData;

  /**
   * When true, enables debug logging for form submissions.
   */
  debug?: boolean;

  /**
   * When true, injects default CSS styles for error messages, success banners,
   * invalid field borders, and the loading spinner. Set to `false` to provide
   * your own styles. Defaults to `true`.
   */
  useDefaultStyles?: boolean;

  /**
   * Callback invoked when the form is initialized.
   * @param context - The form context containing form element and configuration.
   */
  onInit?: (context: FormContext<T>) => void;

  /**
   * Callback invoked when the form is submitted, before the submission is sent.
   * @param context - The form context containing form element and configuration.
   */
  onSubmit?: (context: FormContext<T>) => void;

  /**
   * Callback invoked when the form submission succeeds.
   * @param context - The form context containing form element and configuration.
   * @param result - The successful submission result.
   */
  onSuccess?: (context: FormContext<T>, result: SubmissionSuccess) => void;

  /**
   * Callback invoked when the form submission fails with validation errors.
   *
   * The Formspree API returns errors in the following format:
   * ```json
   * {
   *   "error": "Validation errors",
   *   "errors": [
   *     { "code": "TYPE_EMAIL", "field": "email", "message": "should be an email" },
   *     { "code": "EMPTY", "message": "empty form" }
   *   ]
   * }
   * ```
   *
   * These are parsed into a `SubmissionError` object with two categories:
   *
   * **Form errors** — errors without a `field` property (access via `error.getFormErrors()`):
   * **Field errors** — errors with a `field` property (access via `error.getFieldErrors(field)` or `error.getAllFieldErrors()`):
   *
   * @see https://help.formspree.io/hc/en-us/articles/360055613373-The-Formspree-React-library#errorcodes
   * @param context - The form context containing form element and configuration.
   * @param error - The submission error details from Formspree.
   */
  onError?: (context: FormContext<T>, error: SubmissionError<T>) => void;

  /**
   * Callback invoked when an unexpected error occurs (e.g., network failure).
   * @param context - The form context containing form element and configuration.
   * @param error - The unexpected error that occurred.
   */
  onFailure?: (context: FormContext<T>, error: unknown) => void;

  /**
   * Custom function to enable submit buttons. If not provided, the default implementation
   * enables all disabled submit buttons within the form.
   * @param context - The form context containing form element and configuration.
   */
  enable?: (context: FormContext<T>) => void;

  /**
   * Custom function to disable submit buttons. If not provided, the default implementation
   * disables all enabled submit buttons within the form.
   * @param context - The form context containing form element and configuration.
   */
  disable?: (context: FormContext<T>) => void;

  /**
   * Custom function to render field-level validation errors in the DOM.
   * Only called when the API response contains field errors (errors with a `field` property).
   *
   * If not provided, the default implementation:
   * - Finds elements with `data-fs-error="fieldName"` and shows them (with `data-fs-active`)
   * - If the element is empty, sets its text to the first error message from the API
   * - If the element already has content, shows it as-is without overriding
   * - Sets `aria-invalid="true"` on `data-fs-field` inputs whose `name` matches an errored field
   *
   * Called with `null` to clear errors before each submission.
   *
   * @param context - The form context containing form element and configuration.
   * @param error - The submission error containing field errors (use `error.getFieldErrors(field)`
   *   or `error.getAllFieldErrors()`), or `null` to clear errors.
   */
  renderFieldErrors?: (
    context: FormContext<T>,
    error: SubmissionError<T> | null
  ) => void;

  /**
   * Custom function to render form-level messages (success or error) in the DOM.
   * Called on success (to show `data-fs-success`) or on form-level errors (to show `data-fs-error`).
   *
   * If not provided, the default implementation:
   * - On success: shows the `data-fs-success` element (with `data-fs-active`)
   * - On error: shows the `data-fs-error` element (without a value, i.e. form-level)
   * - If the element is empty, sets its text to the provided message
   * - If the element already has content, shows it as-is without overriding
   *
   * Called with `null` to clear messages before each submission.
   *
   * @param context - The form context containing form element and configuration.
   * @param type - The message type ('success' or 'error'), or null to clear messages.
   * @param message - The message text to display (used only if the element is empty), or null to clear.
   */
  renderFormMessage?: (
    context: FormContext<T>,
    type: MessageType | null,
    message: string | null
  ) => void;
}

/**
 * A single extra data value. Can be a static string, undefined (to skip),
 * a function returning a string or undefined, or an async function.
 */
export type ExtraDataValue =
  | undefined
  | string
  | (() => string)
  | (() => Promise<string>)
  | (() => undefined)
  | (() => Promise<undefined>);

/**
 * Extra data to be merged with form data on submission.
 * Each key maps to an {@link ExtraDataValue}.
 */
export type ExtraData = {
  [key: string]: ExtraDataValue;
};

/**
 * Context object passed to form lifecycle callbacks.
 * @template T - The type of field values for the form.
 */
export interface FormContext<T extends FieldValues = FieldValues> {
  /**
   * The HTML form element being managed.
   */
  form: HTMLFormElement;

  /**
   * The Formspree form key.
   */
  formKey: string;

  /**
   * The Formspree endpoint URL (e.g., "https://formspree.io" or "https://staging.formspree.io").
   */
  endpoint: string;

  /**
   * The Formspree client instance used for submissions.
   */
  client: Client;

  /**
   * The configuration options passed when initializing the form.
   */
  config: FormConfig<T>;
}

/**
 * Handle returned when initializing a form, providing methods to control the form lifecycle.
 */
export interface FormHandle {
  /**
   * Removes all event listeners and cleans up resources associated with the form.
   * Call this when the form is no longer needed to prevent memory leaks.
   */
  destroy: () => void;
}
