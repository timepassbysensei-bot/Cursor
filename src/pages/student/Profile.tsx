import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { formatDate } from "../../lib/utils";

export default function StudentProfile() {
  const { profile } = useAuth();
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setPhone(profile.phone ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
        throw new Error("Enter a valid 10-digit Indian mobile number");
      }
      const { error: err } = await supabase
        .from("profiles")
        .update({ phone: phone.replace(/\s/g, "") })
        .eq("id", profile!.id);
      if (err) throw err;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!profile) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">My Profile</h1>
        <p className="mt-1 text-sm text-muted">Your academy record. Only your phone number can be edited here.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Full name", profile.full_name],
              ["Email", profile.email ?? "—"],
              ["Roll number", profile.roll_number ?? "Not assigned"],
              ["Member since", formatDate(profile.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-lightgray/70 pb-2 last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy">Update phone number</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              save.mutate();
            }}
          >
            <div>
              <label htmlFor="sp-phone" className="mb-1.5 block text-sm font-semibold text-ink">Phone</label>
              <input
                id="sp-phone"
                className="input"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </div>
            {saved && <p role="status" className="rounded-lg border border-green-success/25 bg-green-success/[0.06] px-4 py-3 text-sm text-green-success">Phone updated ✓</p>}
            {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…</> : <><Save className="h-4 w-4" aria-hidden /> Save</>}
            </Button>
          </form>

          <div className="mt-6 border-t border-lightgray pt-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
              <KeyRound className="h-4 w-4" aria-hidden /> Password
            </h3>
            <p className="mt-1 text-sm text-muted">Change your password regularly.</p>
            <Link to="/auth/change-password" className="mt-2 inline-block text-sm font-semibold text-saffron underline">
              Change password
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
