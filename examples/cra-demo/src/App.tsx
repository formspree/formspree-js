import { useState } from 'react';
import { FormspreeProvider } from '@formspree/react';
import PaymentForm from './PaymentForm';
import SimpleForm from './SimpleForm';
import RecaptchaForm from './RecaptchaForm';
import { WithReactHookForm } from './WithReactHookForm';

const App = () => {
  const [tab, setTab] = useState('simple');

  return (
    <>
      <div className="container">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'simple' && 'active'}`}
            onClick={() => setTab('simple')}
          >
            Simple form
          </button>
          <button
            type="button"
            className={`tab ${tab === 'recaptcha' && 'active'}`}
            onClick={() => setTab('recaptcha')}
          >
            ReCaptcha form
          </button>
          <button
            type="button"
            className={`tab ${tab === 'stripe' && 'active'}`}
            disabled={!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
            onClick={() => setTab('stripe')}
          >
            Stripe form
          </button>
          <button
            type="button"
            className={`tab ${tab === 'react-hook-form' && 'active'}`}
            onClick={() => setTab('react-hook-form')}
          >
            With react-hook-form
          </button>
        </div>
        {tab === 'stripe' ? (
          <FormspreeProvider
            stripePK={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
          >
            <PaymentForm />
          </FormspreeProvider>
        ) : tab === 'recaptcha' ? (
          <RecaptchaForm />
        ) : tab === 'react-hook-form' ? (
          <WithReactHookForm />
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
