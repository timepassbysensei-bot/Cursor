-- ===========================================================================
-- Arian — seed data
--
-- Only two kinds of things are seeded here:
--   1. editable site copy (every value is a placeholder Arian can rewrite in
--      Admin → Settings → Content);
--   2. knowledge-base entries for "Arian Assistant", strictly limited to what
--      the channel brief states.
--
-- No invented statistics, sponsorships, testimonials, photos or personal
-- details. Videos, gallery images and audio are uploaded by Arian, so they are
-- intentionally not seeded.
-- ===========================================================================

insert into public.site_content (content_key, content_value) values
  ('brand.name', 'Arian'),
  ('brand.tagline', 'Gaming, stories, lore, and the worlds behind the screen.'),
  ('brand.footer_note',
   'Arian explains the games he loves — the lore, the characters and the worlds behind the screen — in Hindi, for players who want the story, not just the stats.'),

  ('hero.eyebrow', 'Genshin Impact · Wuthering Waves'),
  ('hero.title', 'Arian'),
  ('hero.statement', 'Gaming, stories, lore, and the worlds behind the screen.'),
  ('hero.description',
   'Hindi-first gaming storytelling: lore broken down scene by scene, character builds that actually work, banner advice before you spend, and beginner guides that assume nothing.'),
  ('hero.primary_cta_label', 'Watch on YouTube'),
  ('hero.secondary_cta_label', 'Explore the world'),

  ('about.intro',
   'Arian makes gaming videos about the parts of a game that are easy to miss — the story behind a character, the reason a region looks the way it does, and what a patch actually changes for the way you play.'),
  ('about.identity',
   'A creator working in Hindi, telling the story of a game the way it deserves to be told: patiently, in order, and without spoiling the moment.'),
  ('about.games', '["Genshin Impact","Wuthering Waves"]'),
  ('about.categories',
   '["Lore explained","Story explanations","Character builds","Beginner guides","Patch & update breakdowns","Reactions & first impressions"]'),
  ('about.timeline',
   '[{"year":"The start","title":"A channel about the story, not the meta","body":"Arian began making videos for players who loved the world of the game but could not follow the story in English fast enough."},{"year":"Genshin Impact","title":"Lore, region by region","body":"Deep dives into Teyvat — the archon quests, the history that sits behind them and the details most players walk past."},{"year":"Wuthering Waves","title":"New world, same patience","body":"Guides and story breakdowns for a combat-first game, translating its systems and its lore into plain Hindi."},{"year":"Today","title":"Guides, banners and beginnings","body":"Character builds, banner advice before you pull, and beginner series that get new players comfortable in the first week."}]'),
  ('about.message',
   'Placeholder message — replace this in Admin → Settings. Write a short note to your audience here: what you want them to get from the channel, and where to reach you.'),

  ('featured_message.active', 'true'),
  ('featured_message.title', 'A note for everyone watching'),
  ('featured_message.body',
   'Placeholder announcement — edit this from the admin studio. Use it for a new series, a schedule change, or a thank-you to the people who show up every week.'),

  ('sponsor.headline', 'Work with Arian'),
  ('sponsor.intro',
   'Brands that fit a gaming-and-storytelling audience are welcome. Share the campaign you have in mind and Arian will reply personally — no agency runaround.'),
  ('sponsor.formats',
   '["Dedicated video","Integrated segment","Shorts campaign","Stream segment","Character / build feature"]'),
  ('sponsor.disclosure',
   'Paid collaborations are always disclosed on-screen and in the description, and Arian only features products he would use on the channel himself.'),

  ('contact.email', ''),
  ('contact.response_time', 'Replies usually within a few days. Sponsorship enquiries get priority.'),

  ('social.youtube', 'https://www.youtube.com/@youknowArian'),
  ('social.instagram', ''),
  ('social.x', ''),
  ('social.discord', ''),

  ('chatbot.intro',
   'I am Arian Assistant. Ask me about Arian, the channel, the games covered here, the site, or working with Arian.'),
  ('chatbot.suggestions',
   '["Which games does Arian cover?","What kind of videos does Arian make?","How do I sponsor Arian?","Are the videos in Hindi?"]'),
  ('chatbot.disclaimer',
   'Arian Assistant is AI and can be wrong. For anything official — sponsorships, permissions or a reply from Arian himself — use the contact page.'),

  ('seo.default_title', 'Arian — Gaming, stories, lore, and the worlds behind the screen'),
  ('seo.default_description',
   'Hindi gaming storytelling: Genshin Impact and Wuthering Waves lore explained, character builds, banner advice and beginner guides.'),
  ('seo.og_image_url', '')
on conflict (content_key) do nothing;

insert into public.chat_knowledge (title, content) values
  ('Who Arian is',
   'Arian is a gaming creator and storyteller who makes videos in Hindi about Genshin Impact and Wuthering Waves. He focuses on explaining the story and lore of those games, along with character builds, banner advice and beginner guides. No personal details about Arian beyond his public creator work should ever be shared.'),
  ('Games covered',
   'Arian covers Genshin Impact and Wuthering Waves. Some videos also discuss gaming lore and storytelling generally, and gaming Shorts alongside long-form videos.'),
  ('Types of content',
   'Content categories: gaming lore explained, story explanations, character guides and builds, banner and pull advice, beginner guides, patch and update breakdowns, and gaming reactions. Formats include long-form videos and Shorts.'),
  ('Language',
   'Arian creates Hindi-language gaming content. The videos themselves are primarily in Hindi.'),
  ('How to watch',
   'Every video listed on this website links directly to YouTube and opens in a new tab. The full channel is at https://www.youtube.com/@youknowArian.'),
  ('Sponsorships',
   'Brands and companies can work with Arian through the sponsorship form on the /sponsor page, or from the Sponsor section of the client dashboard once signed in. Sponsorship enquiries go straight to Arian and are treated as priority.'),
  ('Contacting Arian',
   'Anyone can send a message using the contact form on the /contact page without creating an account. Signed-in clients can send messages from their dashboard inbox and read replies from Arian there.'),
  ('Client dashboard',
   'Creating an account on this website gives access to the client dashboard: messages from Arian, a direct message form, a sponsorship interest form and profile settings. New accounts start with pending access until Arian approves them.'),
  ('Gallery',
   'The gallery collects artwork, screenshots and behind-the-scenes images supplied by Arian, organised by category. Only images Arian has the rights to publish appear there.'),
  ('This assistant',
   'Arian Assistant is a chatbot created by Arian for this website. It only answers questions about Arian, the channel, the games covered, this website, sponsorships and how to get in touch. It does not answer unrelated general-knowledge questions, and it never invents personal information about Arian.')
on conflict do nothing;
