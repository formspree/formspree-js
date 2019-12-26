import React, { useEffect, useState, useContext } from 'react';
import createClient from '@statickit/core';

const StaticKitContext = React.createContext({
  client: null
});

StaticKitContext.displayName = 'StaticKit';

export function StaticKit(props) {
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
}

export function useStaticKit() {
  const { client } = useContext(StaticKitContext);
  return client;
}
