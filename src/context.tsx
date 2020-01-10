import React, { useEffect, useState, useContext } from 'react';
import { StaticKit, createClient } from '@statickit/core';

interface Context {
  client: StaticKit;
}

export interface Props {
  site: string;
}

const StaticKitContext = React.createContext<Context>({
  client: undefined
});

StaticKitContext.displayName = 'StaticKit';

export const StaticKitProvider: React.FC<Props> = props => {
  if (!props.site) {
    throw new Error('site is required');
  }

  const [client] = useState(() => {
    return createClient({ site: props.site });
  });

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

export function useStaticKit(): StaticKit {
  const { client } = useContext(StaticKitContext);
  return client;
}
