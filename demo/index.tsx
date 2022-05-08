import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useForm, CardElement, FormspreeProvider } from '@formspree/react';

const useOptions = () => {
  const options = React.useMemo(
    () => ({
      style: {
        base: {
          color: '#424770',
          letterSpacing: '0.025em',
          fontFamily: 'Source Code Pro, monospace',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#9e2146'
        }
      }
    }),
    []
  );

  return options;
};

function App() {
  const options = useOptions();
  const [state, handleSubmit] = useForm('mwkyqzyn');

  return (
    <div
      style={{
        maxWidth: 960,
        margin: '0 auto'
      }}
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" />

        <CardElement options={options} />
        <button type="submit" disabled={state.submitting}>
          Pay
        </button>
      </form>
    </div>
  );
}

ReactDOM.render(
  <FormspreeProvider stripePK="YOUR_STRIPE_PUBLISHABLE_KEY_HERE">
    <App />
  </FormspreeProvider>,
  document.getElementById('root')
);
