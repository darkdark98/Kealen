import React, { createContext, useContext } from 'react';

export type TabName = 'discover' | 'chats' | 'create' | 'me';

export type Route =
  | { name: 'tabs' }
  | { name: 'character'; id: string }
  | { name: 'chat'; id: string }
  | { name: 'settings' };

export interface Nav {
  push: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  setTab: (t: TabName) => void;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav() {
  const n = useContext(NavContext);
  if (!n) throw new Error('useNav outside provider');
  return n;
}
