import { useForm, ValidationError } from '@formspree/react';
import { useState } from 'react';

import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from 'react-google-recaptcha-v3';

const ReCaptchaForm = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [failReCaptcha, setFailReCaptcha] = useState(false);
  const [state, handleSubmit] = useForm(
    process.env.REACT_APP_RECAPTCHA_FORM_ID as string,
    {
      data: {
        'g-recaptcha-response': failReCaptcha
          ? () => new Promise<string>((resolve) => resolve('Nonsense!'))
          : executeRecaptcha,
      },
    }
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
            <label className="forCheckbox" htmlFor="failRecaptcha">
              Fail Recaptcha
            </label>
            <input
              id="failReCaptcha"
              type="checkbox"
              onChange={(ev) => {
                setFailReCaptcha(ev.target.checked);
              }}
            />
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

export default () => (
  <GoogleReCaptchaProvider
    reCaptchaKey={process.env.REACT_APP_RECAPTCHA_KEY as string}
  >
    <ReCaptchaForm />
  </GoogleReCaptchaProvider>
);
