import 'react-app-polyfill/ie11';
import * as React from 'react';
import ReactDOM from "react-dom/client"
import './styles.css';
import { FormspreeProvider } from '@formspree/react';
import PaymentForm from './PaymentForm';
import SimpleForm from './SimpleForm';

const App = () => {
  const [isStripe, setStripe] = React.useState(true);

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
            stripePK={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
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

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
