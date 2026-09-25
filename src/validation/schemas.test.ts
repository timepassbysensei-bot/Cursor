import { describe, expect, it } from "vitest";
import {
  broadcastSchema,
  contactSchema,
  galleryMetaSchema,
  loginSchema,
  newPasswordSchema,
  signupSchema,
  sponsorshipSchema,
  videoSchema,
} from "./schemas";
import { extractYouTubeId } from "../lib/youtube";

const VALID_ID = "dQw4w9WgXcQ";

describe("contactSchema", () => {
  it("accepts a well-formed message", () => {
    const result = contactSchema.safeParse({
      name: "Ravi Kumar",
      email: "ravi@example.com",
      subject: "Build question",
      message: "How should I build this character for a beginner account?",
      honeypot: "",
    });
    expect(result.success).toBe(true);
  });

  it("requires a real email address and a message with some substance", () => {
    const bad = contactSchema.safeParse({
      name: "R",
      email: "not-an-email",
      message: "hi",
      honeypot: "",
    });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const paths = bad.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("name");
      expect(paths).toContain("email");
      expect(paths).toContain("message");
    }
  });

  it("rejects a filled honeypot", () => {
    const result = contactSchema.safeParse({
      name: "Bot",
      email: "bot@example.com",
      message: "Buy cheap things from this link right now",
      honeypot: "http://spam.example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("sponsorshipSchema", () => {
  it("accepts a brief with optional fields left blank", () => {
    const result = sponsorshipSchema.safeParse({
      name: "Priya Sharma",
      email: "priya@brand.example.com",
      company: "",
      website: "",
      campaignObjective: "",
      preferredPlatform: "",
      budget: "",
      timeline: "",
      message: "We would like to discuss a launch campaign for our new mobile game.",
      honeypot: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a website that is not an http(s) link", () => {
    const result = sponsorshipSchema.safeParse({
      name: "Priya Sharma",
      email: "priya@brand.example.com",
      website: "brand.example.com",
      message: "We would like to discuss a launch campaign for our new mobile game.",
      honeypot: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("requires a password on login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "secret" }).success).toBe(true);
  });

  it("enforces password strength and matching confirmation on signup", () => {
    const weak = signupSchema.safeParse({
      fullName: "Arian Fan",
      email: "fan@example.com",
      password: "password",
      confirmPassword: "password",
      acceptTerms: true,
    });
    expect(weak.success).toBe(false);

    const mismatched = signupSchema.safeParse({
      fullName: "Arian Fan",
      email: "fan@example.com",
      password: "hunter2pass",
      confirmPassword: "hunter3pass",
      acceptTerms: true,
    });
    expect(mismatched.success).toBe(false);

    const good = signupSchema.safeParse({
      fullName: "Arian Fan",
      email: "fan@example.com",
      password: "hunter2pass",
      confirmPassword: "hunter2pass",
      acceptTerms: true,
    });
    expect(good.success).toBe(true);
  });

  it("has no role field at all, so a role can never be chosen at signup", () => {
    const result = signupSchema.safeParse({
      fullName: "Arian Fan",
      email: "fan@example.com",
      password: "hunter2pass",
      confirmPassword: "hunter2pass",
      acceptTerms: true,
      role: "admin",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("role");
    }
  });

  it("requires the terms to be accepted", () => {
    const result = signupSchema.safeParse({
      fullName: "Arian Fan",
      email: "fan@example.com",
      password: "hunter2pass",
      confirmPassword: "hunter2pass",
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("validates a new password and its confirmation", () => {
    expect(newPasswordSchema.safeParse({ password: "short", confirm: "short" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "longenough1", confirm: "longenough1" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "longenough1", confirm: "longenough2" }).success).toBe(false);
  });
});

describe("videoSchema", () => {
  const base = {
    youtube_url: `https://www.youtube.com/watch?v=${VALID_ID}`,
    title: "Genshin Impact lore explained",
    description: "",
    game: "Genshin Impact",
    category: "Lore",
    duration_text: "14:05",
    published_at: "2026-01-15",
    is_featured: true,
    is_published: true,
    sort_order: 0,
  };

  it("accepts a real YouTube link", () => {
    const result = videoSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(extractYouTubeId(result.success ? result.data.youtube_url : "")).toBe(VALID_ID);
  });

  it("rejects a link that is not YouTube", () => {
    expect(videoSchema.safeParse({ ...base, youtube_url: "https://vimeo.com/12345" }).success).toBe(false);
  });

  it("rejects a malformed duration but allows it to be omitted", () => {
    expect(videoSchema.safeParse({ ...base, duration_text: "fourteen minutes" }).success).toBe(false);
    expect(videoSchema.safeParse({ ...base, duration_text: "" }).success).toBe(true);
  });
});

describe("galleryMetaSchema", () => {
  it("requires meaningful alt text", () => {
    expect(
      galleryMetaSchema.safeParse({ title: "Art", alt_text: "short", caption: "", category: "", is_published: true })
        .success
    ).toBe(false);
    expect(
      galleryMetaSchema.safeParse({
        title: "Character art",
        alt_text: "A watercolour portrait of a character holding a sword.",
        caption: "",
        category: "Character art",
        is_published: true,
      }).success
    ).toBe(true);
  });
});

describe("broadcastSchema", () => {
  it("requires a recipient when targeting one client", () => {
    const needsRecipient = broadcastSchema.safeParse({
      title: "Heads up",
      body: "A short note about the new series starting this week.",
      audienceType: "single_client",
      recipientUserId: "",
    });
    expect(needsRecipient.success).toBe(false);

    const withRecipient = broadcastSchema.safeParse({
      title: "Heads up",
      body: "A short note about the new series starting this week.",
      audienceType: "single_client",
      recipientUserId: "8f0f6b1e-1c2d-4a3b-9c4d-5e6f7a8b9c0d",
    });
    expect(withRecipient.success).toBe(true);
  });

  it("allows a public announcement with no recipient", () => {
    expect(
      broadcastSchema.safeParse({
        title: "New series",
        body: "The beginner guide series starts this Friday.",
        audienceType: "public_announcement",
        recipientUserId: "",
      }).success
    ).toBe(true);
  });
});
