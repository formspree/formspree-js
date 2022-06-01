import React, { useEffect, useState, useContext } from 'react';
import { Client, createClient, getDefaultClient } from '@formspree/core';

interface Context {
  client: Client;
}

export interface Props {
  project: string;
}

const FormspreeContext = React.createContext<Context>({
  client: undefined
});

FormspreeContext.displayName = 'Formspree';

export const FormspreeProvider: React.FC<
  React.PropsWithChildren<Props>
> = props => {
  if (!props.project) {
    throw new Error('project is required');
  }

  const [client] = useState(() => {
    return createClient({ project: props.project });
  });

  useEffect(() => {
    client.startBrowserSession();

    return () => {
      client.teardown();
    };
  }, []);

  return (
    <FormspreeContext.Provider value={{ client }}>
      {props.children}
    </FormspreeContext.Provider>
  );
};

export function useFormspree(): Client {
  const { client } = useContext(FormspreeContext);
  return client || getDefaultClient();
}
