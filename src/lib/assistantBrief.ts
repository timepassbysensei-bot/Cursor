/**
 * The offline answer set for Arian Assistant.
 *
 * This is the same material the serverless function is given as its system
 * brief, kept in the app so the assistant still helps when the Netlify
 * function is not reachable (`vite dev` without `netlify dev`, or before the
 * Gemini key is configured). It contains only what the channel brief states —
 * no invented achievements, numbers, sponsorships or personal details.
 */

export interface BriefTopic {
  id: string;
  keywords: string[];
  answer: string;
}

export const ASSISTANT_SUGGESTIONS = [
  "Which games does Arian cover?",
  "What kind of videos does Arian make?",
  "How do I sponsor Arian?",
  "Are the videos in Hindi?",
];

export const BRIEF_TOPICS: BriefTopic[] = [
  {
    id: "games",
    keywords: ["game", "genshin", "wuthering", "waves", "impact", "cover", "play"],
    answer:
      "Arian covers Genshin Impact and Wuthering Waves. Alongside those, some videos are about gaming lore and storytelling more broadly.",
  },
  {
    id: "content",
    keywords: ["video", "content", "make", "series", "lore", "build", "guide", "banner", "pull", "patch", "update", "reaction", "shorts"],
    answer:
      "Arian makes lore and story explanations, character guides and builds, banner and pull advice, beginner guides, patch breakdowns, and reactions — as both long-form videos and Shorts.",
  },
  {
    id: "language",
    keywords: ["hindi", "language", "english", "subtitles"],
    answer:
      "Arian creates Hindi-language gaming content, so the videos are primarily in Hindi.",
  },
  {
    id: "sponsor",
    keywords: ["sponsor", "sponsorship", "brand", "collab", "collaboration", "business", "advertise", "promo"],
    answer:
      "For sponsorship, use the form on the Sponsor page, or the Sponsor section of the client dashboard once you are signed in. Sponsorship enquiries go straight to Arian and get priority.",
  },
  {
    id: "contact",
    keywords: ["contact", "message", "email", "reach", "talk", "reply", "question"],
    answer:
      "You can message Arian from the Contact page without creating an account. If you sign in, your messages and Arian's replies live in your dashboard inbox.",
  },
  {
    id: "dashboard",
    keywords: ["account", "sign", "signup", "login", "dashboard", "client", "access", "approve", "pending"],
    answer:
      "An account on this site gives you the client dashboard: messages, a direct message form, a sponsorship form and profile settings. New accounts start with pending access until Arian approves them.",
  },
  {
    id: "gallery",
    keywords: ["gallery", "image", "photo", "picture", "art", "artwork", "wallpaper"],
    answer:
      "The gallery collects artwork, screenshots and behind-the-scenes images that Arian has the rights to publish, organised by category.",
  },
  {
    id: "watch",
    keywords: ["watch", "youtube", "channel", "subscribe", "link", "video"],
    answer:
      "Every video listed here opens on YouTube in a new tab. Arian's channel is youtube.com/@youknowArian.",
  },
  {
    id: "about",
    keywords: ["about", "who", "arian", "story", "you"],
    answer:
      "Arian is a gaming creator and storyteller who makes videos in Hindi about Genshin Impact and Wuthering Waves — focusing on the story and lore behind the games, plus builds, banner advice and beginner guides.",
  },
  {
    id: "assistant",
    keywords: ["assistant", "bot", "ai", "who made", "chatbot"],
    answer:
      "I'm Arian Assistant, a chatbot created by Arian for this website. I answer questions about Arian, the channel, the games covered here, the site and how to get in touch.",
  },
];

const OFF_TOPIC_REPLY =
  "I can only answer questions about Arian, the channel, the games covered here, this website and how to contact Arian. For anything else, I'm afraid I have to pass.";

const UNKNOWN_REPLY =
  "I don't have an answer to that in Arian's notes yet. Try the Contact page — or ask me something else about the channel, the games covered here, or sponsorship.";

export function answerFromBrief(question: string): string {
  const text = question.toLowerCase();
  if (!text.trim()) return UNKNOWN_REPLY;

  let best: { topic: BriefTopic; score: number } | null = null;
  for (const topic of BRIEF_TOPICS) {
    const score = topic.keywords.reduce((total, keyword) => (text.includes(keyword) ? total + 1 : total), 0);
    if (score > 0 && (!best || score > best.score)) best = { topic, score };
  }

  if (best) return best.topic.answer;
  return looksOffTopic(text) ? OFF_TOPIC_REPLY : UNKNOWN_REPLY;
}

/** Rough guard so obviously unrelated questions get the scope reply. */
function looksOffTopic(text: string): boolean {
  const offTopicMarkers = [
    "weather",
    "stock",
    "crypto",
    "politics",
    "election",
    "recipe",
    "homework",
    "essay",
    "python",
    "javascript",
    "medical",
    "doctor",
    "lawyer",
    "loans",
  ];
  return offTopicMarkers.some((marker) => text.includes(marker));
}

/** System prompt shared by the offline brief and the Gemini function. */
export const ASSISTANT_SYSTEM_PROMPT = `You are Arian Assistant, a website assistant created by Arian.

You may answer only questions about Arian, Arian's YouTube channel, Arian's content, the games Arian covers, this website, sponsorships, gallery access, and how to contact Arian.

If a user asks about unrelated topics, politely say that you can only answer questions about Arian and this website.

Do not invent Arian's personal information, achievements, partnerships, statistics, or private details.

When appropriate, explain that you were created by Arian for this website.

Use the website's approved content and admin-managed knowledge base as your primary source.`;
