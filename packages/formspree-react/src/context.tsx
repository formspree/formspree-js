import { createClient, getDefaultClient, type Client } from '@formspree/core';
import { CardElement } from '@stripe/react-stripe-js';
import type { Stripe, StripeCardElement } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure.js';
import React, {
  Suspense,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const Elements = lazy(() =>
  import('@stripe/react-stripe-js').then((module) => {
    return { default: module.Elements };
  })
);

export type FromspreeContextType = {
  cardElement?: StripeCardElement | null;
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
  const cardElement = useMemo(
    () => stripe?.elements().getElement(CardElement),
    [stripe]
  );

  useEffect(() => {
    if (stripePK) {
      getStripe(stripePK).then((stripe) => stripe && setStripe(stripe));
    }
  }, [stripePK]);

  useEffect(() => {
    setClient(createClient({ project, stripe }));
  }, [project, stripe]);

  return (
    <FormspreeContext.Provider value={{ cardElement, client }}>
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
