/// <reference types="vite/client" />
import { initForm } from '@formspree/ajax';

const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

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
      // get it working with the default error messages
      // errorMessages: {
      //   "TYPE_EMAIL": "Email not valid",
      // },
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
    setButtonLoading(true);
  },
  onSuccess: ({ form }) => {
    setButtonLoading(false);
    form.reset();
  },
  onError: () => {
    setButtonLoading(false);
  },
  onFailure: (_context, error) => {
    setButtonLoading(false);
    console.error('Form submission failed:', error);
  },
});
