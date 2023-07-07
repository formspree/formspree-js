// import type { PaymentMethod, Stripe } from '@stripe/stripe-js';
import { version } from '../package.json';
import { btoa } from './base64';
import type { SubmissionData } from './submission';

/**
 * Base-64 encodes a (JSON-castable) object.
 *
 * @param obj - The object to encode.
 */
export const encode64 = (obj: object): string => {
  return btoa(JSON.stringify(obj));
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

export function appendExtraData(
  formData: SubmissionData,
  prop: string,
  value: string
): void {
  if (formData instanceof FormData) {
    formData.append(prop, value);
  } else {
    formData[prop] = value;
  }
}

/*
type HandleSCAargs = {
  stripePromise: Stripe;
  response: Response;
  responseData: any;
  payload: {
    paymentMethod: PaymentMethod;
    error?: undefined;
  };
  data: SubmissionData;
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
  // response,
  responseData,
  payload,
  data,
  fetchImpl,
  request,
  url,
}: HandleSCAargs): Promise<SubmissionResult> => {
  const stripeResult = await stripePromise.handleCardAction(
    responseData.stripe.paymentIntentClientSecret
  );

  // Handle Stripe error
  if (stripeResult.error) {
    return {
      errors: [
        {
          code: 'STRIPE_CLIENT_ERROR',
          message: 'Stripe SCA error',
          field: 'paymentMethod',
        },
      ],
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
        resubmitKey: responseData.resubmitKey,
      }),
    });
    const resSubmitData = await resSubmitResponse.json();

    return {
      response: resSubmitResponse,
      body: resSubmitData,
    };
  }
};
*/
