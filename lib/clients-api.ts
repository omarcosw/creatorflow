import { Client } from '@/types';

function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('cf_token') || '' : '';
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch('/api/clients', { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao carregar clientes');
  }
  const data = await res.json();
  return data.clients;
}

export async function createClient(
  draft: Omit<Client, 'id' | 'createdAt'>
): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(draft),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao criar cliente');
  }
  const data = await res.json();
  return data.client;
}

export async function deleteClientAPI(clientId: string): Promise<void> {
  const res = await fetch(`/api/clients/${clientId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao excluir cliente');
  }
}

export async function fetchClientData<T>(clientId: string, dataType: string): Promise<T> {
  const res = await fetch(`/api/clients/${clientId}/data/${dataType}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao carregar dados');
  }
  const result = await res.json();
  return result.data as T;
}

export async function saveClientData(clientId: string, dataType: string, data: unknown): Promise<void> {
  const res = await fetch(`/api/clients/${clientId}/data/${dataType}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new Error(result.error || 'Erro ao salvar dados');
  }
}

// ── User-level data (not per-client) ──────────────────────────

export async function fetchUserData<T>(dataType: string): Promise<T | null> {
  const res = await fetch(`/api/user-data/${dataType}`, { headers: headers() });
  if (!res.ok) return null;
  const result = await res.json();
  return result.data as T | null;
}

export async function saveUserData(dataType: string, data: unknown): Promise<void> {
  const res = await fetch(`/api/user-data/${dataType}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new Error(result.error || 'Erro ao salvar dados');
  }
}

// ── Migration ────────────────────────────────────────────────

interface MigrationClient extends Client {
  subData?: Record<string, unknown>;
}

export async function migrateFromLocalStorage(clients: MigrationClient[]): Promise<void> {
  const res = await fetch('/api/clients/migrate', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ clients }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao migrar dados');
  }
}
