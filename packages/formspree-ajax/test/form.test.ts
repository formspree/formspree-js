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
        formEndpoint: 'https://formspree.io/f/xyzabc',
      });

      expect(handle).toBeDefined();
      expect(handle.destroy).toBeInstanceOf(Function);
      handle.destroy();
    });

    it('accepts a CSS selector string', () => {
      const handle = initForm({
        formElement: '#test-form',
        formEndpoint: 'https://formspree.io/f/xyzabc',
      });

      expect(handle).toBeDefined();
      handle.destroy();
    });

    it('throws when selector does not match any element', () => {
      expect(() =>
        initForm({
          formElement: '#non-existent-form',
          formEndpoint: 'https://formspree.io/f/xyzabc',
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
          formEndpoint: 'https://formspree.io/f/xyzabc',
        })
      ).toThrow('Element "#not-a-form" is not a form element');
    });
  });

  describe('configuration validation', () => {
    it('throws when formElement is not provided', () => {
      expect(() =>
        initForm({
          formElement: undefined as unknown as string,
          formEndpoint: 'https://formspree.io/f/xyzabc',
        })
      ).toThrow('You must provide a `formElement` in the config');
    });

    it('throws when formEndpoint is not provided', () => {
      expect(() =>
        initForm({
          formElement: form,
          formEndpoint: undefined as unknown as string,
        })
      ).toThrow('You must provide a `formEndpoint` in the config');
    });
  });

  describe('formEndpoint parsing', () => {
    it('extracts form key from standard formspree.io URL', () => {
      const onInit = jest.fn();
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
        onInit,
      });

      expect(onInit).toHaveBeenCalledWith(
        expect.objectContaining({
          formKey: 'xyzabc',
        })
      );
      handle.destroy();
    });

    it('extracts form key from URL without https', () => {
      const onInit = jest.fn();
      const handle = initForm({
        formElement: form,
        formEndpoint: 'http://formspree.io/f/abc123',
        onInit,
      });

      expect(onInit).toHaveBeenCalledWith(
        expect.objectContaining({
          formKey: 'abc123',
        })
      );
      handle.destroy();
    });

    it('throws when formEndpoint is not a valid Formspree URL', () => {
      expect(() =>
        initForm({
          formElement: form,
          formEndpoint: 'https://example.com/form',
        })
      ).toThrow(
        'formEndpoint must be a valid Formspree URL (e.g., https://formspree.io/f/xyzabc)'
      );
    });
  });

  describe('lifecycle callbacks', () => {
    it('calls onInit with the form context', () => {
      const onInit = jest.fn();
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
            formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
      });

      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('form submission', () => {
    it('prevents default form submission', () => {
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
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

    it('disables submit buttons during submission', async () => {
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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

      form.dispatchEvent(new Event('submit'));

      // Button should be disabled during submission
      expect(submitButton.disabled).toBe(true);

      // Resolve the submission
      resolveSubmit!({ kind: 'success' });
      await flushPromises();

      // Button should be re-enabled after submission
      expect(submitButton.disabled).toBe(false);
      handle.destroy();
    });

    it('calls onSuccess on successful submission', async () => {
      const onSuccess = jest.fn();
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
    it('includes static extra data in submission', async () => {
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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

    it('includes dynamic extra data from function', async () => {
      const dataFn = jest.fn().mockReturnValue({ timestamp: '12345' });
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
        data: dataFn,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      expect(dataFn).toHaveBeenCalledWith(
        expect.objectContaining({ form, formKey: 'xyzabc' })
      );

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('timestamp')).toBe('12345');
      handle.destroy();
    });

    it('skips null and undefined values in extra data', async () => {
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
        data: {
          included: 'yes',
          nullValue: null,
          undefinedValue: undefined,
        } as Record<string, string | null | undefined>,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'success', next: '' });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      const submittedFormData = mockClient.submitForm.mock.calls[0][1];
      expect(submittedFormData.get('included')).toBe('yes');
      expect(submittedFormData.has('nullValue')).toBe(false);
      expect(submittedFormData.has('undefinedValue')).toBe(false);
      handle.destroy();
    });
  });

  describe('debug mode', () => {
    it('logs initialization when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
        formEndpoint: 'https://formspree.io/f/xyzabc',
        debug: true,
      });

      mockClient.submitForm.mockResolvedValue({ kind: 'error' });

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
        formEndpoint: 'https://formspree.io/f/xyzabc',
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

  describe('destroy', () => {
    it('removes submit event listener', async () => {
      const onSubmit = jest.fn();
      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
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
    it('disables and re-enables all submit buttons', async () => {
      // Add another submit button
      const button2 = document.createElement('button');
      button2.type = 'submit';
      button2.textContent = 'Also Submit';
      form.appendChild(button2);

      const handle = initForm({
        formElement: form,
        formEndpoint: 'https://formspree.io/f/xyzabc',
      });

      let resolveSubmit: (value: { kind: string }) => void;
      mockClient.submitForm.mockReturnValue(
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
      );

      const buttons = form.querySelectorAll('button[type="submit"]');
      expect(buttons).toHaveLength(2);

      buttons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      });

      form.dispatchEvent(new Event('submit'));

      // All buttons should be disabled during submission
      buttons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
      });

      resolveSubmit!({ kind: 'success' });
      await flushPromises();

      // All buttons should be re-enabled after submission
      buttons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      });

      handle.destroy();
    });
  });
});

// Helper to flush pending promises
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
