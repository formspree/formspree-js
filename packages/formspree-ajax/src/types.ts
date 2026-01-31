import type {
  Client,
  FieldValues,
  SubmissionError,
  SubmissionSuccess,
} from '@formspree/core';

/**
 * Represents a form element, either as a direct HTMLFormElement reference or a CSS selector string.
 */
export type FormElement = HTMLFormElement | string;

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
  data?: ExtraData<T>;

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
}

/**
 * Extra data to be merged with form data on submission.
 * Can be a partial object of field values or a function that dynamically generates
 * extra data based on the form context.
 * @template T - The type of field values for the form.
 */
export type ExtraData<T extends FieldValues = FieldValues> =
  | Partial<T>
  | ((context: FormContext<T>) => Partial<T>);

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
