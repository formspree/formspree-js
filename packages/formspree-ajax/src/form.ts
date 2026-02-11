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
    button.innerHTML = '<span class="fs-spinner"></span>Sending...';
    button.disabled = true;
  });
};

/**
 * Default implementation to render validation errors in the DOM.
 * - Finds elements with `data-fs-error="fieldName"` and populates them with error messages.
 * - Finds elements with `data-fs-field="fieldName"` and sets `aria-invalid="true"` on error.
 */
const defaultRenderErrors = <T extends FieldValues>(
  context: FormContext<T>,
  error: SubmissionError<T> | null
): void => {
  const { form } = context;

  // Handle error message elements
  const errorElements = form.querySelectorAll<HTMLElement>(
    `[${DataAttributes.ERROR}]`
  );

  errorElements.forEach((element) => {
    const fieldName = element.dataset.fsError;

    if (!fieldName) {
      element.innerHTML = '';
      return;
    }

    if (!error) {
      element.innerHTML = '';
      return;
    }

    const fieldErrors = error.getFieldErrors(fieldName as keyof T);

    if (fieldErrors.length === 0) {
      element.innerHTML = '';
      return;
    }

    element.textContent = fieldErrors[0].message;
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
 * Finds the message element for a form.
 * Searches inside the form first, then in the form's parent container.
 */
const findMessageElement = (form: HTMLFormElement): HTMLElement | null => {
  return (
    form.querySelector<HTMLElement>(`[${DataAttributes.MESSAGE}]`) ??
    form.parentElement?.querySelector<HTMLElement>(
      `[${DataAttributes.MESSAGE}]`
    ) ??
    null
  );
};

/**
 * Default implementation to render a form-level message in the DOM.
 * Sets the text content and `data-fs-message-type` attribute on the message element.
 */
const defaultRenderMessage = <T extends FieldValues>(
  context: FormContext<T>,
  type: MessageType | null,
  message: string | null
): void => {
  const messageEl = findMessageElement(context.form);
  if (!messageEl) return;

  if (type === null) {
    messageEl.textContent = '';
    messageEl.removeAttribute('data-fs-message-type');
  } else {
    messageEl.textContent = message ?? '';
    messageEl.setAttribute('data-fs-message-type', type);
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
    renderErrors = defaultRenderErrors,
    renderMessage = defaultRenderMessage,
  } = config;

  const formData = new FormData(context.form);

  if (data) {
    const extraData = typeof data === 'function' ? data(context) : data;
    for (const [key, value] of Object.entries(extraData)) {
      if (value !== undefined && value !== null) {
        appendExtraData(formData, key, String(value));
      }
    }
  }

  // Clear visible errors and messages before submitting
  renderErrors(context, null);
  renderMessage(context, null, null);
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
      renderErrors(context, result);
      renderMessage(context, 'error', buildErrorMessage(result));
      onError?.(context, result);
    } else {
      if (debug) {
        log('Submission success', result);
      }
      renderMessage(context, 'success', 'Thank you!');
      if (onSuccess) {
        onSuccess(context, result);
      } else if (findMessageElement(context.form)) {
        context.form.reset();
      } else {
        defaultOnSuccess(context, result);
      }
    }
  } catch (err) {
    if (debug) {
      console.error('[formspree-ajax] Unexpected error', err);
    }
    renderMessage(
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
    [${DataAttributes.ERROR}] {
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
      display: block;
      min-height: 16px;
    }

    [${DataAttributes.FIELD}][aria-invalid="true"] {
      border-color: #dc3545;
    }

    [${DataAttributes.MESSAGE}] {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }

    [${DataAttributes.MESSAGE}][data-fs-message-type="success"] {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      display: block;
    }

    [${DataAttributes.MESSAGE}][data-fs-message-type="error"] {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      display: block;
    }

    .fs-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: fs-spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes fs-spin {
      to { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(styleElement);
  stylesInjected = true;
};

export const initForm = <T extends FieldValues = FieldValues>(
  config: FormConfig<T>
): FormHandle => {
  injectDefaultStyles();

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
