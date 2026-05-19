import { createContext, useState, useEffect, useContext, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

export type Client = {
  id: number;
  name: string;
  logo: string | null;
  industry: string | null;
  description: string | null;
  createdAt: string;
  trelloBoardId: string | null;
  sheetUrl: string | null;
  sheetLastSyncAt: string | null;
  accountsCount: number;
  postsCount: number;
};

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  selectClient: (c: Client) => void;
  loading: boolean;
  reload: () => Promise<void>;
}

export const ClientContext = createContext<ClientContextType>({
  clients: [],
  selectedClient: null,
  selectClient: () => {},
  loading: false,
  reload: async () => {},
});

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useContext(AuthContext);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: Client[] = await res.json();
      setClients(data);

      const savedId = Number(localStorage.getItem("selectedClientId") ?? "0");
      const match = data.find(c => c.id === savedId);
      if (match) {
        setSelected(match);
      } else if (data.length > 0) {
        setSelected(data[0]);
        localStorage.setItem("selectedClientId", String(data[0].id));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const selectClient = (c: Client) => {
    setSelected(c);
    localStorage.setItem("selectedClientId", String(c.id));
  };

  return (
    <ClientContext.Provider value={{ clients, selectedClient, selectClient, loading, reload }}>
      {children}
    </ClientContext.Provider>
  );
};
