import React, { useState } from 'react';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import { useElements, CardElement, useStripe } from '@stripe/react-stripe-js';
import { useFormspree } from './context';
import { ExtraData, ExtraDataValue } from './types';
import { version } from '../package.json';
import { Client } from '@formspree/core';
import {
  SubmissionResponse,
  SubmissionData,
  ErrorBody,
  FormError
} from '@formspree/core/forms';

type FormEvent = React.FormEvent<HTMLFormElement>;

type SubmitHandler = (
  submissionData: FormEvent | SubmissionData
) => Promise<SubmissionResponse>;

type ResetFunction = () => void;

const isEvent = (data: FormEvent | SubmissionData): data is FormEvent => {
  return (data as FormEvent).preventDefault !== undefined;
};

const useForm = (
  formKey: string,
  args: {
    client?: Client;
    data?: ExtraData;
    endpoint?: string;
    debug?: boolean;
  } = {}
): [
  {
    submitting: boolean;
    succeeded: boolean;
    errors: FormError[];
  },
  SubmitHandler,
  ResetFunction
] => {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState([]);
  const formspreeContext = useFormspree();
  const client = args.client || formspreeContext;
  let stripe: Stripe;
  let elements: StripeElements;

  if (!client) {
    throw new Error('You must provide a Formspree client');
  }

  if (!formKey) {
    throw new Error(
      'You must provide a form key or hashid ' +
        '(e.g. useForm("myForm") or useForm("123xyz")'
    );
  }

  if (formspreeContext.client && formspreeContext.client.stripePromise) {
    stripe = useStripe();
    elements = useElements();
  }

  const debug = !!args.debug;
  let extraData = args.data;

  const reset: ResetFunction = () => {
    setSubmitting(false);
    setSucceeded(false);
    setErrors([]);
  };

  const handleSubmit: SubmitHandler = async submissionData => {
    const getFormData = async (event: FormEvent) => {
      event.preventDefault();

      const form = event.target as HTMLFormElement;
      if (form.tagName != 'FORM') {
        throw new Error('submit was triggered for a non-form element');
      }
      return new FormData(form);
    };

    let formData = isEvent(submissionData)
      ? await getFormData(submissionData)
      : submissionData;

    const appendExtraData = (prop: string, value: string) => {
      if (formData instanceof FormData) {
        formData.append(prop, value);
      } else {
        formData = Object.assign(formData, { [prop]: value });
      }
    };

    // Append extra data from config
    if (typeof extraData === 'object') {
      for (const prop in extraData) {
        if (typeof extraData[prop] === 'function') {
          let extraDataValue = (extraData[prop] as Exclude<
            ExtraDataValue,
            string
          >).call(null);
          if (extraDataValue instanceof Promise) {
            extraDataValue = await extraDataValue;
          }
          if (extraDataValue !== undefined) {
            appendExtraData(prop, extraDataValue);
          }
        } else {
          appendExtraData(prop, extraData[prop] as string);
        }
      }
    }

    const handlePayment = async () => {
      const payload = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          ...(formData.name && { name: formData.name }),
          ...(formData.email && { email: formData.email }),
          ...(formData.phone && { phone: formData.phone }),
          ...(formData.address && {
            address: {
              ...(formData.city && { city: formData.city }),
              ...(formData.country && { country: formData.country }),
              ...(formData.line1 && { line1: formData.line1 }),
              ...(formData.line2 && { line2: formData.line2 }),
              ...(formData.postal_code && {
                postal_code: formData.postal_code
              }),
              ...(formData.state && { state: formData.state })
            }
          })
        }
      });

      return payload;
    };

    setSubmitting(true);

    return formspreeContext.client
      .submitForm(formKey, formData, {
        endpoint: args.endpoint,
        clientName: `@formspree/react@${version}`,
        handlePayment:
          formspreeContext.client && formspreeContext.client.stripePromise
            ? handlePayment
            : undefined
      })
      .then((result: SubmissionResponse) => {
        let status = result.response.status;
        let body;

        if (status === 200) {
          if (debug) console.log('Form submitted', result);
          setSucceeded(true);
          setErrors([]);
        } else if (status >= 400 && status < 500) {
          body = result.body as ErrorBody;

          if (body.errors) setErrors(body.errors);
          if (debug) console.log('Validation error', result);
          setSucceeded(false);
        } else {
          if (debug) console.log('Unexpected error', result);
          setSucceeded(false);
        }

        return result;
      })
      .catch((error: Error) => {
        if (debug) console.log('Unexpected error', error);
        setSucceeded(false);
        throw error;
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return [{ submitting, succeeded, errors }, handleSubmit, reset];
};

export { CardElement, useForm };
