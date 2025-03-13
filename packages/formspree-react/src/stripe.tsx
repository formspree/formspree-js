import React from 'react';
import { useElements } from '@stripe/react-stripe-js';
import type { StripeElements } from '@stripe/stripe-js';
import { createContext, useContext, type PropsWithChildren } from 'react';

type StripeContextValue = {
  elements: StripeElements | null;
};

const StripeContext = createContext<StripeContextValue>({ elements: null });

export function StripeProvider(props: PropsWithChildren) {
  const { children } = props;
  const elements = useElements();
  return (
    <StripeContext.Provider value={{ elements }}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripeContext(): StripeContextValue {
  return useContext(StripeContext);
}
