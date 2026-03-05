'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
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

  return (
    <IaraContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((v) => !v),
        clients,
        setClients,
      }}
    >
      {children}
    </IaraContext.Provider>
  );
}

export function useIara() {
  return useContext(IaraContext);
}
