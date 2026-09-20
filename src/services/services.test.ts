import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const state = {
    configured: false,
    calls: [] as { method: string; args: unknown[] }[],
    queue: [] as { data: unknown; error: unknown }[],
  };

  function builder(table: string): unknown {
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (value: unknown) => void) => {
            resolve(state.queue.shift() ?? { data: null, error: null });
          };
        }
        return (...args: unknown[]) => {
          state.calls.push({ method: `${table}.${String(prop)}`, args });
          return proxy;
        };
      },
    };
    const proxy: unknown = new Proxy({}, handler);
    return proxy;
  }

  return { state, builder };
});

vi.mock("../lib/supabaseClient", () => ({
  get isSupabaseConfigured() {
    return h.state.configured;
  },
  get supabase() {
    return {
      from: (table: string) => h.builder(table),
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "https://example.test/x.png" } }),
        }),
      },
      functions: { invoke: async () => ({ data: null, error: null }) },
    };
  },
}));

import {
  fetchSiteSettings,
  fetchPublishedCourses,
  fetchPublicNotices,
  fetchPublishedFaqs,
  submitInquiry,
  NOT_CONNECTED_MESSAGE,
} from "./publicContent";
import { adminService } from "./admin";

beforeEach(() => {
  h.state.configured = false;
  h.state.calls = [];
  h.state.queue = [];
});

describe("before Supabase credentials are configured", () => {
  it("returns default site settings without querying the database", async () => {
    const settings = await fetchSiteSettings();
    expect(settings.academy_name).toBe("Bokaro Defence Academy");
    expect(settings.admission_status).toBe("open");
    expect(h.state.calls).toHaveLength(0);
  });

  it("returns empty lists instead of throwing network errors", async () => {
    await expect(fetchPublishedCourses()).resolves.toEqual([]);
    await expect(fetchPublicNotices()).resolves.toEqual([]);
    expect(h.state.calls).toHaveLength(0);
  });

  it("rejects inquiries with a clear setup message", async () => {
    await expect(
      submitInquiry({
        name: "Test",
        email: null,
        phone: "9876543210",
        whatsapp: null,
        city: null,
        interested_course_id: null,
        message: null,
        source_page: "/admissions",
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
      })
    ).rejects.toThrow(NOT_CONNECTED_MESSAGE);
  });

  it("returns the published-FAQ fallback list", async () => {
    await expect(fetchPublishedFaqs()).resolves.toEqual([]);
    expect(h.state.calls).toHaveLength(0);
  });
});

describe("updateSiteSettings", () => {
  beforeEach(() => {
    h.state.configured = true;
  });

  it("locates the settings row by id, never by academy_name", async () => {
    h.state.queue = [
      { data: { id: "row-1" }, error: null },
      { data: { academy_name: "Renamed Academy" }, error: null },
    ];

    await adminService.updateSiteSettings({ academy_name: "Renamed Academy" });

    const methods = h.state.calls.map((c) => c.method);
    expect(methods).toContain("site_settings.update");
    expect(methods).toContain("site_settings.eq");

    const eqCall = h.state.calls.find((c) => c.method === "site_settings.eq");
    expect(eqCall?.args[0]).toBe("id");
    expect(eqCall?.args[1]).toBe("row-1");

    // Regression guard: matching on academy_name would update 0 rows (and
    // break every future save) as soon as staff rename the academy.
    const matchedByName = h.state.calls.some((c) => c.args[0] === "academy_name");
    expect(matchedByName).toBe(false);
  });

  it("inserts a settings row when none exists yet", async () => {
    h.state.queue = [
      { data: null, error: null },
      { data: { academy_name: "New Academy" }, error: null },
    ];

    await adminService.updateSiteSettings({ academy_name: "New Academy" });

    const methods = h.state.calls.map((c) => c.method);
    expect(methods).toContain("site_settings.insert");
    expect(methods).not.toContain("site_settings.update");
  });
});
