// @ts-ignore
import { btoa } from './base64';
import { version } from '../package.json';
import { SubmissionResponse } from './forms';
import { PaymentMethod, Stripe } from '@stripe/stripe-js';

/**
 * Base-64 encodes a (JSON-castable) object.
 *
 * @param obj - The object to encode.
 */
export const encode64 = (obj: object): string => {
  return btoa(JSON.stringify(obj));
};

/**
 * Appends a key-value pair to a target.
 *
 * @param target - An object or FormData instance to mutate.
 * @param key - The key to append.
 * @param value - The value to append.
 */
export const append = (
  target: { [key: string]: any } | FormData,
  key: string,
  value: string
): void => {
  if (target instanceof FormData) {
    target.append(key, value);
  } else {
    target[key] = value;
  }
};

/**
 * Converts a snake case string to camel case.
 *
 * @param str - A string to convert to camel case.
 */
export const toCamel = (str: string): string => {
  return str.replace(/([-_][a-z])/gi, $1 => {
    return $1
      .toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

/**
 * Converts the top-level keys of an object to camel case.
 * This function returns a new object (instead of mutating in place).
 *
 * @param obj - An object with string keys.
 */
export const camelizeTopKeys = (obj: {
  [key: string]: any;
}): { [key: string]: any } => {
  let newObject: { [key: string]: any } = {};

  for (let [key, value] of Object.entries(obj)) {
    newObject[toCamel(key)] = value;
  }

  return newObject;
};

/**
 * Generates a client header.
 *
 * @param givenLabel
 */
export const clientHeader = (givenLabel: string | undefined): string => {
  const label = `@formspree/core@${version}`;
  if (!givenLabel) return label;
  return `${givenLabel} ${label}`;
};

/**
 * The current timestamp.
 */
export const now = (): number => {
  // @ts-ignore
  return 1 * new Date();
};

export const appendExtraData = (
  formData: FormData | object,
  prop: string,
  value: string
) => {
  if (formData instanceof FormData) {
    formData.append(prop, value);
  } else {
    formData = Object.assign(formData, { [prop]: value });
  }
};

type HandleSCAargs = {
  stripePromise: Stripe;
  response: Response;
  responseData: any;
  payload: {
    paymentMethod: PaymentMethod;
    error?: undefined;
  };
  data: FormData | object;
  fetchImpl: (
    input: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>;
  request: {
    method: string;
    mode: 'cors';
    body: string | FormData;
    headers: {
      [key: string]: string;
    };
  };
  url: string;
};

export const handleSCA = async ({
  stripePromise,
  response,
  responseData,
  payload,
  data,
  fetchImpl,
  request,
  url
}: HandleSCAargs): Promise<SubmissionResponse> => {
  const stripeResult = await stripePromise.handleCardAction(
    responseData.stripe.paymentIntentClientSecret
  );

  // Handle Stripe error
  if (stripeResult.error) {
    return {
      response,
      body: {
        errors: [
          {
            code: 'STRIPE_CLIENT_ERROR',
            message: 'Stripe SCA error',
            field: 'paymentMethod'
          }
        ]
      }
    };
  } else {
    if (!payload.paymentMethod.id) {
      appendExtraData(data, 'paymentMethod', payload.paymentMethod.id);
    }
    appendExtraData(data, 'paymentIntent', stripeResult.paymentIntent.id);
    appendExtraData(data, 'resubmitKey', responseData.resubmitKey);

    // Resubmit the form with the paymentIntent and resubmitKey
    const resSubmitResponse = await fetchImpl(url, {
      ...request,
      body: JSON.stringify({
        paymentIntent: stripeResult.paymentIntent.id,
        resubmitKey: responseData.resubmitKey
      })
    });
    const resSubmitData = await resSubmitResponse.json();

    return {
      response: resSubmitResponse,
      body: resSubmitData
    };
  }
};
