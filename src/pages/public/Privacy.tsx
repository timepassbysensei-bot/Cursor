import { LegalDoc } from "../../components/LegalDoc";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";

export default function Privacy() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  useSeo({
    title: `Privacy policy — ${content.brandName}`,
    description:
      "What this website collects, why it collects it, where it is stored, and how to have it removed.",
  });

  return (
    <LegalDoc
      title="Privacy policy"
      intro="This page explains, plainly, what this website collects and what it does with it. It describes how the site is actually built rather than boilerplate — and if anything here stops being true, it should be updated."
      links={[
        { to: "/terms", label: "Terms of use" },
        { to: "/contact", label: "Ask a question" },
      ]}
      sections={[
        {
          heading: "What is collected",
          paragraphs: [
            "Browsing the public website requires no account and collects nothing you type. The site only stores information in the specific cases below.",
          ],
          bullets: [
            "Contact form: your name, email address and message.",
            "Sponsorship form: your name, email, company, website, campaign details, budget range, timeline and message.",
            "Client accounts: your name, email address, an optional profile picture and the messages you send from the dashboard.",
            "Basic technical logs: the hosting and database providers record request information such as IP address and timestamps for security and abuse prevention.",
          ],
        },
        {
          heading: "Why it is collected",
          paragraphs: [
            "Contact and sponsorship details are stored so Arian can read your message and reply to you. Account details are stored so you can sign in and keep your messages and sponsorship enquiries in one place. Requests are rate limited so the forms cannot be used to flood the inbox.",
          ],
        },
        {
          heading: "Where it is stored",
          paragraphs: [
            "Messages, accounts, videos, gallery images and music are stored in a Supabase (PostgreSQL) database and file storage, and the website is served by Netlify. Both act as data processors on Arian's behalf. Music and gallery files are served from the site's own storage, not from third-party trackers.",
          ],
        },
        {
          heading: "Cookies and tracking",
          paragraphs: [
            "This site does not run advertising trackers or third-party analytics, and sets no marketing cookies. It stores a small amount of data in your browser's local storage for things you would expect: keeping you signed in, remembering whether you muted the background music, whether you dismissed the music player or announcement banner, and a short-term form submission limit.",
            "YouTube videos are not embedded by default. Video links open on YouTube in a new tab, so YouTube's own cookies apply only once you choose to go there.",
          ],
        },
        {
          heading: "AI assistant",
          paragraphs: [
            "Questions you type into Arian Assistant are sent to a serverless function and forwarded to Google's Gemini API to generate an answer, along with Arian's approved notes about the channel. Conversation history is kept in your browser tab only and is gone when you close it. Do not type personal or sensitive information into the assistant.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: [
            "You can ask for your message or account data to be deleted at any time by using the contact page. If you have an account, you can also change your name and profile details from the dashboard, and sign out to end your session.",
          ],
        },
        {
          heading: "Children",
          paragraphs: [
            "This site is not directed at children under 13, and accounts are not intended for them. If a message is received from a child, it will be deleted on request.",
          ],
        },
        {
          heading: "Changes and contact",
          paragraphs: [
            "If this policy changes, the updated version will appear on this page. For any privacy question, use the contact form — that is the fastest route to a real answer from Arian.",
          ],
        },
      ]}
    />
  );
}
