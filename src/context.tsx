import React, { useEffect, useState, useContext } from 'react';
import { StaticKit as Client, createClient } from '@statickit/core';

interface Context {
  client: Client;
}

export interface Props {
  site: string;
}

const StaticKitContext = React.createContext<Context>({
  client: undefined
});

StaticKitContext.displayName = 'StaticKit';

export const StaticKit: React.FC<Props> = props => {
  if (!props.site) {
    throw new Error('site is required');
  }

  const [client, _setClient] = useState(createClient({ site: props.site }));

  useEffect(() => {
    client.startBrowserSession();

    return () => {
      client.teardown();
    };
  }, []);

  return (
    <StaticKitContext.Provider value={{ client }}>
      {props.children}
    </StaticKitContext.Provider>
  );
};

export function useStaticKit(): Client {
  const { client } = useContext(StaticKitContext);
  return client;
}
