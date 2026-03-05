'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { Client } from '@/types';

interface IaraContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  clients: Client[];
  setClients: (clients: Client[]) => void;
}

const IaraContext = createContext<IaraContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  clients: [],
  setClients: () => {},
});

export function IaraProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, clients, setClients }),
    [isOpen, open, close, toggle, clients, setClients]
  );

  return (
    <IaraContext.Provider value={value}>
      {children}
    </IaraContext.Provider>
  );
}

export function useIara() {
  return useContext(IaraContext);
}
