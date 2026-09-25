import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

/**
 * Boots the real application — providers, router, lazy routes and guards —
 * with no Supabase credentials, which is the demo-mode state. This is the test
 * that would have caught a broken provider tree or a route that throws on
 * first render.
 */
function renderApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("application shell", () => {
  it("renders the public layout, the nav and the footer on the homepage", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Arian" })).toBeInTheDocument();

    // Shell chrome, in order: banner region, skip link, primary nav, footer.
    const primaryNav = screen.getByRole("navigation", { name: /Primary/i });
    for (const label of ["Home", "About", "Videos", "Gallery", "Sponsor", "Assistant", "Contact"]) {
      expect(within(primaryNav, label)).toBe(true);
    }

    expect(screen.getByRole("link", { name: /Skip to main content/i })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("link", { name: /Arian — home/i })).toHaveAttribute("href", "/");
    // Demo mode is dev-only now: the banner says "Local demo mode." and never
    // appears in a production deployment without configuration.
    expect(screen.getByText(/Local demo mode\./)).toBeInTheDocument();
  });

  it("keeps the assistant and music controls out of the way until asked for", async () => {
    renderApp("/");
    await screen.findByRole("heading", { level: 1, name: "Arian" });

    // The assistant launcher exists, but is collapsed — no conversation yet.
    expect(screen.getByRole("button", { name: /Open Arian Assistant/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /Arian Assistant/i })).not.toBeInTheDocument();

    // No audio track is configured, so no music player is rendered at all.
    expect(screen.queryByRole("region", { name: /Background music player/i })).not.toBeInTheDocument();
  });

  it("renders the login page and explains that auth needs Supabase", async () => {
    renderApp("/login");
    expect(await screen.findByRole("heading", { level: 1, name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/Authentication is not connected yet/i)).toBeInTheDocument();
  });

  it("guards the client dashboard and the admin studio", async () => {
    renderApp("/dashboard");
    expect(await screen.findByText(/Accounts are not connected yet/i)).toBeInTheDocument();
  });

  it("guards the admin studio with its own message", async () => {
    renderApp("/admin");
    expect(await screen.findByText(/The studio is not connected yet/i)).toBeInTheDocument();
  });

  it("renders the 404 page for an unknown route", async () => {
    renderApp("/something-that-does-not-exist");
    expect(
      await screen.findByRole("heading", { level: 1, name: /This page is not part of the story/i })
    ).toBeInTheDocument();
  });
});

/** Small helper: does the nav contain a link with this exact accessible name? */
function within(nav: HTMLElement, label: string): boolean {
  return Array.from(nav.querySelectorAll("a")).some((link) => link.textContent?.trim() === label);
}
