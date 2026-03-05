import { initForm } from '../src/form';
import { getDefaultClient } from '@formspree/core';

// Mock @formspree/core
jest.mock('@formspree/core', () => {
  const mockClient = {
    submitForm: jest.fn(),
  };
  return {
    getDefaultClient: jest.fn(() => mockClient),
    createClient: jest.fn(() => mockClient),
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

describe('utility functions', () => {
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
      expect(emailError.hasAttribute('data-fs-active')).toBe(true);
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

    it('hides error elements when no errors for that field', async () => {
      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      form.appendChild(emailError);

      const nameError = document.createElement('span');
      nameError.dataset.fsError = 'name';
      nameError.textContent = 'Please enter your name';
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

      // Email error shown with server message
      expect(emailError.textContent).toBe('is invalid');
      expect(emailError.hasAttribute('data-fs-active')).toBe(true);
      // Name error hidden but user content preserved
      expect(nameError.textContent).toBe('Please enter your name');
      expect(nameError.hasAttribute('data-fs-active')).toBe(false);
      handle.destroy();
    });
  });

  describe('message rendering', () => {
    it('shows success message on data-fs-success after successful submission', async () => {
      const successEl = document.createElement('div');
      successEl.setAttribute('data-fs-success', '');
      container.appendChild(successEl);

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

      expect(successEl.textContent).toBe('Thank you!');
      expect(successEl.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });

    it('shows only form errors on data-fs-error (not field errors)', async () => {
      const formErrorEl = document.createElement('div');
      formErrorEl.setAttribute('data-fs-error', '');
      container.appendChild(formErrorEl);

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

      // data-fs-error (form-level) should show form-level errors
      expect(formErrorEl.textContent).toBe('Form is disabled');
      expect(formErrorEl.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });

    it('does not show form message when only field errors exist', async () => {
      const formErrorEl = document.createElement('div');
      formErrorEl.setAttribute('data-fs-error', '');
      container.appendChild(formErrorEl);

      const successEl = document.createElement('div');
      successEl.setAttribute('data-fs-success', '');
      container.appendChild(successEl);

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

      // No form errors, so form-level elements should not be active
      expect(formErrorEl.hasAttribute('data-fs-active')).toBe(false);
      expect(successEl.hasAttribute('data-fs-active')).toBe(false);

      // Field errors are still rendered
      expect(emailError.textContent).toBe('must be an email');
      expect(emailError.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });

    it('displays form errors and field errors in separate elements', async () => {
      const formErrorEl = document.createElement('div');
      formErrorEl.setAttribute('data-fs-error', '');
      container.appendChild(formErrorEl);

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

      // Form error in data-fs-error (form-level)
      expect(formErrorEl.textContent).toBe('forbidden');
      expect(formErrorEl.hasAttribute('data-fs-active')).toBe(true);

      // Field error in data-fs-error="email" span
      expect(emailError.textContent).toBe('should be an email');
      expect(emailError.hasAttribute('data-fs-active')).toBe(true);

      // Field marked invalid
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');

      handle.destroy();
    });

    it('clears previous messages before submission', async () => {
      // Simulate a previous error state
      const formErrorEl = document.createElement('div');
      formErrorEl.setAttribute('data-fs-error', '');
      formErrorEl.setAttribute('data-fs-active', '');
      formErrorEl.textContent = 'Previous error';
      formErrorEl.setAttribute('data-fs-server-content', '');
      container.appendChild(formErrorEl);

      const successEl = document.createElement('div');
      successEl.setAttribute('data-fs-success', '');
      container.appendChild(successEl);

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

      // Previous error should be cleared
      expect(formErrorEl.hasAttribute('data-fs-active')).toBe(false);
      expect(formErrorEl.textContent).toBe('');

      // Success should now be shown
      expect(successEl.textContent).toBe('Thank you!');
      expect(successEl.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });
  });

  describe('content preservation', () => {
    it('preserves user content in field error elements', async () => {
      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      emailError.textContent = 'Please enter a valid email';
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

      // User content preserved, not overridden by server message
      expect(emailError.textContent).toBe('Please enter a valid email');
      expect(emailError.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });

    it('preserves user content in success element', async () => {
      const successEl = document.createElement('div');
      successEl.setAttribute('data-fs-success', '');
      successEl.textContent = 'Thanks for reaching out!';
      container.appendChild(successEl);

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

      // User content preserved
      expect(successEl.textContent).toBe('Thanks for reaching out!');
      expect(successEl.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });

    it('preserves user content in form error element', async () => {
      const formErrorEl = document.createElement('div');
      formErrorEl.setAttribute('data-fs-error', '');
      formErrorEl.textContent = 'Whoops! Something went wrong.';
      container.appendChild(formErrorEl);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
      });

      mockClient.submitForm.mockResolvedValue({
        kind: 'error',
        getFormErrors: () => [
          { code: 'INACTIVE', message: 'Form is disabled' },
        ],
        getAllFieldErrors: () => [],
        getFieldErrors: () => [],
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // User content preserved, not overridden by server message
      expect(formErrorEl.textContent).toBe('Whoops! Something went wrong.');
      expect(formErrorEl.hasAttribute('data-fs-active')).toBe(true);
      handle.destroy();
    });

    it('clears server-injected content when hiding elements', async () => {
      const emailError = document.createElement('span');
      emailError.dataset.fsError = 'email';
      form.appendChild(emailError);

      const handle = initForm({
        formElement: form,
        formId: 'xyzabc',
        onSuccess: ({ form }) => {
          form.reset();
        },
      });

      // First submission: error for email
      mockClient.submitForm.mockResolvedValueOnce({
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
      expect(emailError.hasAttribute('data-fs-active')).toBe(true);

      // Second submission: success (no errors)
      mockClient.submitForm.mockResolvedValueOnce({
        kind: 'success',
        next: '',
      });

      form.dispatchEvent(new Event('submit'));
      await flushPromises();

      // Server-injected content should be cleared
      expect(emailError.textContent).toBe('');
      expect(emailError.hasAttribute('data-fs-active')).toBe(false);
      handle.destroy();
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

      // All buttons should be disabled during submission
      buttons.forEach((btn) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
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
