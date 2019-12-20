import React, { useEffect, useState, useContext } from 'react';
import StaticKitFactory from '@statickit/core';

const StaticKitContext = React.createContext({
  client: null
});

StaticKitContext.displayName = 'StaticKit';

export function StaticKit(props) {
  const [client, setClient] = useState(null);
  const [site, _] = useState(props.site);

  useEffect(() => {
    setClient(StaticKitFactory({ site }));

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
