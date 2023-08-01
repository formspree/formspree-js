import { createClient, getDefaultClient, type Client } from '@formspree/core';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure.js';
import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type FormspreeContextType = {
  client: Client;
};

export type FormspreeProviderProps = {
  children: ReactNode;
  project?: string;
  stripePK?: string;
};

const FormspreeContext = React.createContext<FormspreeContextType | null>(null);

/**
 * FormspreeProvider creates Formspree Client based on the given props
 * and makes the client available via context.
 */
export function FormspreeProvider(props: FormspreeProviderProps) {
  const { children, project, stripePK } = props;
  const [client, setClient] = useState(createClient({ project }));
  const stripePromise = useMemo(
    () => (stripePK ? loadStripe(stripePK) : null),
    [stripePK]
  );

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      setClient((client) =>
        client.project !== project
          ? createClient({ ...client, project })
          : client
      );
    }
    return () => {
      isMounted = false;
    };
  }, [project]);

  useEffect(() => {
    let isMounted = true;
    stripePromise?.then((stripe) => {
      if (isMounted && stripe) {
        setClient((client) => createClient({ ...client, stripe }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [stripePromise]);

  return (
    <FormspreeContext.Provider value={{ client }}>
      {stripePromise ? (
        <Elements stripe={stripePromise}>{children}</Elements>
      ) : (
        children
      )}
    </FormspreeContext.Provider>
  );
}

export function useFormspree(): FormspreeContextType {
  return useContext(FormspreeContext) ?? { client: getDefaultClient() };
}
