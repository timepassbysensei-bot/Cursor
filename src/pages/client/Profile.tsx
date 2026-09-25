import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, Mail, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { profileSchema, type ProfileInput } from "../../validation/schemas";
import { requestPasswordReset, updateOwnProfile } from "../../services/auth";
import { removeStorageObject, uploadAvatar } from "../../services/uploads";
import { errorMessage, initialsOf } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { MediaUploader } from "../../components/MediaUploader";
import { useToast } from "../../components/ui/Toast";
import type { ClientStatus } from "../../types";

const STATUS_TONE: Record<ClientStatus, "jade" | "amber" | "neutral" | "coral"> = {
  active: "jade",
  pending: "amber",
  suspended: "neutral",
  banned: "coral",
};

export default function Profile() {
  const { profile, user, status, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const [savingAvatar, setSavingAvatar] = useState(false);

  useSeo({
    title: "Your profile — Arian",
    description: "Update your name, profile picture and password.",
    noIndex: true,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile?.full_name ?? "", bio: profile?.bio ?? "" },
  });

  useEffect(() => {
    reset({ fullName: profile?.full_name ?? "", bio: profile?.bio ?? "" });
  }, [profile?.full_name, profile?.bio, reset]);

  const onSubmit = async (values: ProfileInput) => {
    if (!user) return;
    try {
      await updateOwnProfile(user.id, { full_name: values.fullName, bio: values.bio || null });
      await refreshProfile();
      push({ title: "Profile updated", variant: "success" });
    } catch (error) {
      push({ title: "Could not save", description: errorMessage(error), variant: "error" });
    }
  };

  const onAvatar = async (file: File, onProgress: (percent: number) => void) => {
    if (!user) throw new Error("You are not signed in.");
    setSavingAvatar(true);
    try {
      const previous = profile?.avatar_url;
      const uploaded = await uploadAvatar(file, user.id, onProgress);
      await updateOwnProfile(user.id, { avatar_url: uploaded.publicUrl });
      await refreshProfile();

      // Tidy up the replaced file; a failure here is not worth surfacing.
      if (previous?.includes("/avatars/")) {
        const oldPath = previous.split("/avatars/")[1];
        if (oldPath) void removeStorageObject("avatars", oldPath).catch(() => undefined);
      }
      push({ title: "Profile picture updated", variant: "success" });
    } finally {
      setSavingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    try {
      await updateOwnProfile(user.id, { avatar_url: null });
      const path = profile.avatar_url.split("/avatars/")[1];
      if (path) await removeStorageObject("avatars", path).catch(() => undefined);
      await refreshProfile();
      push({ title: "Profile picture removed", variant: "success" });
    } catch (error) {
      push({ title: "Could not remove the picture", description: errorMessage(error), variant: "error" });
    }
  };

  const sendReset = async () => {
    if (!profile?.email) return;
    try {
      await requestPasswordReset(profile.email);
      push({ title: "Password reset email sent", variant: "success" });
    } catch (error) {
      push({ title: "Could not send the email", description: errorMessage(error), variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Your account"
        description="Your name and picture are only visible to you and Arian. Your email address stays fixed — it identifies the account."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <Panel className="p-6">
          <h2 className="font-display text-base font-semibold text-ink">Details</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
            <Field label="Display name" htmlFor="profile-name" error={errors.fullName?.message} required>
              <input id="profile-name" className="input" autoComplete="name" {...register("fullName")} />
            </Field>

            <Field
              label="About you"
              htmlFor="profile-bio"
              error={errors.bio?.message}
              hint="Optional — a line about yourself, only visible to Arian."
            >
              <textarea id="profile-bio" rows={3} className="input" {...register("bio")} />
            </Field>

            <Field label="Email" htmlFor="profile-email" hint="Contact Arian if this needs to change.">
              <input id="profile-email" className="input" value={profile?.email ?? ""} readOnly disabled />
            </Field>

            <div className="flex justify-end border-t border-hairline pt-5">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <h2 className="font-display text-base font-semibold text-ink">Profile picture</h2>
            <div className="mt-5 flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-blue/30 to-violet/30 font-display text-lg font-bold text-ink">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(profile?.full_name || profile?.email || "?")
                )}
              </span>
              {profile?.avatar_url && (
                <Button variant="ghost" size="sm" onClick={() => void removeAvatar()}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </Button>
              )}
            </div>

            <div className="mt-5">
              <MediaUploader
                kind="image"
                accept="image/png,image/jpeg,image/webp,image/avif"
                title="Drop a picture here"
                hint="JPG, PNG, WebP or AVIF. Large images are resized in your browser before upload."
                disabled={savingAvatar}
                onUpload={onAvatar}
              />
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="font-display text-base font-semibold text-ink">Account status</h2>
            <div className="mt-4 flex items-center gap-3">
              <Badge tone={status ? STATUS_TONE[status] : "neutral"}>
                {status === "active" ? "Active" : status === "pending" ? "Pending approval" : status ?? "Unknown"}
              </Badge>
              <span className="text-xs text-muted">
                {status === "active"
                  ? "Messaging and sponsorship are unlocked."
                  : "Arian reviews new accounts before messaging unlocks."}
              </span>
            </div>

            <dl className="mt-5 space-y-3 border-t border-hairline pt-5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Account type</dt>
                <dd className="font-medium capitalize text-ink">{profile?.role ?? "client"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Member since</dt>
                <dd className="font-medium text-ink">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-hairline pt-5">
              <Button variant="outline" size="sm" onClick={() => void sendReset()}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Email me a password reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </Button>
            </div>

            <p className="mt-5 flex items-start gap-2 text-2xs leading-relaxed text-faint">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" aria-hidden />
              Only your own profile row is readable from this account — the database enforces that, not just this
              page.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
