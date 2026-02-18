import {
  createClient,
  getDefaultClient,
  isSubmissionError,
  appendExtraData,
  type Client,
  type FieldValues,
} from '@formspree/core';
import type { FormConfig, FormContext, FormHandle } from './types';
import {
  buildErrorMessage,
  DEFAULT_ENDPOINT,
  defaultDisable,
  defaultEnable,
  defaultOnSuccess,
  defaultRenderFieldErrors,
  defaultRenderFormError,
  defaultRenderSuccess,
  findSuccessElement,
  getFormElement,
  injectDefaultStyles,
  log,
} from './utils';

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
    renderSuccess = defaultRenderSuccess,
    renderFormError = defaultRenderFormError,
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
  renderSuccess(context, null);
  renderFormError(context, null);
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
        renderFormError(context, buildErrorMessage(result));
      }
      onError?.(context, result);
    } else {
      if (debug) {
        log('Submission success', result);
      }
      renderSuccess(context, 'Thank you!');
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
    renderFormError(context, 'An unexpected error occurred. Please try again.');
    onFailure?.(context, err);
  } finally {
    enable(context);
  }
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
  const client: Client = config.projectId
    ? createClient({ project: config.projectId })
    : getDefaultClient();

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
