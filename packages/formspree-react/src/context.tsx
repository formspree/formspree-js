import React, { useEffect, useState, useContext, lazy, Suspense } from 'react';
import {
  Client,
  Config,
  createClient,
  getDefaultClient
} from '@formspree/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const Elements = lazy(() =>
  import('@stripe/react-stripe-js').then(module => {
    return { default: module.Elements };
  })
);

export type FromspreeContextType = {
  client: Client;
}

export type FormspreeProviderProps = {
  project?: string;
  children: React.ReactNode;
  stripePK?: string;
}

const FormspreeContext = React.createContext<FromspreeContextType>({
  client: undefined
});

FormspreeContext.displayName = 'Formspree';

let stripePromise: Promise<Stripe>;

const getStripe = (stripeKey: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripeKey);
  }
  return stripePromise;
};

const handleCreateClient = (promise?: Stripe, project?: string) => {
  let config: Config = {};

  if (promise) {
    config.stripePromise = promise;
  }

  if (project) {
    config.project = project;
  }

  return createClient(config);
};

export const FormspreeProvider = (props: FormspreeProviderProps) => {
  const [stateStripePromise, setStateStripePromise] = useState<
    Stripe | undefined
  >(undefined);
  const [client, setClient] = useState<Client>(
    handleCreateClient(stateStripePromise, props.project)
  );

  useEffect(() => {
    client.startBrowserSession();

    return () => {
      client.teardown();
    };
  }, []);

  useEffect(() => {
    const getStripePromise = async () => {
      const promiseStripe = await getStripe(props.stripePK);
      setStateStripePromise(promiseStripe);
    };

    if (props.stripePK) {
      getStripePromise();
    }
  }, [props.stripePK]);

  useEffect(() => {
    if (stateStripePromise) {
      setClient(handleCreateClient(stateStripePromise, props.project));
    }
  }, [stateStripePromise]);

  return (
    <FormspreeContext.Provider value={{ client }}>
      {props.stripePK ? (
        <>
          {stateStripePromise && (
            <Suspense fallback={<p>....</p>}>
              <Elements stripe={stateStripePromise}>
                <>{props.children}</>
              </Elements>
            </Suspense>
          )}
        </>
      ) : (
        <>{props.children}</>
      )}
    </FormspreeContext.Provider>
  );
};

export function useFormspree() {
  const context = useContext(FormspreeContext);

  return context.client
    ? context
    : {
        client: getDefaultClient()
      };
}
