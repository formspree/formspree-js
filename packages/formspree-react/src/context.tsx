import { createClient, getDefaultClient, type Client } from '@formspree/core';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import React, { useContext, useEffect, useState, type ReactNode } from 'react';

export type FromspreeContextType = {
  client: Client;
};

export type FormspreeProviderProps = {
  children: ReactNode;
  project?: string;
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
export function FormspreeProvider(props: FormspreeProviderProps) {
  const { children, project, stripePK } = props;

  const [client, setClient] = useState<Client>(createClient({ project }));
  const [stripe, setStripe] = useState<Stripe | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    if (stripePK) {
      getStripe(stripePK).then((stripe) => {
        if (stripe && isMounted) {
          setStripe(stripe);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [stripePK]);

  useEffect(() => {
    setClient(createClient({ project, stripe }));
  }, [project, stripe]);

  return (
    <FormspreeContext.Provider value={{ client }}>
      {children}
    </FormspreeContext.Provider>
  );
}

export function useFormspree(): FromspreeContextType {
  return useContext(FormspreeContext) ?? { client: getDefaultClient() };
}
