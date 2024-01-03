import { useSubmit } from '@formspree/react';
import { useForm } from 'react-hook-form';

type Inputs = {
  email: string;
  message: string;
  name: string;
};

export function WithReactHookForm() {
  const {
    formState: { errors, isSubmitSuccessful, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<Inputs>();

  const submit = useSubmit<Inputs>(
    process.env.REACT_APP_REACT_HOOK_FORM_ID as string,
    {
      onError(errs) {
        const formErrs = errs.getFormErrors();
        for (const { code, message } of formErrs) {
          setError(`root.${code}`, {
            type: code,
            message,
          });
        }

        const fieldErrs = errs.getAllFieldErrors();
        for (const [field, errs] of fieldErrs) {
          setError(field, {
            message: errs.map((e) => e.message).join(', '),
          });
        }
      },
    }
  );

  return (
    <div>
      {isSubmitSuccessful ? (
        <h2>Your message has been sent successfully!</h2>
      ) : (
        <form onSubmit={handleSubmit(submit)}>
          <div className="block">
            <label htmlFor="email">Email</label>
            <input {...register('email')} id="email" type="email" />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
          <div className="block">
            <label htmlFor="name">Name</label>
            <input {...register('name')} id="name" />
            {errors.name && <p className="error">{errors.name.message}</p>}
          </div>
          <div className="block">
            <label htmlFor="message">Message</label>
            <textarea {...register('message')} id="message" rows={10} />
          </div>
          {errors.root && (
            <div className="block">
              <ul className="error">
                {Object.values(errors.root).map((err) => {
                  if (typeof err !== 'object') {
                    return <li key={err}>{err}</li>;
                  }
                  const { type, message } = err;
                  return <li key={type}>{message}</li>;
                })}
              </ul>
            </div>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
}
