import React, { Suspense, lazy, useContext, useEffect, useState } from 'react';
import { createClient, getDefaultClient } from '@formspree/core';
import type { Client, Config } from '@formspree/core';
import { loadStripe } from '@stripe/stripe-js/pure.js';
import type { Stripe } from '@stripe/stripe-js';

const Elements = lazy(() =>
  import('@stripe/react-stripe-js').then((module) => {
    return { default: module.Elements };
  })
);

export type FromspreeContextType = {
  client: Client;
};

export type FormspreeProviderProps = {
  project?: string;
  children: React.ReactNode;
  stripePK?: string;
};

const FormspreeContext = React.createContext<FromspreeContextType | null>(null);

FormspreeContext.displayName = 'Formspree';

let stripePromise: Promise<Stripe | null>;

const getStripe = (stripeKey: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripeKey);
  }
  return stripePromise;
};

const handleCreateClient = (promise?: Stripe, project?: string) => {
  const config: Config = {};

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
    const getStripePromise = async (stripeKey: string) => {
      const promiseStripe = await getStripe(stripeKey);
      if (promiseStripe) {
        setStateStripePromise(promiseStripe);
      }
    };

    if (props.stripePK) {
      getStripePromise(props.stripePK);
    }
  }, [props.stripePK]);

  useEffect(() => {
    if (stateStripePromise) {
      setClient(handleCreateClient(stateStripePromise, props.project));
    }
  }, [props.project, stateStripePromise]);

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

export function useFormspree(): FromspreeContextType {
  return useContext(FormspreeContext) ?? { client: getDefaultClient() };
}
