import {
  getDefaultClient,
  isSubmissionError,
  appendExtraData,
  type Client,
  type FieldValues,
  type SubmissionError,
  type SubmissionSuccess,
} from '@formspree/core';
import {
  DataAttributes,
  type FormConfig,
  type FormContext,
  type FormElement,
  type FormHandle,
  type MessageType,
} from './types';

const getFormElement = (elementOrSelector: FormElement): HTMLFormElement => {
  if (typeof elementOrSelector === 'string') {
    const element = document.querySelector(elementOrSelector);
    if (!element) {
      throw new Error(`Element "${elementOrSelector}" not found`);
    }
    if (!(element instanceof HTMLFormElement)) {
      throw new Error(`Element "${elementOrSelector}" is not a form element`);
    }
    return element;
  }
  return elementOrSelector;
};

/**
 * Internal marker attribute. Set on elements whose text content was injected
 * by the library (i.e. the element was originally empty). Used to know when
 * it is safe to clear the text on hide — user-provided content is never cleared.
 */
const SERVER_CONTENT_ATTR = 'data-fs-server-content';

/**
 * Shows an element by setting `data-fs-active`.
 * If the element is empty and a message is provided, the message is injected
 * and the element is marked with `data-fs-server-content` so it can be cleared later.
 */
const showElement = (element: HTMLElement, message?: string): void => {
  if (message && element.textContent?.trim() === '') {
    element.textContent = message;
    element.setAttribute(SERVER_CONTENT_ATTR, '');
  }
  element.setAttribute(DataAttributes.ACTIVE, '');
};

/**
 * Hides an element by removing `data-fs-active`.
 * If the text was injected by the library, it is cleared.
 */
const hideElement = (element: HTMLElement): void => {
  element.removeAttribute(DataAttributes.ACTIVE);
  if (element.hasAttribute(SERVER_CONTENT_ATTR)) {
    element.textContent = '';
    element.removeAttribute(SERVER_CONTENT_ATTR);
  }
};

const defaultOnSuccess = <T extends FieldValues>(
  context: FormContext<T>,
  _result: SubmissionSuccess
): void => {
  const { form } = context;
  const replacement = document.createElement('div');
  replacement.textContent = 'Thank you!';
  form.parentNode?.replaceChild(replacement, form);
};

/**
 * Default implementation to enable submit buttons.
 * Restores original button text and re-enables the button.
 */
const defaultEnable = <T extends FieldValues>(
  context: FormContext<T>
): void => {
  const buttons = context.form.querySelectorAll<HTMLButtonElement>(
    `[type='submit']:disabled, [${DataAttributes.SUBMIT_BTN}]:disabled`
  );
  buttons.forEach((button) => {
    const originalText = button.dataset.fsOriginalText;
    if (originalText) {
      button.textContent = originalText;
      delete button.dataset.fsOriginalText;
    }
    button.disabled = false;
  });
};

/**
 * Default implementation to disable submit buttons.
 * Saves original button text, shows a loading spinner, and disables the button.
 */
const defaultDisable = <T extends FieldValues>(
  context: FormContext<T>
): void => {
  const buttons = context.form.querySelectorAll<HTMLButtonElement>(
    `[type='submit']:enabled, [${DataAttributes.SUBMIT_BTN}]:enabled`
  );
  buttons.forEach((button) => {
    button.dataset.fsOriginalText = button.textContent ?? '';
    button.disabled = true;
  });
};

/**
 * Default implementation to render field-level validation errors in the DOM.
 *
 * - Finds elements with `data-fs-error="fieldName"` and shows/hides them.
 *   If the element is empty, injects the first error message from the API.
 *   If the element has user-provided content, shows it as-is.
 * - Sets `aria-invalid="true"` on `data-fs-field` inputs whose `name` matches an errored field.
 */
const defaultRenderFieldErrors = <T extends FieldValues>(
  context: FormContext<T>,
  error: SubmissionError<T> | null
): void => {
  const { form } = context;

  // Handle field error elements (data-fs-error="fieldName")
  const errorElements = form.querySelectorAll<HTMLElement>(
    `[${DataAttributes.ERROR}]`
  );

  errorElements.forEach((element) => {
    const fieldName = element.dataset.fsError;

    // Skip form-level error elements (no value) — handled by renderFormMessage
    if (!fieldName) return;

    if (!error) {
      hideElement(element);
      return;
    }

    const fieldErrors = error.getFieldErrors(fieldName as keyof T);

    if (fieldErrors.length === 0) {
      hideElement(element);
      return;
    }

    showElement(element, fieldErrors[0].message);
  });

  // Handle field elements (aria-invalid)
  const fieldElements = form.querySelectorAll<HTMLElement>(
    `[${DataAttributes.FIELD}]`
  );

  fieldElements.forEach((element) => {
    const fieldName = element.getAttribute('name');

    if (!fieldName) {
      element.removeAttribute('aria-invalid');
      return;
    }

    if (!error) {
      element.removeAttribute('aria-invalid');
      return;
    }

    const fieldErrors = error.getFieldErrors(fieldName as keyof T);

    if (fieldErrors.length === 0) {
      element.removeAttribute('aria-invalid');
      return;
    }

    element.setAttribute('aria-invalid', 'true');
  });
};

/**
 * Finds an element by attribute, searching inside the form first,
 * then in the form's parent container.
 */
const findElement = (
  form: HTMLFormElement,
  selector: string
): HTMLElement | null => {
  return (
    form.querySelector<HTMLElement>(selector) ??
    form.parentElement?.querySelector<HTMLElement>(selector) ??
    null
  );
};

/**
 * Finds the success element (`data-fs-success`) for a form.
 */
const findSuccessElement = (form: HTMLFormElement): HTMLElement | null => {
  return findElement(form, `[${DataAttributes.SUCCESS}]`);
};

/**
 * Finds the form-level error element (`data-fs-error` without a value) for a form.
 */
const findFormErrorElement = (form: HTMLFormElement): HTMLElement | null => {
  return findElement(form, `[${DataAttributes.ERROR}=""]`);
};

/**
 * Default implementation to render form-level messages in the DOM.
 *
 * - On success: shows the `data-fs-success` element.
 * - On error: shows the `data-fs-error` element (without a value).
 * - If the element is empty, injects the provided message.
 * - If the element has user-provided content, shows it as-is.
 */
const defaultRenderFormMessage = <T extends FieldValues>(
  context: FormContext<T>,
  type: MessageType | null,
  message: string | null
): void => {
  const successEl = findSuccessElement(context.form);
  const formErrorEl = findFormErrorElement(context.form);

  if (type === null) {
    if (successEl) hideElement(successEl);
    if (formErrorEl) hideElement(formErrorEl);
    return;
  }

  if (type === 'success') {
    if (formErrorEl) hideElement(formErrorEl);
    if (successEl) showElement(successEl, message ?? undefined);
  } else {
    if (successEl) hideElement(successEl);
    if (formErrorEl) showElement(formErrorEl, message ?? undefined);
  }
};

/**
 * Builds a human-readable error message from a SubmissionError.
 * Only includes form-level errors; field errors are displayed inline via `data-fs-error` elements.
 */
const buildErrorMessage = <T extends FieldValues>(
  error: SubmissionError<T>
): string => {
  const formErrors = error.getFormErrors().map((e) => e.message);
  return formErrors.join(', ') || 'There was an error submitting the form.';
};

const handleSubmit = async <T extends FieldValues>(
  context: FormContext<T>
): Promise<void> => {
  const { formKey, endpoint, client, config } = context;
  const {
    debug,
    data,
    onSubmit,
    onSuccess,
    onError,
    onFailure,
    enable = defaultEnable,
    disable = defaultDisable,
    renderFieldErrors = defaultRenderFieldErrors,
    renderFormMessage = defaultRenderFormMessage,
  } = config;

  const formData = new FormData(context.form);

  if (data) {
    for (const [key, value] of Object.entries(data)) {
      let resolved: string | undefined;
      if (typeof value === 'function') {
        resolved = await value();
      } else {
        resolved = value;
      }
      if (resolved !== undefined) {
        appendExtraData(formData, key, resolved);
      }
    }
  }

  // Clear visible errors and messages before submitting
  renderFieldErrors(context, null);
  renderFormMessage(context, null, null);
  disable(context);
  onSubmit?.(context);

  if (debug) {
    log('Submitting form', { formKey, formData });
  }

  try {
    const result = await client.submitForm<T>(formKey, formData, {
      clientName: '@formspree/ajax',
      endpoint,
    });

    if (isSubmissionError(result)) {
      if (debug) {
        log('Submission error', result);
      }
      if (result.getAllFieldErrors().length > 0) {
        renderFieldErrors(context, result);
      }
      if (result.getFormErrors().length > 0) {
        renderFormMessage(context, 'error', buildErrorMessage(result));
      }
      onError?.(context, result);
    } else {
      if (debug) {
        log('Submission success', result);
      }
      renderFormMessage(context, 'success', 'Thank you!');
      if (onSuccess) {
        onSuccess(context, result);
      } else if (findSuccessElement(context.form)) {
        context.form.reset();
      } else {
        defaultOnSuccess(context, result);
      }
    }
  } catch (err) {
    if (debug) {
      console.error('[formspree-ajax] Unexpected error', err);
    }
    renderFormMessage(
      context,
      'error',
      'An unexpected error occurred. Please try again.'
    );
    onFailure?.(context, err);
  } finally {
    enable(context);
  }
};

const log = (message: string, data?: unknown): void => {
  console.log(`[formspree-ajax] ${message}`, data ?? '');
};

const DEFAULT_ENDPOINT = 'https://formspree.io';

/**
 * Flag to track whether default styles have been injected.
 */
let stylesInjected = false;

/**
 * Injects default Formspree styles into the document head.
 * Only runs once per page load.
 */
const injectDefaultStyles = (): void => {
  if (stylesInjected || typeof document === 'undefined') {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-formspree-styles', '');
  styleElement.textContent = `
    [${DataAttributes.ERROR}],
    [${DataAttributes.SUCCESS}] {
      display: none;
    }

    [${DataAttributes.ERROR}][${DataAttributes.ACTIVE}] {
      display: block;
      color: #dc3545;
    }

    [${DataAttributes.ERROR}=""][${DataAttributes.ACTIVE}] {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
    }

    [${DataAttributes.ERROR}]:not([${DataAttributes.ERROR}=""])[${DataAttributes.ACTIVE}] {
      font-size: 12px;
      margin-top: 4px;
    }

    [${DataAttributes.SUCCESS}][${DataAttributes.ACTIVE}] {
      display: block;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    [${DataAttributes.FIELD}][aria-invalid="true"] {
      border-color: #dc3545;
    }
  `;

  document.head.appendChild(styleElement);
  stylesInjected = true;
};

export const initForm = <T extends FieldValues = FieldValues>(
  config: FormConfig<T>
): FormHandle => {
  if (config.useDefaultStyles !== false) {
    injectDefaultStyles();
  }

  if (!config.formElement) {
    throw new Error('You must provide a `formElement` in the config');
  }

  if (!config.formId) {
    throw new Error('You must provide a `formId` in the config');
  }

  const form = getFormElement(config.formElement);
  const formKey = config.formId;
  const endpoint = config.origin ?? DEFAULT_ENDPOINT;
  const client: Client = getDefaultClient();

  const context: FormContext<T> = {
    form,
    formKey,
    endpoint,
    client,
    config,
  };

  const enable = config.enable ?? defaultEnable;

  if (config.debug) {
    log('Initializing form', context);
  }

  const submitHandler = (event: Event): void => {
    event.preventDefault();
    handleSubmit(context);
  };

  form.addEventListener('submit', submitHandler);
  enable(context);
  config.onInit?.(context);

  return {
    destroy: () => {
      form.removeEventListener('submit', submitHandler);
    },
  };
};
