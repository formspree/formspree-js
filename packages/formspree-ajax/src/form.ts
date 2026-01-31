import {
  getDefaultClient,
  isSubmissionError,
  appendExtraData,
  type Client,
  type FieldValues,
  type SubmissionSuccess,
} from '@formspree/core';
import type { FormConfig, FormContext, FormElement, FormHandle } from './types';

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

const enableSubmitButtons = (form: HTMLFormElement): void => {
  const buttons = form.querySelectorAll<HTMLButtonElement>(
    "[type='submit']:disabled"
  );
  buttons.forEach((button) => {
    button.disabled = false;
  });
};

const disableSubmitButtons = (form: HTMLFormElement): void => {
  const buttons = form.querySelectorAll<HTMLButtonElement>(
    "[type='submit']:enabled"
  );
  buttons.forEach((button) => {
    button.disabled = true;
  });
};

const handleSubmit = async <T extends FieldValues>(
  context: FormContext<T>
): Promise<void> => {
  const { form, formKey, endpoint, client, config } = context;
  const { debug, data, onSubmit, onSuccess, onError, onFailure } = config;

  const formData = new FormData(form);

  if (data) {
    const extraData = typeof data === 'function' ? data(context) : data;
    for (const [key, value] of Object.entries(extraData)) {
      if (value !== undefined && value !== null) {
        appendExtraData(formData, key, String(value));
      }
    }
  }

  disableSubmitButtons(form);
  onSubmit?.(context);

  if (debug) {
    console.log('[formspree-ajax] Submitting form', { formKey, formData });
  }

  try {
    const result = await client.submitForm<T>(formKey, formData, {
      clientName: '@formspree/ajax',
      endpoint,
    });

    if (isSubmissionError(result)) {
      if (debug) {
        console.log('[formspree-ajax] Submission error', result);
      }
      onError?.(context, result);
    } else {
      if (debug) {
        console.log('[formspree-ajax] Submission success', result);
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
    enableSubmitButtons(form);
  }
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

  if (config.debug) {
    console.log('[formspree-ajax] Initializing form', context);
  }

  const submitHandler = (event: Event): void => {
    event.preventDefault();
    handleSubmit(context);
  };

  form.addEventListener('submit', submitHandler);
  enableSubmitButtons(form);
  config.onInit?.(context);

  return {
    destroy: () => {
      form.removeEventListener('submit', submitHandler);
    },
  };
};
