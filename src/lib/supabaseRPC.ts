export async function callSupabaseFunction(
  functionName: string,
  payload: Record<string, any>
) {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    console.error("Missing VITE_SUPABASE_ANON_KEY");
    return null;
  }

  const url = `https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/${functionName}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`RPC error: ${res.status}`, await res.text());
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}