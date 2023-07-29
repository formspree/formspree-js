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
    setClient((client) =>
      client.project !== project ? createClient({ ...client, project }) : client
    );
  }, [project]);

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
