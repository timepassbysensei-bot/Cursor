import { z } from "zod";
import { extractYouTubeId } from "../lib/youtube";
import { AUDIO_TYPES, IMAGE_TYPES } from "../services/uploads";

export const emailField = z
  .string()
  .trim()
  .min(1, "Please enter your email address")
  .email("Enter a valid email address")
  .max(200);

export const nameField = z
  .string()
  .trim()
  .min(2, "Please enter your name")
  .max(100, "That name is too long");

/**
 * Honeypot. It is rendered hidden from humans, so any value at all means a
 * bot filled it. The form treats a filled honeypot as "silently accepted".
 */
export const honeypotField = z.string().max(0).optional().or(z.literal(""));

export const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(value), {
    message: "Enter a full link starting with https://",
  })
  .optional()
  .or(z.literal(""));

// ------------------------------------------------------------------ public
export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  subject: z.string().trim().max(140, "Keep the subject short").optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail")
    .max(4000, "Please keep the message under 4000 characters"),
  honeypot: honeypotField,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const sponsorshipSchema = z.object({
  name: nameField,
  email: emailField,
  company: z.string().trim().max(140).optional().or(z.literal("")),
  website: optionalUrl,
  campaignObjective: z.string().trim().max(1000).optional().or(z.literal("")),
  preferredPlatform: z.string().trim().max(80).optional().or(z.literal("")),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  timeline: z.string().trim().max(120).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tell Arian what the campaign is about")
    .max(4000, "Please keep this under 4000 characters"),
  honeypot: honeypotField,
});
export type SponsorshipInput = z.infer<typeof sponsorshipSchema>;

// -------------------------------------------------------------------- auth
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: nameField,
    email: emailField,
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
    // Admin must never be selectable at sign-up; there is no role field at all.
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Please accept the terms and privacy notice" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const resetRequestSchema = z.object({ email: emailField });
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

export const magicLinkSchema = z.object({ email: emailField });

// ------------------------------------------------------------------ client
export const clientMessageSchema = z.object({
  subject: z.string().trim().min(3, "Add a subject").max(140, "Keep the subject short"),
  body: z
    .string()
    .trim()
    .min(10, "Please write a little more")
    .max(4000, "Please keep the message under 4000 characters"),
});
export type ClientMessageInput = z.infer<typeof clientMessageSchema>;

export const profileSchema = z.object({
  fullName: nameField,
  bio: z.string().trim().max(400, "Keep this under 400 characters").optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ------------------------------------------------------------------- admin
export const videoSchema = z.object({
  youtube_url: z
    .string()
    .trim()
    .min(1, "Paste the YouTube link")
    .refine((value) => extractYouTubeId(value) !== null, {
      message: "That does not look like a YouTube video link",
    }),
  title: z.string().trim().min(3, "Add a title").max(200, "That title is too long"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  game: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  duration_text: z
    .string()
    .trim()
    .max(12)
    .regex(/^$|^\d{1,2}:\d{2}(:\d{2})?$/, "Use mm:ss or hh:mm:ss")
    .optional()
    .or(z.literal("")),
  published_at: z.string().trim().min(1, "Pick a publish date"),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});
export type VideoFormInput = z.infer<typeof videoSchema>;

export const galleryMetaSchema = z.object({
  title: z.string().trim().min(1, "Give the image a title").max(160),
  caption: z.string().trim().max(600).optional().or(z.literal("")),
  alt_text: z
    .string()
    .trim()
    .min(8, "Describe the image for screen readers (at least 8 characters)")
    .max(300),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  is_published: z.boolean(),
});
export type GalleryMetaInput = z.infer<typeof galleryMetaSchema>;

export const audioMetaSchema = z.object({
  title: z.string().trim().min(1, "Add a track title").max(160),
  artist: z.string().trim().max(160).optional().or(z.literal("")),
});
export type AudioMetaInput = z.infer<typeof audioMetaSchema>;

export const broadcastSchema = z
  .object({
    title: z.string().trim().min(3, "Add a subject").max(160),
    body: z.string().trim().min(10, "Write the message").max(4000),
    audienceType: z.enum(["single_client", "all_clients", "public_announcement"]),
    recipientUserId: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.audienceType !== "single_client" || Boolean(data.recipientUserId), {
    message: "Choose the client this message is for",
    path: ["recipientUserId"],
  });
export type BroadcastInput = z.infer<typeof broadcastSchema>;

export const chatKnowledgeSchema = z.object({
  title: z.string().trim().min(3, "Add a short title").max(160),
  content: z.string().trim().min(10, "Add the answer Arian wants given").max(4000),
  is_active: z.boolean(),
});
export type ChatKnowledgeInput = z.infer<typeof chatKnowledgeSchema>;

export const chatbotQuestionSchema = z
  .string()
  .trim()
  .min(2, "Type your question")
  .max(500, "Please keep questions under 500 characters");

// -------------------------------------------------------------- file checks
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => IMAGE_TYPES.includes(file.type), "Use a JPG, PNG, WebP, AVIF or GIF image")
  .refine((file) => file.size <= 12 * 1024 * 1024, "Images must be under 12 MB");

export const audioFileSchema = z
  .instanceof(File)
  .refine(
    (file) => file.type === "audio/mpeg" || AUDIO_TYPES.includes(file.type) || /\.mp3$/i.test(file.name),
    "Use an MP3 file"
  )
  .refine((file) => file.size <= 25 * 1024 * 1024, "Audio files must be under 25 MB");
