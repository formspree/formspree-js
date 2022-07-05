import { useState } from 'react';
import { FormspreeProvider } from '@formspree/react';
import PaymentForm from './PaymentForm';
import SimpleForm from './SimpleForm';

const App = () => {
  const [isStripe, setStripe] = useState(false);

  return (
    <>
      <div className="container">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${!isStripe && 'active'}`}
            onClick={() => setStripe(false)}
          >
            Simple form
          </button>
          <button
            type="button"
            className={`tab ${isStripe && 'active'}`}
            onClick={() => setStripe(true)}
          >
            Stripe form
          </button>
        </div>
        {isStripe ? (
          <FormspreeProvider
            stripePK={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
          >
            <PaymentForm />
          </FormspreeProvider>
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
