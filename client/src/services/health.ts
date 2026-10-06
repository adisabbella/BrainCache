export async function checkHealth(): Promise<{ status: string } | null> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}