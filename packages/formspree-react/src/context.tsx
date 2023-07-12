import React, {
  Suspense,
  lazy,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createClient, getDefaultClient } from '@formspree/core';
import type { Client } from '@formspree/core';
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
  children: ReactNode;
  project?: string;
  // Stripe
  loadingStripe?: ReactNode;
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

/**
 * FormspreeProvider creates Formspree Client based on the given props
 * and makes the client available through via context.
 */
export const FormspreeProvider = (props: FormspreeProviderProps) => {
  const { children, project, loadingStripe, stripePK } = props;

  const [client, setClient] = useState<Client>(createClient({ project }));
  const [stripe, setStripe] = useState<Stripe | undefined>(undefined);

  useEffect(() => {
    if (stripePK) {
      getStripe(stripePK).then((stripe) => stripe && setStripe(stripe));
    }
  }, [stripePK]);

  useEffect(() => {
    setClient(createClient({ project, stripe }));
  }, [project, stripe]);

  return (
    <FormspreeContext.Provider value={{ client }}>
      {stripePK ? (
        stripe ? (
          <Suspense fallback={loadingStripe}>
            <Elements stripe={stripe}>{children}</Elements>
          </Suspense>
        ) : null
      ) : (
        children
      )}
    </FormspreeContext.Provider>
  );
};

export function useFormspree(): FromspreeContextType {
  return useContext(FormspreeContext) ?? { client: getDefaultClient() };
}
