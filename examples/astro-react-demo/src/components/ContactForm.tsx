import React from 'react';
import './ContactForm.css';

import { useForm, ValidationError } from '@formspree/react';

function ContactForm() {
  const [state, handleSubmit] = useForm("YOUR_FORM_ID");

  if (state.succeeded) {
    return <p className="success-message">Thanks for your submission!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <label htmlFor="email" className="form-label">
        Email Address
      </label>
      <input
        id="email"
        type="email" 
        name="email"
        className="form-input"
      />
      <ValidationError 
        prefix="Email" 
        field="email"
        errors={state.errors}
        className="error"
      />
      <label htmlFor="message" className="form-label">
        Message
      </label>
      <textarea
        id="message"
        name="message"
        className="form-textarea"
      />
      <ValidationError 
        prefix="Message" 
        field="message"
        errors={state.errors}
        className="error"
      />
      <button type="submit" disabled={state.submitting} className="submit-button">
        Submit
      </button>
      <ValidationError 
        errors={state.errors}
        className="error"
      />
    </form>
  );
}

export default ContactForm;
