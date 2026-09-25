/**
 * POST /api/admin-delete-client  { userId }
 *
 * Deleting an auth user needs the service-role key, so it happens here rather
 * than in the browser. The caller's own token is verified against the database
 * before anything is deleted — an "admin" claim from the client is never
 * trusted, and the role check is the same one the RLS policies use.
 *
 * Guards:
 *   · the caller must be an active admin;
 *   · an admin cannot delete their own account through this endpoint;
 *   · an admin cannot delete another admin.
 */

export default async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return json(503, {
      error:
        "Account deletion needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set for this site's functions.",
    });
  }

  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return json(401, { error: "Sign in as an admin and try again." });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Send a JSON body with a userId." });
  }

  const targetId = typeof body?.userId === "string" ? body.userId : "";
  if (!isUuid(targetId)) return json(400, { error: "A valid userId is required." });

  const serviceHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    // 1. Who is calling? Ask the auth server, not the request body.
    const callerResponse = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (!callerResponse.ok) return json(401, { error: "That session is no longer valid. Sign in again." });
    const caller = await callerResponse.json();
    const callerId = caller?.id;
    if (!callerId) return json(401, { error: "That session is no longer valid. Sign in again." });

    // 2. Is the caller an active admin, and who are they deleting?
    const profilesResponse = await fetch(
      `${url}/rest/v1/profiles?select=id,role,status&id=in.(${callerId},${targetId})`,
      { headers: serviceHeaders }
    );
    if (!profilesResponse.ok) return json(500, { error: "Could not verify permissions." });
    const rows = await profilesResponse.json();
    const callerProfile = rows.find((row) => row.id === callerId);
    const targetProfile = rows.find((row) => row.id === targetId);

    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.status !== "active") {
      return json(403, { error: "Only an active admin can delete accounts." });
    }
    if (targetId === callerId) {
      return json(400, { error: "You cannot delete your own account from here." });
    }
    if (targetProfile?.role === "admin") {
      return json(400, { error: "Admin accounts must be removed directly in Supabase." });
    }
    if (!targetProfile) {
      return json(404, { error: "That account no longer exists." });
    }

    // 3. Delete the auth user. Profiles, messages, deliveries and sponsorship
    //    leads cascade from the foreign keys in the migration.
    const deleteResponse = await fetch(`${url}/auth/v1/admin/users/${targetId}`, {
      method: "DELETE",
      headers: serviceHeaders,
    });
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const detail = await deleteResponse.text();
      console.error("Supabase delete failed", deleteResponse.status, detail.slice(0, 300));
      return json(502, { error: "Supabase refused the deletion. Check the service-role key's permissions." });
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error("admin-delete-client failed:", error);
    return json(500, { error: "Something went wrong deleting that account." });
  }
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function bearerToken(header) {
  if (!header || !/^Bearer\s+/i.test(header)) return null;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token.length > 20 ? token : null;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
