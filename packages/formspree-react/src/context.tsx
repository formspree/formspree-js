import { createClient, getDefaultClient, type Client } from '@formspree/core';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure.js';
import React, { useContext, useEffect, useState, type ReactNode } from 'react';

export type FormspreeContextType = {
  client: Client;
};

export type FormspreeProviderProps = {
  children: ReactNode;
  project?: string;
  stripePK?: string;
};

const FormspreeContext = React.createContext<FormspreeContextType | null>(null);

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
  const [client, setClient] = useState(createClient({ project }));

  useEffect(() => {
    let isMounted = true;
    if (stripePK) {
      getStripe(stripePK).then((stripe) => {
        if (stripe && isMounted) {
          setClient((client) => createClient({ ...client, stripe }));
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [stripePK]);

  useEffect(() => {
    setClient((client) =>
      client.project !== project ? createClient({ ...client, project }) : client
    );
  }, [project]);

  return (
    <FormspreeContext.Provider value={{ client }}>
      {children}
    </FormspreeContext.Provider>
  );
}

export function useFormspree(): FormspreeContextType {
  return useContext(FormspreeContext) ?? { client: getDefaultClient() };
}
