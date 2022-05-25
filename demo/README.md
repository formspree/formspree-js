# Formspree X Stripe demo

Quickly add Stripe payment without backend

## Example

```jsx
import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './styles.css';
import {
  useForm,
  CardElement,
  FormspreeProvider,
  ValidationError,
} from '@formspree/react';

const useOptions = () => {
  const options = React.useMemo(
    () => ({
      style: {
        base: {
          color: '#424770',
          letterSpacing: '0.025em',
          fontFamily: 'Source Code Pro, monospace',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    }),
    []
  );

  return options;
};

function App() {
  const options = useOptions();
  const [state, handleSubmit] = useForm('YOUR_FORMSPREE_FORM_ID_HERE');

  return (
    <div
      style={{
        maxWidth: 960,
        margin: '0 auto',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        padding: '4rem 0',
      }}
    >
      {state && state.succeeded ? (
        <h2>Payment has been handled successfully!</h2>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="block">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" />
          </div>
          <div className="block">
            <label htmlFor="email">Card details</label>
            <CardElement options={options} />
            <ValidationError
              className="error"
              field="paymentMethod"
              errors={state.errors}
            />
          </div>
          <button type="submit" disabled={state.submitting}>
            {state.submitting ? 'Handling payment...' : 'Pay'}
          </button>
        </form>
      )}
    </div>
  );
}

ReactDOM.render(
  <FormspreeProvider stripePK="YOUR_STRIPE_PUBLISHABLE_KEY_HERE">
    <App />
  </FormspreeProvider>,
  document.getElementById('root')
);
```
