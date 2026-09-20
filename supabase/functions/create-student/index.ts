// Supabase Edge Function: create-student
// Deploy: supabase functions deploy create-student
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided),
//               ALLOWED_ADMIN_REDIRECT (optional)
//
// Called only by super_admin/admin (verified via their JWT) from the
// admin Students page. Creates an auth user with a temporary password and
// a student profile. The student changes the password at first sign-in.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing authorization" }, 401, cors);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: auth } = await admin.auth.getUser();
    if (!auth?.user) return json({ error: "Not authenticated" }, 401, cors);

    // Caller must be admin/super_admin
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleRow } = await svc
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id)
      .in("role", ["super_admin", "admin"])
      .maybeSingle();
    if (!roleRow) return json({ error: "Only admins can create accounts" }, 403, cors);

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.full_name ?? "").trim();
    const rollNumber = body.roll_number ? String(body.roll_number).trim() : null;
    const temporaryPassword = String(body.temporary_password ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400, cors);
    if (fullName.length < 2) return json({ error: "Full name required" }, 400, cors);
    if (temporaryPassword.length < 8) return json({ error: "Temporary password must be at least 8 characters" }, 400, cors);

    const { data: created, error: createErr } = await svc.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr) {
      const msg = createErr.message.includes("already")
        ? "A user with this email already exists"
        : createErr.message;
      return json({ error: msg }, 400, cors);
    }

    const { error: profErr } = await svc
      .from("profiles")
      .upsert({
        id: created.user.id,
        email,
        full_name: fullName,
        role: "student",
        roll_number: rollNumber,
        force_password_change: true,
        is_active: true,
      });
    if (profErr) return json({ error: profErr.message }, 500, cors);

    return json({
      ok: true,
      user_id: created.user.id,
      message: "Student account created. Share the temporary password securely — the student must change it at first sign-in.",
    }, 200, cors);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500, cors);
  }
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
