import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const h = vi.hoisted(() => ({ configured: false }));

vi.mock("../../lib/supabaseClient", () => ({
  get isSupabaseConfigured() {
    return h.configured;
  },
  supabase: {
    from: () => {
      const proxy: unknown = new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (prop === "then") {
              return (resolve: (value: unknown) => void) => resolve({ data: null, error: null });
            }
            return () => proxy;
          },
        }
      );
      return proxy;
    },
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
    functions: { invoke: async () => ({ data: null, error: null }) },
  },
}));

import Home from "./Home";
import Contact from "./Contact";
import Results from "./Results";
import Courses from "./Courses";
import Gallery from "./Gallery";
import Notices from "./Notices";
import Admissions from "./Admissions";
import NotFound from "./NotFound";
import { DatabaseSetupBanner } from "../../components/DatabaseSetupBanner";
import { AuthProvider } from "../../hooks/useAuth";

/**
 * Renders inside the providers the app uses. AuthProvider loads the session
 * asynchronously, so the initial render is wrapped in act() to keep state
 * updates inside React's test scheduling.
 */
async function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  });
  return utils;
}

beforeEach(() => {
  h.configured = false;
});

afterEach(() => {
  cleanup();
});

describe("public pages render without crashing", () => {
  it("renders the homepage with its hero and course section", async () => {
    await wrap(<Home />);
    expect(
      screen.getAllByRole("heading", { level: 1 }).some((el) => /defence/i.test(el.textContent ?? ""))
    ).toBe(true);
    expect(screen.getByText(/courses we prepare for/i)).toBeInTheDocument();
  });

  it("renders the admissions page with a working inquiry form", async () => {
    await wrap(<Admissions />);
    expect(screen.getByRole("heading", { name: /admission inquiry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit inquiry/i })).toBeInTheDocument();
  });

  it("renders courses, gallery, notices and results empty states", async () => {
    await wrap(
      <>
        <Courses />
        <Gallery />
        <Notices />
        <Results />
      </>
    );
    expect(screen.getByRole("heading", { name: /our courses/i })).toBeInTheDocument();
    // Query results settle asynchronously, so the empty states appear after a tick.
    expect(await screen.findByText(/gallery coming soon/i)).toBeInTheDocument();
    expect(await screen.findByText(/no active notices right now/i)).toBeInTheDocument();
    expect(await screen.findByText(/results will appear here after publication/i)).toBeInTheDocument();
  });

  it("renders the contact page with the full FAQ section", async () => {
    await wrap(<Contact />);
    expect(screen.getByRole("heading", { name: /send a message/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /frequently asked questions/i })).toBeInTheDocument();
  });

  it("renders the 404 page with recovery links", async () => {
    await wrap(<NotFound />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
  });
});

describe("database setup banner", () => {
  it("is visible while credentials are missing", async () => {
    h.configured = false;
    await act(async () => {
      render(<DatabaseSetupBanner />);
    });
    expect(screen.getByText(/setup needed/i)).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
  });

  it("disappears once the site is connected", async () => {
    h.configured = true;
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<DatabaseSetupBanner />));
    });
    expect(container).toBeEmptyDOMElement();
  });
});
