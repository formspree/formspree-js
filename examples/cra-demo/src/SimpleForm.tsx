import { useForm, ValidationError } from '@formspree/react';

const SimpleForm = () => {
  const [state, handleSubmit] = useForm(
    process.env.REACT_APP_SIMPLE_FORM_ID as string
  );

  return (
    <div>
      {state && state.succeeded ? (
        <h2>Your message has been sent successfully!</h2>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="block">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" />
            <ValidationError
              field="email"
              prefix="Email"
              className="error"
              errors={state.errors}
            />
          </div>
          <div className="block">
            <label htmlFor="name">Name</label>
            <input id="name" type="name" name="name" />
          </div>
          <div className="block">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={10} />
          </div>
          <div className="block">
            <ValidationError className="error" errors={state.errors} />
          </div>
          <button type="submit" disabled={state.submitting}>
            {state.submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SimpleForm;
