import { describe, it, expect } from "vitest";
import { inquirySchema, loginSchema, indianPhone, marksEntrySchema, newPasswordSchema } from "../../src/validation/schemas";
import { slugify, percent, safeExternal, initialsOf, formatDate } from "../../src/lib/utils";

describe("indianPhone", () => {
  it("accepts valid 10-digit mobiles", () => {
    expect(indianPhone.safeParse("9876543210").success).toBe(true);
  });
  it("rejects invalid numbers", () => {
    expect(indianPhone.safeParse("12345").success).toBe(false);
    expect(indianPhone.safeParse("09876543210").success).toBe(false);
    expect(indianPhone.safeParse("abcdefghij").success).toBe(false);
  });
});

describe("inquirySchema", () => {
  const valid = {
    name: "Test User",
    email: "",
    phone: "9876543210",
    whatsapp: "",
    city: "",
    interested_course_id: "",
    message: "",
    consent: true,
  };
  it("accepts a valid inquiry", () => {
    expect(inquirySchema.safeParse(valid).success).toBe(true);
  });
  it("requires consent", () => {
    expect(inquirySchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("rejects bad phone", () => {
    expect(inquirySchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires email + min 8 char password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "1234567" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "12345678" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("requires letter + number + match", () => {
    expect(newPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd1234" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "abcdefgh", confirm: "abcdefgh" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd1235" }).success).toBe(false);
  });
});

describe("marksEntrySchema", () => {
  it("accepts 0..1000 integers", () => {
    expect(marksEntrySchema.safeParse({ marks_obtained: 0, is_absent: false }).success).toBe(true);
    expect(marksEntrySchema.safeParse({ marks_obtained: 1001, is_absent: false }).success).toBe(false);
    expect(marksEntrySchema.safeParse({ marks_obtained: -1, is_absent: false }).success).toBe(false);
  });
});

describe("utils", () => {
  it("slugify produces clean slugs", () => {
    expect(slugify("NDA Foundation 2026!")).toBe("nda-foundation-2026");
    expect(slugify("  --Weird___slug--  ")).toBe("weird-slug");
  });
  it("percent guards division by zero", () => {
    expect(percent(50, 0)).toBeNull();
    expect(percent(null, 100)).toBeNull();
    expect(percent(1, 3)).toBe(33.3);
  });
  it("safeExternal blocks non-http urls", () => {
    expect(safeExternal("javascript:alert(1)")).toBeNull();
    expect(safeExternal("https://ok.example")).toBe("https://ok.example");
    expect(safeExternal(null)).toBeNull();
  });
  it("initialsOf takes first two words", () => {
    expect(initialsOf("Amit Kumar Singh")).toBe("AK");
  });
  it("formatDate handles invalid input", () => {
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate(null)).toBe("—");
  });
});
