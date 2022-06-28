import * as React from 'react'
import {
  useForm,
  CardElement,
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

const PaymentForm = () => {
  const options = useOptions();
  const [state, handleSubmit] = useForm(import.meta.env.VITE_PAYMENT_FORM_ID as string);

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

export default PaymentForm