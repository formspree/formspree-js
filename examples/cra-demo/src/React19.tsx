import { isSubmissionError, type SubmissionResult } from '@formspree/core';
import { useSubmit, ValidationError } from '@formspree/react';
import { useActionState } from 'react';

export function React19() {
  const submit = useSubmit(process.env.REACT_APP_SIMPLE_FORM_ID as string);

  const [state, action, isPending] = useActionState<
    SubmissionResult | null,
    FormData
  >((_, inputs) => submit(inputs), null);

  if (state && !isSubmissionError(state)) {
    return <h2>Your message has been sent successfully!</h2>;
  }

  return (
    <form action={action}>
      <div className="block">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" />
        <ValidationError
          field="email"
          prefix="Email"
          className="error"
          errors={state}
        />
      </div>
      <div className="block">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" />
      </div>
      <div className="block">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={10} />
      </div>
      <div className="block">
        <ValidationError className="error" errors={state} />
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
