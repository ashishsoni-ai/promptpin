const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function apiFetch(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getFeed: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/images${qs}`);
  },
  getImage: (id: string) => apiFetch(`/images/${id}`),
  uploadImage: async (form: FormData, token: string) => {
    const r = await fetch(`${API}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail ?? `Upload failed: ${r.status}`);
    }
    return r.json();
  },
  deleteImage: (id: string, token: string) =>
    apiFetch(`/images/${id}`, { method: "DELETE" }, token),
  likeImage: (id: string, token: string) =>
    apiFetch(`/images/${id}/like`, { method: "POST" }, token),
  copyPrompt: (id: string, token?: string) =>
    apiFetch(`/prompts/${id}/copy`, { method: "POST" }, token),
  enhancePrompt: (prompt: string, style: string, token: string) =>
    apiFetch("/prompts/enhance", { method: "POST", body: JSON.stringify({ prompt, style }) }, token),
  remixPrompt: (prompt: string, token: string) =>
    apiFetch("/prompts/remix", { method: "POST", body: JSON.stringify({ prompt }) }, token),
  search: (q: string) => apiFetch(`/search?q=${encodeURIComponent(q)}`),
  getUser: (id: string) => apiFetch(`/users/${id}`),
  getMe: (token: string) => apiFetch("/users/me", {}, token),
  getUserImages: (id: string) => apiFetch(`/users/${id}/images`),
  getCollections: (token: string) => apiFetch("/collections", {}, token),
  createCollection: (name: string, token: string) =>
    apiFetch("/collections", { method: "POST", body: JSON.stringify({ name }) }, token),
  saveToCollection: (collectionId: string, imageId: string, token: string) =>
    apiFetch(`/collections/${collectionId}/save/${imageId}`, { method: "POST" }, token),
  chatPrompt: (message: string, history: { role: string; text: string }[], token?: string) =>
    apiFetch("/prompts/chat", { method: "POST", body: JSON.stringify({ message, history }) }, token),
  getUserProfile: (id: string, token?: string) => apiFetch(`/users/${id}/profile`, {}, token),
  toggleFollow: (id: string, token: string) =>
    apiFetch(`/users/${id}/follow`, { method: "POST" }, token),
  quickSave: (imageId: string, token: string) =>
    apiFetch(`/images/${imageId}/save`, { method: "POST" }, token),
  getSavedImages: (token: string) => apiFetch("/images/saved/list", {}, token),
  getSaveStatus: (imageId: string, token: string) =>
    apiFetch(`/images/${imageId}/save-status`, {}, token),
  // Billing
  createCheckout: (token: string) =>
    apiFetch("/billing/checkout", { method: "POST" }, token),
  openBillingPortal: (token: string) =>
    apiFetch("/billing/portal", { method: "POST" }, token),
  getBillingStatus: (token: string) => apiFetch("/billing/status", {}, token),
};
