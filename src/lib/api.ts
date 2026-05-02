// Helper to call our API routes instead of Supabase Edge Functions
export async function callApi<T = any>(
  endpoint: string,
  body: Record<string, any>,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: new Error(data.error || `API error: ${response.status}`) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
