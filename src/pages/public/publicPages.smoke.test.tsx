import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import Home from "./Home";
import Videos from "./Videos";
import Gallery from "./Gallery";
import About from "./About";
import Contact from "./Contact";
import Sponsor from "./Sponsor";
import Privacy from "./Privacy";
import Terms from "./Terms";
import NotFound from "./NotFound";

/**
 * These render the public pages without any environment variables configured,
 * which is exactly demo mode: site copy comes from the built-in defaults and
 * videos/gallery come from the sample set. They are a smoke test for "the page
 * renders and its primary content is on the page", not a visual test.
 */

function renderPage(ui: ReactNode, route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("public pages", () => {
  it("renders the homepage hero, the brand statement and the channel link", async () => {
    renderPage(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Arian" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Gaming, stories, lore, and the worlds behind the screen.")
    ).toBeInTheDocument();

    const channelLinks = screen.getAllByRole("link", { name: /watch on youtube/i });
    expect(channelLinks.length).toBeGreaterThan(0);
    expect(channelLinks[0]).toHaveAttribute("href", "https://www.youtube.com/@youknowArian");
    expect(channelLinks[0]).toHaveAttribute("target", "_blank");
  });

  it("shows sample videos and a link to the full library in demo mode", async () => {
    renderPage(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/Latest from the channel/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /view all videos/i })).toHaveAttribute("href", "/videos");
  });

  it("offers working filter controls on the video library", async () => {
    renderPage(<Videos />, "/videos");

    expect(screen.getByRole("heading", { level: 1, name: /Every video, searchable/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Search videos/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Filter by game/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Filter by category/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Sort videos/i })).toBeInTheDocument();
  });

  it("renders the gallery with accessible image alternatives", async () => {
    renderPage(<Gallery />, "/gallery");
    const images = await screen.findAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
    // Every gallery image carries real alt text, never an empty string.
    for (const image of images) {
      expect(image.getAttribute("alt")?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("renders the about page with the games covered", () => {
    renderPage(<About />, "/about");
    expect(screen.getByRole("heading", { level: 1, name: /Gaming stories, told the slow way/i })).toBeInTheDocument();
    expect(screen.getAllByText("Genshin Impact").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wuthering Waves").length).toBeGreaterThan(0);
  });

  it("renders labelled, validated forms on contact and sponsor", () => {
    const contact = renderPage(<Contact />, "/contact");
    expect(screen.getByLabelText(/Your name/i)).toBeRequired();
    expect(screen.getByLabelText(/Your email/i)).toBeRequired();
    expect(screen.getByLabelText(/^Message/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /Send message/i })).toBeInTheDocument();
    contact.unmount();

    renderPage(<Sponsor />, "/sponsor");
    expect(screen.getByLabelText(/Your name/i)).toBeRequired();
    expect(screen.getByLabelText(/Campaign details/i)).toBeRequired();
    expect(screen.getByRole("button", { name: /Send sponsorship enquiry/i })).toBeInTheDocument();
  });

  it("renders both legal pages with their sections", () => {
    const privacy = renderPage(<Privacy />, "/privacy");
    expect(screen.getByRole("heading", { level: 1, name: /Privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Cookies and tracking/i })).toBeInTheDocument();
    privacy.unmount();

    renderPage(<Terms />, "/terms");
    expect(screen.getByRole("heading", { level: 1, name: /Terms of use/i })).toBeInTheDocument();
    expect(screen.getByText(/not affiliated with, sponsored by, or endorsed/i)).toBeInTheDocument();
  });

  it("renders a helpful 404 with real destinations", () => {
    renderPage(<NotFound />, "/nope");
    expect(screen.getByRole("heading", { level: 1, name: /This page is not part of the story/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to the homepage/i })).toHaveAttribute("href", "/");
  });
});
