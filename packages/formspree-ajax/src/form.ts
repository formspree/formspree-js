import {
  getDefaultClient,
  isSubmissionError,
  appendExtraData,
  type Client,
  type FieldValues,
  type SubmissionError,
  type SubmissionSuccess,
} from '@formspree/core';
import type {
  CamelCaseErrorCode,
  FormConfig,
  FormContext,
  FormElement,
  FormHandle,
} from './types';

/**
 * Converts a SCREAMING_SNAKE_CASE string to camelCase.
 */
const toCamelCase = (str: string): CamelCaseErrorCode => {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    ) as CamelCaseErrorCode;
};

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
 */
const defaultEnable = <T extends FieldValues>(
  context: FormContext<T>
): void => {
  const buttons = context.form.querySelectorAll<HTMLButtonElement>(
    "[type='submit']:disabled"
  );
  buttons.forEach((button) => {
    button.disabled = false;
  });
};

/**
 * Default implementation to disable submit buttons.
 */
const defaultDisable = <T extends FieldValues>(
  context: FormContext<T>
): void => {
  const buttons = context.form.querySelectorAll<HTMLButtonElement>(
    "[type='submit']:enabled"
  );
  buttons.forEach((button) => {
    button.disabled = true;
  });
};

/**
 * Default implementation to render validation errors in the DOM.
 * Finds elements with `data-fs-error="fieldName"` and populates them with error messages.
 */
const defaultRenderErrors = <T extends FieldValues>(
  context: FormContext<T>,
  error: SubmissionError<T> | null
): void => {
  const { form, config } = context;
  const elements = form.querySelectorAll<HTMLElement>('[data-fs-error]');
  const fields = config.fields;

  elements.forEach((element) => {
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

    const firstError = fieldErrors[0];
    const fieldConfig = fields?.[fieldName as keyof T];
    const errorMessages = fieldConfig?.errorMessages ?? {};
    const prettyName = fieldConfig?.prettyName ?? 'This field';
    const code = toCamelCase(firstError.code);
    const customMessage = errorMessages[code];
    const fullMessage = customMessage ?? `${prettyName} ${firstError.message}`;

    element.textContent = fullMessage;
  });
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

  // Clear visible errors before submitting
  renderErrors(context, null);
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
      onError?.(context, result);
    } else {
      if (debug) {
        log('Submission success', result);
      }
      const successHandler = onSuccess ?? defaultOnSuccess;
      successHandler(context, result);
    }
  } catch (err) {
    if (debug) {
      console.error('[formspree-ajax] Unexpected error', err);
    }
    onFailure?.(context, err);
  } finally {
    enable(context);
  }
};

const log = (message: string, data?: unknown): void => {
  console.log(`[formspree-ajax] ${message}`, data ?? '');
};

const DEFAULT_ENDPOINT = 'https://formspree.io';

export const initForm = <T extends FieldValues = FieldValues>(
  config: FormConfig<T>
): FormHandle => {
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
