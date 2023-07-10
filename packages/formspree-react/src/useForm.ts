import { useState } from 'react';
import type React from 'react';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { useElements, CardElement, useStripe } from '@stripe/react-stripe-js';
import { useFormspree } from './context';
import type { ExtraData } from './types';
import { version } from '../package.json';
import {
  appendExtraData,
  type Client,
  type FieldValues,
  type SubmissionData,
  type SubmissionRedirectResult,
  type SubmissionErrorResult,
} from '@formspree/core';

type FormEvent = React.FormEvent<HTMLFormElement>;

type SubmitHandler<T extends FieldValues> = (
  submissionData: FormEvent | SubmissionData<T>
) => Promise<void>;

type ResetFunction = () => void;

export type TUseForm<T extends FieldValues> = [
  {
    errors: SubmissionErrorResult<T> | null;
    result: SubmissionRedirectResult | null;
    submitting: boolean;
    succeeded: boolean;
  },
  SubmitHandler<T>,
  ResetFunction
];

const isEvent = (data: FormEvent | SubmissionData): data is FormEvent => {
  return (data as FormEvent).preventDefault !== undefined;
};

const useForm = <T extends FieldValues>(
  formKey: string,
  args: {
    client?: Client;
    data?: ExtraData;
    endpoint?: string;
    debug?: boolean;
  } = {}
): TUseForm<T> => {
  const [errors, setErrors] = useState<SubmissionErrorResult<T> | null>(null);
  const [result, setResult] = useState<SubmissionRedirectResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
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
    // suppress existing violation: React Hook "useStripe" is called conditionally
    // eslint-disable-next-line react-hooks/rules-of-hooks
    stripe = useStripe();
    // suppress existing violation: React Hook "useElements" is called conditionally
    // eslint-disable-next-line react-hooks/rules-of-hooks
    elements = useElements();
  }

  const extraData = args.data;

  const reset: ResetFunction = () => {
    setErrors(null);
    setResult(null);
    setSubmitting(false);
    setSucceeded(false);
  };

  const handleSubmit: SubmitHandler<T> = async (submissionData) => {
    const getFormData = (event: FormEvent) => {
      event.preventDefault();

      const form = event.target as HTMLFormElement;
      if (form.tagName != 'FORM') {
        throw new Error('submit was triggered for a non-form element');
      }
      return new FormData(form);
    };

    const formData = isEvent(submissionData)
      ? getFormData(submissionData)
      : submissionData;

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
          appendExtraData(formData, prop, extraDataValue);
        }
      }
    }

    const createPaymentMethod = async () => {
      // @ts-ignore: unhandled stripe is possibly null
      const payload = await stripe.createPaymentMethod({
        type: 'card',
        // @ts-ignore: unhandled elements is possibly null and getElement can return null
        card: elements.getElement(CardElement),
        billing_details: mapBillingDetailsPayload(formData),
      });

      return payload;
    };

    setSubmitting(true);

    const result = await formspreeContext.client.submitForm(formKey, formData, {
      endpoint: args.endpoint,
      clientName: `@formspree/react@${version}`,
      createPaymentMethod:
        formspreeContext.client && formspreeContext.client.stripePromise
          ? createPaymentMethod
          : undefined,
    });

    switch (result.kind) {
      case 'error':
        setErrors(result);
        setResult(null);
        setSucceeded(false);
        break;
      case 'redirect':
        setErrors(null);
        setResult(result);
        setSucceeded(true);
        break;
    }

    setSubmitting(false);
  };

  return [{ result, submitting, succeeded, errors }, handleSubmit, reset];
};

type StripeBillingDetailsPayload = {
  address: StripeAddressPayload;
  name?: string;
  email?: string;
  phone?: string;
};

function mapBillingDetailsPayload(
  data: SubmissionData
): StripeBillingDetailsPayload {
  const billing: StripeBillingDetailsPayload = {
    address: mapAddressPayload(data),
  };

  for (const key of ['name', 'email', 'phone'] as const) {
    const value = data instanceof FormData ? data.get(key) : data[key];
    if (value && typeof value === 'string') {
      billing[key] = value;
    }
  }

  return billing;
}

type StripeAddressPayload = Partial<{
  line1: string;
  line2: string;
  city: string;
  country: string;
  state: string;
  postal_code: string;
}>;

function mapAddressPayload(data: SubmissionData): StripeAddressPayload {
  const address: StripeAddressPayload = {};

  for (const [fromKey, toKey] of [
    ['address_line1', 'line1'],
    ['address_line2', 'line2'],
    ['address_city', 'city'],
    ['address_country', 'country'],
    ['address_state', 'state'],
    ['address_postal_code', 'postal_code'],
  ] as const) {
    const value = data instanceof FormData ? data.get(fromKey) : data[fromKey];
    if (value && typeof value === 'string') {
      address[toKey] = value;
    }
  }

  return address;
}

export { CardElement, useForm };
