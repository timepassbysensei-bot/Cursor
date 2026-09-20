import { z } from "zod";

export const indianPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const optionalPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
  .optional()
  .or(z.literal(""));

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(200).optional().or(z.literal("")),
  phone: indianPhone,
  whatsapp: optionalPhone,
  city: z.string().trim().max(80).optional().or(z.literal("")),
  interested_course_id: z.string().uuid().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please accept to be contacted about admissions." }),
  }),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: indianPhone,
  message: z.string().trim().min(5, "Tell us briefly what you need").max(1000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please accept so we can reply to you." }),
  }),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const chatbotQuestionSchema = z
  .string()
  .trim()
  .min(2, "Type your question")
  .max(500, "Please keep questions under 500 characters");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

export const courseFormSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  short_description: z.string().trim().max(300).optional().or(z.literal("")),
  full_description: z.string().trim().max(5000).optional().or(z.literal("")),
  thumbnail_url: z.string().trim().optional().or(z.literal("")),
  eligibility: z.string().trim().max(300).optional().or(z.literal("")),
  age_criteria: z.string().trim().max(200).optional().or(z.literal("")),
  duration_text: z.string().trim().max(120).optional().or(z.literal("")),
  batch_timings: z.string().trim().max(200).optional().or(z.literal("")),
  fees_text: z.string().trim().max(120).optional().or(z.literal("")),
  mode: z.string().trim().max(60).optional().or(z.literal("")),
  seats_text: z.string().trim().max(120).optional().or(z.literal("")),
  subjects_text: z.string().trim().max(500).optional().or(z.literal("")),
  prospectus_url: z.string().trim().optional().or(z.literal("")),
  admission_status: z.enum(["open", "filling_fast", "closed"]),
  featured: z.boolean(),
  display_order: z.coerce.number().int().min(0).max(9999),
  status: z.enum(["draft", "published", "archived"]),
});
export type CourseFormInput = z.infer<typeof courseFormSchema>;

export const marksEntrySchema = z.object({
  marks_obtained: z
    .number({ invalid_type_error: "Enter marks" })
    .int("Marks must be whole numbers")
    .min(0, "Marks cannot be negative")
    .max(1000, "Marks look too large"),
  is_absent: z.boolean(),
});
export type MarksEntryInput = z.infer<typeof marksEntrySchema>;
