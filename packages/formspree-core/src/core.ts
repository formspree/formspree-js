import { Stripe } from '@stripe/stripe-js';
import {
  hasErrors,
  SubmissionData,
  SubmissionOptions,
  SubmissionBody,
  SubmissionResponse
} from './forms';
import {
  appendExtraData,
  clientHeader,
  encode64,
  handleLegacyErrorPayload,
  handleSCA
} from './utils';
import { Session } from './session';

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
   * Teardown the client session.
   */
  teardown(): void {
    if (this.session) this.session.teardown();
  }

  /**
   * Submit a form.
   *
   * @param formKey - The form key.
   * @param data - An object or FormData instance containing submission data.
   * @param args - An object of form submission data.
   */
  async submitForm(
    formKey: string,
    data: SubmissionData,
    opts: SubmissionOptions = {}
  ): Promise<SubmissionResponse> {
    let endpoint = opts.endpoint || 'https://formspree.io';
    let fetchImpl = opts.fetchImpl || fetch;
    let url = this.project
      ? `${endpoint}/p/${this.project}/f/${formKey}`
      : `${endpoint}/f/${formKey}`;

    const serializeBody = (data: SubmissionData): FormData | string => {
      if (data instanceof FormData) return data;
      return JSON.stringify(data);
    };

    let headers: { [key: string]: string } = {
      Accept: 'application/json',
      'Formspree-Client': clientHeader(opts.clientName)
    };

    if (this.session) {
      headers['Formspree-Session-Data'] = encode64(this.session.data());
    }

    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    let request = {
      method: 'POST',
      mode: 'cors' as const,
      body: serializeBody(data),
      headers
    };

    // first check if we need to add the stripe paymentMethod
    if (this.stripePromise && opts.createPaymentMethod) {
      // Get Stripe payload
      const payload = await opts.createPaymentMethod();

      if (payload.error) {
        // Return the error in case Stripe failed to create a payment method
        return {
          response: null,
          body: {
            errors: [
              {
                code: 'STRIPE_CLIENT_ERROR',
                message: 'Error creating payment method',
                field: 'paymentMethod'
              }
            ]
          }
        };
      }

      // Add the paymentMethod to the data
      appendExtraData(data, 'paymentMethod', payload.paymentMethod.id);

      // Send a request to Formspree server to handle the payment method
      const response = await fetchImpl(url, {
        ...request,
        body: data
      });
      const responseData = await response.json();

      // Handle SCA
      if (
        responseData &&
        responseData.stripe &&
        responseData.stripe.requiresAction &&
        responseData.resubmitKey
      ) {
        return await handleSCA({
          stripePromise: this.stripePromise,
          responseData,
          response,
          payload,
          data,
          fetchImpl,
          request,
          url
        });
      }

      return handleLegacyErrorPayload({
        response,
        body: responseData
      });
    } else {
      return fetchImpl(url, request)
        .then(response => {
          return response.json().then(
            (body: SubmissionBody): SubmissionResponse => {
              return handleLegacyErrorPayload({ body, response });
            }
          );
        })
        .catch();
    }
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
