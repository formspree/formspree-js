import { useMemo } from 'react';
import { useForm, CardElement, ValidationError } from '@formspree/react';
import CardExample from './CardExample';

const useOptions = () => {
  const options = useMemo(
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
  const [state, handleSubmit] = useForm(
    process.env.REACT_APP_PAYMENT_FORM_ID as string
  );

  return state && state.succeeded ? (
    <h2>Payment has been handled successfully!</h2>
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
        <label htmlFor="email">Card details</label>
        <CardElement options={options} />
        <ValidationError
          className="error"
          field="paymentMethod"
          errors={state.errors}
        />
      </div>
      <div className="block">
        <ValidationError className="error" errors={state.errors} />
      </div>
      <button type="submit" disabled={state.submitting}>
        {state.submitting ? 'Handling payment...' : 'Pay'}
      </button>

      <div className="block info">
        <p>You can use the following cards for testing:</p>
        <ul>
          <CardExample
            title="Successful charge: 4242 4242 4242 4242"
            cardNumber="4242424242424242"
          />
          <CardExample
            title="Declined payment: 4000 0000 0000 0002"
            cardNumber="4000000000000002"
          />
          <CardExample
            title="3D secure: 4000 0027 6000 3184"
            cardNumber="4000002760003184"
          />
        </ul>
        <span>Use any 3 digits for CVC and any future date for the date</span>
        <a
          href="https://stripe.com/docs/testing"
          target="_blank"
          rel="noreferrer"
        >
          See more on Stripe
        </a>
      </div>
    </form>
  );
};

export default PaymentForm;
