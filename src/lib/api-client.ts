export async function postJSON<T = any>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !("ok" in data)) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export async function sandboxAction<T = any>(action: string, payload?: Record<string, any>) {
  return postJSON<{ ok: boolean; errorCode?: string; data?: T; state: any }>("/api/sandbox/action", {
    action,
    payload,
  });
}

export async function requestHint(missionSlug: string, errorCode: string, maxLevel?: number) {
  return postJSON<{ hint: string; level: number }>("/api/hint", { missionSlug, errorCode, maxLevel });
}

export async function completeMission(missionSlug: string, status: "success" | "failure") {
  return postJSON<{ ok: boolean; credentialIssued: { title: string; verificationId: string } | null }>(
    `/api/missions/${missionSlug}/attempt`,
    { status }
  );
}
