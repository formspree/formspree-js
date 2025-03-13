import { FormspreeProvider } from '@formspree/react';
import { useState } from 'react';

import { React19 } from './React19';
import { WithReactHookForm } from './WithReactHookForm';
import PaymentForm from './PaymentForm';
import RecaptchaForm from './RecaptchaForm';
import SimpleForm from './SimpleForm';

enum Tab {
  React19 = 'react-19',
  ReactHookForm = 'react-hook-form',
  Recaptcha = 'recaptcha',
  Simple = 'simple',
  Stripe = 'stripe',
}

const App = () => {
  const [tab, setTab] = useState(Tab.Simple);

  return (
    <>
      <div className="container">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === Tab.Simple && 'active'}`}
            onClick={() => setTab(Tab.Simple)}
          >
            Simple form
          </button>
          <button
            type="button"
            className={`tab ${tab === Tab.Recaptcha && 'active'}`}
            onClick={() => setTab(Tab.Recaptcha)}
          >
            ReCaptcha form
          </button>
          <button
            type="button"
            className={`tab ${tab === Tab.Stripe && 'active'}`}
            disabled={!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
            onClick={() => setTab(Tab.Stripe)}
          >
            Stripe form
          </button>
          <button
            type="button"
            className={`tab ${tab === Tab.ReactHookForm && 'active'}`}
            onClick={() => setTab(Tab.ReactHookForm)}
          >
            With react-hook-form
          </button>
          <button
            type="button"
            className={`tab ${tab === Tab.React19 && 'active'}`}
            onClick={() => setTab(Tab.React19)}
          >
            React 19
          </button>
        </div>
        {tab === Tab.Stripe ? (
          <FormspreeProvider
            stripePK={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
          >
            <PaymentForm />
          </FormspreeProvider>
        ) : tab === Tab.Recaptcha ? (
          <RecaptchaForm />
        ) : tab === Tab.ReactHookForm ? (
          <WithReactHookForm />
        ) : tab === Tab.React19 ? (
          <React19 />
        ) : (
          <SimpleForm />
        )}
      </div>
      <footer className="container">
        <p>
          Powered by:{' '}
          <a href="https://formspree.io?utm_source=formspree-react-demo">
            Formspree
          </a>
        </p>
      </footer>
    </>
  );
};

export default App;
