import type { Stripe } from '@stripe/stripe-js';
import { Session } from './session';
import {
  SubmissionErrorResult,
  SubmissionSuccessResult,
  SubmissionStripePluginPendingResult,
  isServerErrorResponse,
  isServerSuccessResponse,
  isServerStripePluginPendingResponse,
  type FieldValues,
  type SubmissionData,
  type SubmissionOptions,
  type SubmissionResult,
} from './submission';
import {
  appendExtraData,
  clientHeader,
  encode64,
  isUnknownObject,
} from './utils';

export interface Config {
  fetch?: typeof window.fetch;
  project?: string;
  stripePromise?: Stripe;
}

export class Client {
  private readonly fetch?: typeof window.fetch;
  project: string | undefined;
  stripePromise: Stripe | undefined;
  private readonly session?: Session;

  constructor(config: Config = {}) {
    this.fetch = config.fetch;
    this.project = config.project;
    this.stripePromise = config.stripePromise;

    if (typeof window !== 'undefined') {
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
    data: SubmissionData<T>,
    opts: SubmissionOptions = {}
  ): Promise<SubmissionResult<T>> {
    const endpoint = opts.endpoint || 'https://formspree.io';
    const fetch = this.fetch ?? window.fetch;
    const url = this.project
      ? `${endpoint}/p/${this.project}/f/${formKey}`
      : `${endpoint}/f/${formKey}`;

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
      data: SubmissionData<T>
    ): Promise<SubmissionResult<T>> {
      try {
        const res = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          body: data instanceof FormData ? data : JSON.stringify(data),
          headers,
        });

        const body = await res.json();

        if (isUnknownObject(body)) {
          if (isServerErrorResponse(body)) {
            return Array.isArray(body.errors)
              ? new SubmissionErrorResult(...body.errors)
              : new SubmissionErrorResult({ message: body.error });
          }

          if (isServerStripePluginPendingResponse(body)) {
            return new SubmissionStripePluginPendingResult(
              body.stripe.paymentIntentClientSecret,
              body.resubmitKey
            );
          }

          if (isServerSuccessResponse(body)) {
            return new SubmissionSuccessResult({ next: body.next });
          }
        }

        return new SubmissionErrorResult({
          message: 'Unexpected response format',
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : `Unknown error while posting to Formspree: ${JSON.stringify(
                err
              )}`;
        return new SubmissionErrorResult({ message: message });
      }
    }

    if (this.stripePromise && opts.createPaymentMethod) {
      const createPaymentMethodResult = await opts.createPaymentMethod();

      if (createPaymentMethodResult.error) {
        return new SubmissionErrorResult({
          code: 'STRIPE_CLIENT_ERROR',
          field: 'paymentMethod',
          message: 'Error creating payment method',
        });
      }

      // Add the paymentMethod to the data
      appendExtraData(
        data,
        'paymentMethod',
        createPaymentMethodResult.paymentMethod.id
      );

      // Send a request to Formspree server to handle the payment method
      const result = await makeFormspreeRequest(data);

      if (result.kind === 'error') {
        return result;
      }

      if (result.kind === 'stripePluginPending') {
        const stripeResult = await this.stripePromise.handleCardAction(
          result.paymentIntentClientSecret
        );

        if (stripeResult.error) {
          return new SubmissionErrorResult({
            code: 'STRIPE_CLIENT_ERROR',
            field: 'paymentMethod',
            message: 'Stripe SCA error',
          });
        }

        // `paymentMethod` must not be on the payload when resubmitting
        // the form to handle Stripe SCA.
        if (data instanceof FormData) {
          data.delete('paymentMethod');
        } else {
          delete data.paymentMethod;
        }

        appendExtraData(data, 'paymentIntent', stripeResult.paymentIntent.id);
        appendExtraData(data, 'resubmitKey', result.resubmitKey);

        // Resubmit the form with the paymentIntent and resubmitKey
        return makeFormspreeRequest(data);
      }

      return result;
    }

    return makeFormspreeRequest(data);
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
