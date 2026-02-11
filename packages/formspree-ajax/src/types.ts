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
   * Marks an element to display validation errors for a specific field.
   * The attribute value should be the field name.
   *
   * @example
   * ```html
   * <input type="email" name="email" />
   * <span data-fs-error="email"></span>
   * ```
   */
  ERROR: 'data-fs-error',

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
   * Marks an element to display form-level success or error messages.
   * The element's visibility and styling are controlled via the `data-fs-message-type`
   * attribute, which is set programmatically to "success" or "error".
   *
   * @example
   * ```html
   * <div data-fs-message></div>
   * ```
   */
  MESSAGE: 'data-fs-message',
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
   * Custom function to render validation errors in the DOM. If not provided, the default
   * implementation finds elements with `data-fs-error="fieldName"` and populates
   * them with error messages.
   * @param context - The form context containing form element and configuration.
   * @param error - The submission error, or null to clear errors.
   */
  renderErrors?: (
    context: FormContext<T>,
    error: SubmissionError<T> | null
  ) => void;

  /**
   * Custom function to render a form-level message (success or error) in the DOM.
   * If not provided, the default implementation finds an element with `data-fs-message`
   * and sets its text content and `data-fs-message-type` attribute.
   * @param context - The form context containing form element and configuration.
   * @param type - The message type ('success' or 'error'), or null to clear the message.
   * @param message - The message text to display, or null to clear the message.
   */
  renderMessage?: (
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
