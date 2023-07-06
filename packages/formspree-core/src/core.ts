import type { Stripe } from '@stripe/stripe-js';
import { Session } from './session';
import {
  SubmissionError,
  SubmissionSuccess,
  isServerErrorResponse,
  isServerSuccessResponse,
  type FieldValues,
  type SubmissionData,
  type SubmissionOptions,
  type SubmissionResult,
} from './submission';
import { appendExtraData, clientHeader, encode64 } from './utils';

export interface Config {
  project?: string;
  stripePromise?: Stripe;
}

export class Client {
  project: string | undefined;
  stripePromise: Stripe | undefined;
  private session: Session | undefined;

  constructor(config: Config = {}) {
    this.project = config.project;
    this.stripePromise = config.stripePromise;
    if (typeof window !== 'undefined') this.startBrowserSession();
  }

  /**
   * Starts a browser session.
   */
  startBrowserSession(): void {
    if (!this.session) {
      this.session = new Session();
    }
  }

  /**
   * Submit a form.
   *
   * @param formKey - The form key.
   * @param data - An object or FormData instance containing submission data.
   * @param args - An object of form submission data.
   */
  async submitForm<T extends FieldValues>(
    formKey: string,
    data: SubmissionData,
    opts: SubmissionOptions = {}
  ): Promise<SubmissionResult<T>> {
    const endpoint = opts.endpoint || 'https://formspree.io';
    const fetchImpl = opts.fetchImpl || fetch;
    const url = this.project
      ? `${endpoint}/p/${this.project}/f/${formKey}`
      : `${endpoint}/f/${formKey}`;

    const serializeBody = (data: SubmissionData): FormData | string => {
      if (data instanceof FormData) return data;
      return JSON.stringify(data);
    };

    const headers: { [key: string]: string } = {
      Accept: 'application/json',
      'Formspree-Client': clientHeader(opts.clientName),
    };

    if (this.session) {
      headers['Formspree-Session-Data'] = encode64(this.session.data());
    }

    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    async function makeFormspreeRequest(
      data: SubmissionData
    ): Promise<SubmissionResult<T>> {
      try {
        const res = await fetchImpl(url, {
          method: 'POST',
          mode: 'cors',
          body: serializeBody(data),
          headers,
        });

        const body = await res.json();

        if (typeof body === 'object' && body !== null) {
          if (isServerErrorResponse(body)) {
            return Array.isArray(body.error)
              ? new SubmissionError(...body.error)
              : new SubmissionError({ message: body.error });
          }

          if (isServerSuccessResponse(body)) {
            return new SubmissionSuccess({ next: body.next });
          }
        }

        return new SubmissionError({ message: 'Unexpected error' });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : `Unknown error while posting to Formspree: ${err}`;
        return new SubmissionError({ message: message });
      }
    }

    if (this.stripePromise && opts.createPaymentMethod) {
      const payload = await opts.createPaymentMethod();

      if (payload.error) {
        return new SubmissionError({
          code: 'STRIPE_CLIENT_ERROR',
          message: 'Error creating payment method',
          field: 'paymentMethod',
        });
      }

      // Add the paymentMethod to the data
      appendExtraData(data, 'paymentMethod', payload.paymentMethod.id);

      // Send a request to Formspree server to handle the payment method
      // const response = await fetchImpl(url, {
      //   ...request,
      //   body: serializeBody(data),
      // });
      // const responseData = await response.json();
      const result = await makeFormspreeRequest(data);

      // if (result.errors) {
      //   return result;
      // }

      // Handle SCA
      // if (
      //   responseData &&
      //   responseData.stripe &&
      //   responseData.stripe.requiresAction &&
      //   responseData.resubmitKey
      // ) {
      //   return handleSCA({
      //     stripePromise: this.stripePromise,
      //     responseData,
      //     response,
      //     payload,
      //     data,
      //     fetchImpl,
      //     request,
      //     url,
      //   });
      // }

      // const { data: responseData } = result;
      // if (
      //   typeof responseData === 'object' &&
      //   responseData != null &&
      //   'stripe' in responseData &&
      //   typeof responseData.stripe === 'object' &&
      //   responseData.stripe != null &&
      //   'requiresAction' in responseData.stripe &&
      //   'paymentIntentClientSecret' in responseData.stripe &&
      //   typeof responseData.stripe.paymentIntentClientSecret === 'string'
      // ) {
      //   const stripeResult = await this.stripePromise.handleCardAction(
      //     responseData.stripe.paymentIntentClientSecret
      //   );
      // }

      // return handleLegacyErrorPayload({
      //   response,
      //   body: responseData,
      // });
    }

    return makeFormspreeRequest(data);
    // return handleLegacyErrorPayload({ body, response });
  }
}

/**
 * Constructs the client object.
 */
export const createClient = (config?: Config): Client => new Client(config);

/**
 * Fetches the global default client.
 */
export const getDefaultClient = (): Client => {
  if (!defaultClientSingleton) {
    defaultClientSingleton = createClient();
  }
  return defaultClientSingleton;
};

/**
 * The global default client. Note, this client may not get torn down.
 */
let defaultClientSingleton: Client;
