/// <reference types="vite/client" />
import { initForm } from '@formspree/ajax';

initForm({
  formElement: '#contact-form',
  formId: import.meta.env.VITE_FORMSPREE_FORM_ID,
  debug: true,
  onInit: () => {
    console.log('Form initialized');
  },
  onSuccess: ({ form }) => {
    form.reset();
  },
  onFailure: (_context, error) => {
    console.error('Form submission failed:', error);
  },
});
