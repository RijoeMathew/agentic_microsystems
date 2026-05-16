import { getAuthenticatedHeaders } from './auth';

export type MeshDesignNode = {
  id: string;
  name: string;
  icon: 'hub' | 'database' | 'routing' | 'insight' | 'shield' | 'signal';
  role: string;
  agent: string;
  api: string;
  status: 'Active' | 'Learning' | 'Queued';
  latency: string;
  accentColor: string;
  description: string;
};

export type MeshDesignSnapshot = {
  nodes: MeshDesignNode[];
  positions: Record<string, { x: number; y: number }>;
  connectionIds: string[];
};

export type MeshDesign = MeshDesignSnapshot & {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: getAuthenticatedHeaders(init?.headers),
  });
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Mesh design request failed.');
  }

  return payload as T;
}

export async function getMeshDesigns() {
  return request<{ designs: MeshDesign[] }>('/api/mesh-designs');
}

export async function createMeshDesign(name: string, snapshot: MeshDesignSnapshot) {
  return request<{ design: MeshDesign }>('/api/mesh-designs', {
    method: 'POST',
    body: JSON.stringify({
      name,
      ...snapshot,
    }),
  });
}

export async function updateMeshDesign(id: string, snapshot: MeshDesignSnapshot) {
  return request<{ design: MeshDesign }>(`/api/mesh-designs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(snapshot),
  });
}
