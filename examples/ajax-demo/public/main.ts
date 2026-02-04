/// <reference types="vite/client" />
import { initForm } from '@formspree/ajax';

const messageEl = document.getElementById('message') as HTMLDivElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

const showMessage = (type: 'success' | 'error', text: string): void => {
  messageEl.className = `message ${type}`;
  messageEl.textContent = text;
};

const hideMessage = (): void => {
  messageEl.className = 'message';
  messageEl.textContent = '';
};

const setButtonLoading = (loading: boolean): void => {
  if (loading) {
    submitBtn.innerHTML = '<span class="spinner"></span>Sending...';
  } else {
    submitBtn.textContent = 'Send Message';
  }
};

initForm({
  formElement: '#contact-form',
  formId: import.meta.env.VITE_FORMSPREE_FORM_ID,
  debug: true,
  fields: {
    name: {
      prettyName: 'Name',
      errorMessages: {
        requiredFieldEmpty: 'Please enter your name',
      },
    },
    email: {
      prettyName: 'Email',
      errorMessages: {
        typeEmail: 'Please enter a valid email address',
        requiredFieldEmpty: 'Please enter your email',
      },
    },
    message: {
      prettyName: 'Message',
      errorMessages: {
        requiredFieldEmpty: 'Please enter a message',
      },
    },
  },
  onInit: () => {
    console.log('Form initialized');
  },
  onSubmit: () => {
    hideMessage();
    setButtonLoading(true);
  },
  onSuccess: ({ form }) => {
    setButtonLoading(false);
    showMessage('success', 'Thank you! Your message has been sent.');
    form.reset();
  },
  onError: (_context, error) => {
    setButtonLoading(false);
    const formErrors = error.getFormErrors().map((e) => e.message);
    const fieldErrors = error
      .getAllFieldErrors()
      .flatMap(([, errors]) => errors.map((e) => e.message));
    const errorMessage =
      [...formErrors, ...fieldErrors].join(', ') ||
      'There was an error submitting the form.';
    showMessage('error', errorMessage);
  },
  onFailure: (_context, error) => {
    setButtonLoading(false);
    console.error('Form submission failed:', error);
    showMessage('error', 'An unexpected error occurred. Please try again.');
  },
});
