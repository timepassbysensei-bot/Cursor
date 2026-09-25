import { describe, expect, it } from "vitest";
import {
  canonicalYouTubeUrl,
  extractYouTubeId,
  isYouTubeUrl,
  youtubeEmbedUrl,
  youtubeShortsUrl,
  youtubeThumbnail,
  youtubeWatchUrl,
} from "./youtube";

const ID = "dQw4w9WgXcQ";

describe("extractYouTubeId", () => {
  it("reads every common YouTube URL shape", () => {
    const urls = [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&t=42s`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}`,
      `https://youtu.be/${ID}?si=abc123`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/live/${ID}`,
      `youtube.com/watch?v=${ID}`,
      ID,
    ];
    for (const url of urls) {
      expect(extractYouTubeId(url), url).toBe(ID);
    }
  });

  it("rejects anything that is not a YouTube video link", () => {
    expect(extractYouTubeId("")).toBeNull();
    expect(extractYouTubeId(null)).toBeNull();
    expect(extractYouTubeId(undefined)).toBeNull();
    expect(extractYouTubeId("https://vimeo.com/123456789")).toBeNull();
    expect(extractYouTubeId("https://www.youtube.com/@youknowArian")).toBeNull();
    expect(extractYouTubeId("https://www.youtube.com/watch?v=tooshort")).toBeNull();
    expect(extractYouTubeId("not a link at all")).toBeNull();
  });

  it("does not treat a lookalike host as YouTube", () => {
    expect(extractYouTubeId(`https://notyoutube.com/watch?v=${ID}`)).toBeNull();
    expect(extractYouTubeId(`https://youtube.com.evil.example/watch?v=${ID}`)).toBeNull();
    expect(extractYouTubeId(`https://fakeyoutu.be/${ID}`)).toBeNull();
  });

  it("accepts YouTube subdomains", () => {
    expect(extractYouTubeId(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(extractYouTubeId(`https://music.youtube.com/watch?v=${ID}`)).toBe(ID);
  });
});

describe("derived URLs", () => {
  it("builds the documented thumbnail, watch, embed and shorts URLs", () => {
    expect(youtubeThumbnail(ID)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
    expect(youtubeThumbnail(ID, "maxresdefault")).toBe(`https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`);
    expect(youtubeWatchUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(youtubeEmbedUrl(ID)).toContain(`youtube-nocookie.com/embed/${ID}`);
    expect(youtubeShortsUrl(ID)).toBe(`https://www.youtube.com/shorts/${ID}`);
  });

  it("canonicalises a messy pasted link", () => {
    expect(canonicalYouTubeUrl(`https://youtu.be/${ID}?si=xyz&t=10`)).toBe(
      `https://www.youtube.com/watch?v=${ID}`
    );
    expect(canonicalYouTubeUrl("https://example.com")).toBeNull();
  });

  it("reports whether a value is a usable YouTube link", () => {
    expect(isYouTubeUrl(`https://youtu.be/${ID}`)).toBe(true);
    expect(isYouTubeUrl("nope")).toBe(false);
  });
});
