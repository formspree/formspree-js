import { useState } from 'react';
import { FormspreeProvider } from '@formspree/react';
import PaymentForm from './PaymentForm';
import SimpleForm from './SimpleForm';

const App = () => {
  const [isStripe, setStripe] = useState(true);

  return (
    <div className="container">
      <>
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
      </>
    </div>
  );
};

export default App