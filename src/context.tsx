import React, { useEffect, useState, useContext } from 'react';
import { StaticKit as Client, createClient } from '@statickit/core';

interface Context {
  client: undefined | Client;
}

export interface Props {
  site?: string;
  client?: Client;
}

const StaticKitContext = React.createContext<Context>({
  client: undefined
});

StaticKitContext.displayName = 'StaticKit';

export const StaticKit: React.FC<Props> = props => {
  const [client, setClient] = useState(props.client);
  const [site, _] = useState(props.site);

  if (!props.client && !props.site) {
    throw new Error('site prop is required');
  }

  useEffect(() => {
    if (!client) {
      setClient(createClient({ site }));
    }

    return () => {
      if (client) client.teardown();
    };
  }, [site]);

  return (
    <StaticKitContext.Provider value={{ client }}>
      {props.children}
    </StaticKitContext.Provider>
  );
};

export function useStaticKit(): Client | undefined {
  const { client } = useContext(StaticKitContext);
  return client;
}
