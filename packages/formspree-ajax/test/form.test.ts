import { initForm } from '../src/form';
import { getDefaultClient } from '@formspree/core';

// Mock @formspree/core
jest.mock('@formspree/core', () => {
  const mockClient = {
    submitForm: jest.fn(),
  };
  return {
    getDefaultClient: jest.fn(() => mockClient),
    isSubmissionError: (result: unknown) =>
      result instanceof Object && (result as { kind: string }).kind === 'error',
    appendExtraData: jest.fn(
      (formData: FormData, key: string, value: string) => {
        formData.append(key, value);
      }
    ),
    SubmissionError: jest.fn().mockImplementation(() => ({
      kind: 'error',
      getFormErrors: () => [],
      getAllFieldErrors: () => [],
      getFieldErrors: () => [],
    })),
  };
});

describe('initForm', () => {
  let container: HTMLDivElement;
  let form: HTMLFormElement;
  let mockClient: { submitForm: jest.Mock };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a DOM container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create a form element
    form = document.createElement('form');
    form.id = 'test-form';
    form.innerHTML = `
      <input type="text" name="name" value="John" />
      <input type="email" name="email" value="john@example.com" />
      <button type="submit">Submit</button>
    `;
    container.appendChild(form);

    // Get mock client
    mockClient = getDefaultClient() as unknown as { submitForm: jest.Mock };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('form element resolution', () => {
    it('accepts an HTMLFormElement directly', () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      expect(handle).toBeDefined();
      expect(handle.destroy).toBeInstanceOf(Function);
      handle.destroy();
    });

    it('accepts a CSS selector string', () => {
      const handle = initForm({
        formElement: '#test-form',
        formId: 'xyzabc',
      });

      expect(handle).toBeDefined();
      handle.destroy();
    });

    it('throws when selector does not match any element', () => {
      expect(() =>
        initForm({
          formElement: '#non-existent-form',
          formId: 'xyzabc',
        })
      ).toThrow('Element "#non-existent-form" not found');
    });

    it('throws when selector matches a non-form element', () => {
      const div = document.createElement('div');
      div.id = 'not-a-form';
      container.appendChild(div);

      expect(() =>
        initForm({
          formElement: '#not-a-form',
          formId: 'xyzabc',
        })
      ).toThrow('Element "#not-a-form" is not a form element');
    });
  });

  describe('configuration validation', () => {
    it('throws when formElement is not provided', () => {
      expect(() =>
        initForm({
          formElement: undefined as unknown as string,
          formId: 'xyzabc',
        })
      ).toThrow('You must provide a `formElement` in the config');
    });

    it('throws when formId is not provided', () => {
      expect(() =>
        initForm({
          formElement: form,
          formId: undefined as unknown as string,
        })
      ).toThrow('You must provide a `formId` in the config');
    });
  });

  describe('lifecycle callbacks', () => {
    it('calls onInit with the form context', () => {
      const onInit = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onInit,
      });

      expect(onInit).toHaveBeenCalledTimes(1);
      expect(onInit).toHaveBeenCalledWith(
        expect.objectContaining({
          form,
          formKey: 'xyzabc',
          client: expect.any(Object),
          config: expect.objectContaining({
            formElement: form,
            formId: 'xyzabc',
          }),
        })
      );
      handle.destroy();
    });

    it('enables submit buttons on initialization', () => {
      const submitButton = form.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;
      submitButton.disabled = true;

      initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('form submission', () => {
    it('prevents default form submission', () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      const event = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      form.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      handle.destroy();
    });

    it('calls onSubmit before submission', async () => {
      const onSubmit = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onSubmit,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          form,
          formKey: 'xyzabc',
        })
      );
      handle.destroy();
    });

    it('disables submit buttons and shows spinner during submission', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      let resolveSubmit: (value: { kind: string }) => void;
      mockClient.submitForm.mockReturnValue(
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
      );

      const submitButton = form.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
      const originalText = submitButton.textContent;

      form.dispatchEvent(new Event('submit'));

      // Button should be disabled with spinner during submission
      expect(submitButton.disabled).toBe(true);
      expect(submitButton.innerHTML).toContain('fs-spinner');
      expect(submitButton.textContent).toContain('Sending...');

      // Resolve the submission
      resolveSubmit!({ kind: 'success' });
      await flushPromises();

      // Button should be re-enabled with original text after submission
      expect(submitButton.disabled).toBe(false);
      expect(submitButton.textContent).toBe(originalText);
      handle.destroy();
    });

    it('calls onSuccess on successful submission', async () => {
      const onSuccess = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onSuccess,
      });

      const successResult = { kind: 'success', next: '/thank-you' };
      mockClient.submitForm.mockResolvedValue(successResult);

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ form }),
        successResult
      );
      handle.destroy();
    });

    it('uses default onSuccess when not provided', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Default behavior replaces form with "Thank you!" message
      expect(container.textContent).toContain('Thank you!');
      expect(container.querySelector('form')).toBeNull();
      handle.destroy();
    });

    it('calls onError on submission error', async () => {
      const onError = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onError,
      });

      const errorResult = {
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [],
      };
      mockClient.submitForm.mockResolvedValue(errorResult);

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ form }),
        errorResult
      );
      handle.destroy();
    });

    it('calls onFailure on unexpected errors', async () => {
      const onFailure = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onFailure,
      });

      const unexpectedError = new Error('Network error');
      mockClient.submitForm.mockRejectedValue(unexpectedError);

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(onFailure).toHaveBeenCalledWith(
        expect.objectContaining({ form }),
        unexpectedError
      );
      handle.destroy();
    });
  });

  describe('extra data', () => {
    it('includes static string values', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        data: { source: 'website', campaign: 'summer2024' },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(mockClient.submitForm).toHaveBeenCalledWith(
        'xyzabc',
        expect.any(FormData),
        expect.objectContaining({ clientName: '@formspree/ajax' })
      );

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('source')).toBe('website');
      expect(submittedFormData.get('campaign')).toBe('summer2024');
      handle.destroy();
    });

    it('resolves function values', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        data: {
          fnToString: () => 'fn-value',
        },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('fnToString')).toBe('fn-value');
      handle.destroy();
    });

    it('resolves async function values', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        data: {
          asyncValue: async () => 'async-result',
        },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('asyncValue')).toBe('async-result');
      handle.destroy();
    });

    it('skips undefined values from all sources', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        data: {
          justString: 'included',
          justUndefined: undefined,
          fnToUndefined: () => undefined,
          asyncFnToUndefined: async () => undefined,
        },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('justString')).toBe('included');
      expect(submittedFormData.has('justUndefined')).toBe(false);
      expect(submittedFormData.has('fnToUndefined')).toBe(false);
      expect(submittedFormData.has('asyncFnToUndefined')).toBe(false);
      handle.destroy();
    });

    it('appends all extra data types together', async () => {
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        data: {
          justString: 'just-string',
          justUndefined: undefined,
          fnToString: () => 'fn-to-string',
          fnToUndefined: () => undefined,
          asyncFnToString: async () => 'async-fn-to-string',
          asyncFnToUndefined: async () => undefined,
        },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('justString')).toBe('just-string');
      expect(submittedFormData.get('fnToString')).toBe('fn-to-string');
      expect(submittedFormData.get('asyncFnToString')).toBe(
        'async-fn-to-string'
      );
      expect(submittedFormData.has('justUndefined')).toBe(false);
      expect(submittedFormData.has('fnToUndefined')).toBe(false);
      expect(submittedFormData.has('asyncFnToUndefined')).toBe(false);
      handle.destroy();
    });
  });

  describe('debug mode', () => {
    it('logs initialization when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        debug: true,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[formspree-ajax] Initializing form',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
      handle.destroy();
    });

    it('logs submission when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        debug: true,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[formspree-ajax] Submitting form',
        expect.objectContaining({ formKey: 'xyzabc' })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '[formspree-ajax] Submission success',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
      handle.destroy();
    });

    it('logs errors when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        debug: true,
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [],
        getFieldErrors: () => [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[formspree-ajax] Submission error',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
      handle.destroy();
    });

    it('logs unexpected errors when debug is enabled', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        debug: true,
      });

      mockClient.submitForm.mockRejectedValue(new Error('Network error'));

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[formspree-ajax] Unexpected error',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      handle.destroy();
    });
  });

  describe('error rendering', () => {
    it('renders errors to data-fs-error elements', async () => {
      // Add error containers
      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      form.appendChild(emailError);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'is invalid' }]],
        ],
        getFieldErrors: (field: string) =>
          field === 'email'
            ? [{ code: 'TYPE_EMAIL', message: 'is invalid' }]
            : [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(emailError.textContent).toBe('is invalid');
      handle.destroy();
    });

    it('clears errors before submission', async () => {
      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      emailError.textContent = 'Previous error';
      form.appendChild(emailError);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Error should be cleared (form replaced by success message in this case)
      handle.destroy();
    });

    it('sets aria-invalid on data-fs-field elements when field has errors', async () => {
      // Add data-fs-field marker attribute to existing inputs
      const emailInput = form.querySelector(
        'input[name="email"]'
      ) as HTMLInputElement;
      emailInput.setAttribute('data-fs-field', '');

      const nameInput = form.querySelector(
        'input[name="name"]'
      ) as HTMLInputElement;
      nameInput.setAttribute('data-fs-field', '');

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'is invalid' }]],
        ],
        getFieldErrors: (field: string) =>
          field === 'email'
            ? [{ code: 'TYPE_EMAIL', message: 'is invalid' }]
            : [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Email should be marked invalid
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      // Name should NOT be marked invalid (no errors for it)
      expect(nameInput.hasAttribute('aria-invalid')).toBe(false);
      handle.destroy();
    });

    it('removes aria-invalid when errors are cleared', async () => {
      const emailInput = form.querySelector(
        'input[name="email"]'
      ) as HTMLInputElement;
      emailInput.setAttribute('data-fs-field', '');
      emailInput.setAttribute('aria-invalid', 'true');

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // aria-invalid should be removed after successful submission
      expect(emailInput.hasAttribute('aria-invalid')).toBe(false);
      handle.destroy();
    });

    it('clears error elements when no errors for that field', async () => {
      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      form.appendChild(emailError);

      const nameError = document.createElement('span');
      nameError.dataset.fsError = 'name';
      nameError.textContent = 'Should be cleared';
      form.appendChild(nameError);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'is invalid' }]],
        ],
        getFieldErrors: (field: string) =>
          field === 'email'
            ? [{ code: 'TYPE_EMAIL', message: 'is invalid' }]
            : [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(emailError.textContent).toBe('is invalid');
      expect(nameError.innerHTML).toBe('');
      handle.destroy();
    });
  });

  describe('message rendering', () => {
    it('shows success message on data-fs-message after successful submission', async () => {
      const messageEl = document.createElement('div');
      messageEl.setAttribute('data-fs-message', '');
      container.appendChild(messageEl);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onSuccess: ({ form }) => {
          form.reset();
        },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(messageEl.textContent).toBe('Thank you!');
      expect(messageEl.getAttribute('data-fs-message-type')).toBe('success');
      handle.destroy();
    });

    it('shows only form errors on data-fs-message (not field errors)', async () => {
      const messageEl = document.createElement('div');
      messageEl.setAttribute('data-fs-message', '');
      container.appendChild(messageEl);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [
          { code: 'INACTIVE', message: 'Form is disabled' },
        ],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'must be an email' }]],
        ],
        getFieldErrors: (field: string) =>
          field === 'email'
            ? [{ code: 'TYPE_EMAIL', message: 'must be an email' }]
            : [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // data-fs-message should only show form-level errors
      expect(messageEl.textContent).toBe('Form is disabled');
      expect(messageEl.getAttribute('data-fs-message-type')).toBe('error');
      handle.destroy();
    });

    it('does not show form message when only field errors exist', async () => {
      const messageEl = document.createElement('div');
      messageEl.setAttribute('data-fs-message', '');
      container.appendChild(messageEl);

      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      form.appendChild(emailError);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'must be an email' }]],
        ],
        getFieldErrors: (field: string) =>
          field === 'email'
            ? [{ code: 'TYPE_EMAIL', message: 'must be an email' }]
            : [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // No form errors, so no form message is shown
      expect(messageEl.textContent).toBe('');
      expect(messageEl.hasAttribute('data-fs-message-type')).toBe(false);

      // Field errors are still rendered
      expect(emailError.textContent).toBe('must be an email');
      handle.destroy();
    });

    it('displays form errors and field errors in separate elements', async () => {
      // This mirrors the React useForm test: both form + field errors returned
      const messageEl = document.createElement('div');
      messageEl.setAttribute('data-fs-message', '');
      container.appendChild(messageEl);

      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      form.appendChild(emailError);

      const emailInput = form.querySelector(
        'input[name="email"]'
      ) as HTMLInputElement;
      emailInput.setAttribute('data-fs-field', '');

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [{ code: 'UNSPECIFIED', message: 'forbidden' }],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'should be an email' }]],
        ],
        getFieldErrors: (field: string) =>
          field === 'email'
            ? [{ code: 'TYPE_EMAIL', message: 'should be an email' }]
            : [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Form error in data-fs-message
      expect(messageEl.textContent).toBe('forbidden');
      expect(messageEl.getAttribute('data-fs-message-type')).toBe('error');

      // Field error in data-fs-error span
      expect(emailError.textContent).toBe('should be an email');

      // Field marked invalid
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');

      handle.destroy();
    });

    it('clears message before submission', async () => {
      const messageEl = document.createElement('div');
      messageEl.setAttribute('data-fs-message', '');
      messageEl.textContent = 'Previous message';
      messageEl.setAttribute('data-fs-message-type', 'error');
      container.appendChild(messageEl);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onSuccess: ({ form }) => {
          form.reset();
        },
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Should now show success, not the old error
      expect(messageEl.textContent).toBe('Thank you!');
      expect(messageEl.getAttribute('data-fs-message-type')).toBe('success');
      handle.destroy();
    });
  });

  describe('customizable functions', () => {
    it('uses custom enable function', () => {
      const customEnable = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        enable: customEnable,
      });

      expect(customEnable).toHaveBeenCalledWith(
        expect.objectContaining({ form })
      );
      handle.destroy();
    });

    it('uses custom disable function', async () => {
      const customDisable = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        disable: customDisable,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(customDisable).toHaveBeenCalledWith(
        expect.objectContaining({ form })
      );
      handle.destroy();
    });

    it('uses custom renderFieldErrors function', async () => {
      const customRenderErrors = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        renderFieldErrors: customRenderErrors,
      });

      const errorResult = {
        kind: 'error',
        getFormErrors: () => [],
        getAllFieldErrors: () => [
          ['email', [{ code: 'TYPE_EMAIL', message: 'must be an email' }]],
        ],
        getFieldErrors: () => [
          { code: 'TYPE_EMAIL', message: 'must be an email' },
        ],
      };
      mockClient.submitForm.mockResolvedValue(errorResult);

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Called twice: once to clear (null), once with error
      expect(customRenderErrors).toHaveBeenCalledTimes(2);
      expect(customRenderErrors).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ form }),
        null
      );
      expect(customRenderErrors).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ form }),
        errorResult
      );
      handle.destroy();
    });
  });

  describe('destroy', () => {
    it('removes submit event listener', async () => {
      const onSubmit = jest.fn();
      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onSubmit,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      // Submit before destroy
      form.dispatchEvent(new Event('submit'));
      await flushPromises();
      expect(onSubmit).toHaveBeenCalledTimes(1);

      // Destroy
      handle.destroy();

      // Submit after destroy
      form.dispatchEvent(new Event('submit'));
      await flushPromises();
      expect(onSubmit).toHaveBeenCalledTimes(1); // Still 1, no new call
    });
  });

  describe('multiple submit buttons', () => {
    it('disables and re-enables all submit buttons with spinner', async () => {
      // Add another submit button
      const button2 = document.createElement('button');
      button2.type = 'submit';
      button2.textContent = 'Also Submit';
      form.appendChild(button2);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      let resolveSubmit: (value: { kind: string }) => void;
      mockClient.submitForm.mockReturnValue(
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
      );

      const buttons = form.querySelectorAll('button[type="submit"]');
      expect(buttons).toHaveLength(2);

      const originalTexts = Array.from(buttons).map((btn) => btn.textContent);

      buttons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      });

      form.dispatchEvent(new Event('submit'));

      // All buttons should be disabled with spinner during submission
      buttons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
        expect((btn as HTMLButtonElement).innerHTML).toContain('fs-spinner');
      });

      resolveSubmit!({ kind: 'success' });
      await flushPromises();

      // All buttons should be re-enabled with original text after submission
      buttons.forEach((btn, i) => {
        expect((btn as HTMLButtonElement).disabled).toBe(false);
        expect((btn as HTMLButtonElement).textContent).toBe(originalTexts[i]);
      });

      handle.destroy();
    });
  });
});

// Helper to flush pending promises
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
