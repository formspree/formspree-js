import React, { useState } from 'react';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import { useElements, CardElement, useStripe } from '@stripe/react-stripe-js';
import { useFormspree } from './context';
import { ExtraData } from './types';
import { version } from '../package.json';
import {
  Client,
  SubmissionResponse,
  SubmissionData,
  ErrorBody,
  FormError,
} from '@formspree/core';

type FormEvent = React.FormEvent<HTMLFormElement>;

type SubmitHandler = (
  submissionData: FormEvent | SubmissionData
) => Promise<SubmissionResponse>;

type ResetFunction = () => void;

export type TUseForm = [
  {
    result: SubmissionResponse | null;
    submitting: boolean;
    succeeded: boolean;
    errors: FormError[];
  },
  SubmitHandler,
  ResetFunction
];

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
): TUseForm => {
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const formspreeContext = useFormspree();
  const client = args.client || formspreeContext;
  let stripe: Stripe | null;
  let elements: StripeElements | null;

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

  const handleSubmit: SubmitHandler = async (submissionData) => {
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
      for (const [prop, value] of Object.entries(extraData)) {
        let extraDataValue: string | undefined;
        if (typeof value === 'function') {
          extraDataValue = await value();
        } else {
          extraDataValue = value;
        }
        if (extraDataValue !== undefined) {
          appendExtraData(prop, extraDataValue);
        }
      }
    }

    const createPaymentMethod = async () => {
      const address = {
        ...(formData.address_line1 && {
          line1: formData.address_line1,
        }),
        ...(formData.address_line2 && {
          line2: formData.address_line2,
        }),
        ...(formData.address_city && {
          city: formData.address_city,
        }),
        ...(formData.address_country && {
          country: formData.address_country,
        }),
        ...(formData.address_state && {
          state: formData.address_state,
        }),
        ...(formData.address_postal_code && {
          postal_code: formData.address_postal_code,
        }),
      };

      // @ts-ignore: unhandled stripe is possibly null
      const payload = await stripe.createPaymentMethod({
        type: 'card',
        // @ts-ignore: unhandled elements is possibly null and getElement can return null
        card: elements.getElement(CardElement),
        billing_details: {
          ...(formData.name && { name: formData.name }),
          ...(formData.email && { email: formData.email }),
          ...(formData.phone && { phone: formData.phone }),
          ...(address && {
            address,
          }),
        },
      });

      return payload;
    };

    setSubmitting(true);

    return formspreeContext.client
      .submitForm(formKey, formData, {
        endpoint: args.endpoint,
        clientName: `@formspree/react@${version}`,
        createPaymentMethod:
          formspreeContext.client && formspreeContext.client.stripePromise
            ? createPaymentMethod
            : undefined,
      })
      .then((result: SubmissionResponse) => {
        // @ts-ignore: unhandled result.response is possibly null
        let status = result.response.status;
        let body;

        if (status === 200) {
          if (debug) console.log('Form submitted', result);
          setSucceeded(true);
          setResult(result);
          setErrors([]);
        } else if (status >= 400) {
          body = result.body as ErrorBody;
          if (body.errors) {
            setErrors(body.errors);
            if (debug) console.log('Error', result);
          } else {
            setErrors([{ message: 'Unexpected error' }]);
            if (debug) console.log('Unexpected error', result);
          }
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

  return [{ result, submitting, succeeded, errors }, handleSubmit, reset];
};

export { CardElement, useForm };
