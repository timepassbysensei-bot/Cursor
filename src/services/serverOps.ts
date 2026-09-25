import { chatEndpoint, supabase } from "../lib/supabaseClient";

/**
 * Operations that cannot be done from the browser with the anon key.
 *
 * Deleting an auth user requires the service-role key, so it happens in a
 * Netlify function. The function re-verifies the caller's admin role against
 * the database — this wrapper only forwards the session token.
 */

async function postFunction<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session expired. Please sign in again.");

  const base = chatEndpoint.replace(/\/[^/]*$/, "");
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = "The server could not complete that action.";
    try {
      const parsed = (await response.json()) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      /* keep the generic message */
    }
    if (response.status === 404) {
      message =
        "The server function is not deployed. Run the site through Netlify (or `netlify dev`) to enable account deletion.";
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function deleteClientAccount(userId: string): Promise<void> {
  await postFunction<{ ok: boolean }>("/admin-delete-client", { userId });
}
