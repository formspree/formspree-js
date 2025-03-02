import {
  appendExtraData,
  type Client,
  type FieldValues,
  type SubmissionData,
  type SubmissionResult,
} from '@formspree/core';
import { CardElement } from '@stripe/react-stripe-js';
import type { PaymentMethodResult } from '@stripe/stripe-js';
import { useMemo } from 'react';
import { version } from '../package.json';
import { useFormspree } from './context';
import type { ExtraData, FormEvent, SubmitHandler } from './types';

const clientName = `@formspree/react@${version}`;

type Options = {
  client?: Client;
  extraData?: ExtraData;
  // origin overrides the submission origin (default: "https://formspree.io")
  origin?: string;
};

export function useSubmit<T extends FieldValues>(
  formKey: string,
  options: Options = {}
): SubmitHandler<T, SubmissionResult<T>> {
  const formspree = useFormspree();
  const { client = formspree.client, extraData, origin } = options;

  const { stripe } = client;
  const cardElement = useMemo(
    () => stripe?.elements().getElement(CardElement),
    [stripe]
  );

  return async function handleSubmit(submission) {
    const data = isEvent(submission) ? getFormData(submission) : submission;

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
          appendExtraData(data, prop, extraDataValue);
        }
      }
    }

    return client.submitForm(formKey, data, {
      endpoint: origin,
      clientName,
      createPaymentMethod:
        stripe && cardElement
          ? (): Promise<PaymentMethodResult> =>
              stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: mapBillingDetailsPayload(data),
              })
          : undefined,
    });
  };
}

function isEvent(
  submission: FormEvent | SubmissionData
): submission is FormEvent {
  return (
    'preventDefault' in submission &&
    typeof submission.preventDefault === 'function'
  );
}

function getFormData(event: FormEvent): FormData {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.tagName != 'FORM') {
    throw new Error('submit was triggered for a non-form element');
  }
  return new FormData(form);
}

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
