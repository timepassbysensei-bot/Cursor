import { LegalDoc } from "../../components/LegalDoc";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";

export default function Terms() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  useSeo({
    title: `Terms of use — ${content.brandName}`,
    description: "The rules for using this website, its forms, client accounts and Arian Assistant.",
  });

  return (
    <LegalDoc
      title="Terms of use"
      intro="By using this website you agree to the points below. They are written to be readable rather than intimidating, and they describe how the site genuinely behaves."
      links={[
        { to: "/privacy", label: "Privacy policy" },
        { to: "/contact", label: "Ask a question" },
      ]}
      sections={[
        {
          heading: "Using this site",
          paragraphs: [
            "You may browse the public pages freely. Do not attempt to break, overload, scrape at scale or gain unauthorised access to the site, its database or its storage. Automated requests that degrade the service for other visitors are not permitted.",
          ],
        },
        {
          heading: "Accounts and access",
          paragraphs: [
            "Creating an account creates a client account with pending access until Arian approves it. Accounts are personal and should not be shared. Arian may approve, suspend, ban or remove any account, for example if it is used to send spam, abuse, or content that is unlawful.",
            "Admin access is granted only by Arian and is never selectable during sign-up.",
          ],
        },
        {
          heading: "Messages and submissions",
          paragraphs: [
            "Messages you send through the contact form, the sponsorship form or the client dashboard are stored in Arian's inbox. Do not send content that is unlawful, threatening, or that you do not have the right to share. Submissions are validated and rate limited.",
          ],
        },
        {
          heading: "Sponsorship and commercial terms",
          paragraphs: [
            "A sponsorship enquiry is not a booking. Any collaboration, deliverable, fee, timeline and disclosure arrangement is agreed separately in writing between Arian and the brand. Sponsorship enquiries should include your company, campaign objective, preferred platform, budget range and timeline.",
            "Paid collaborations are disclosed on screen and in the video description.",
          ],
        },
        {
          heading: "Arian Assistant",
          paragraphs: [
            "Arian Assistant is an automated helper built by Arian for this website. It can be wrong or incomplete, and it is not an official statement from Arian. Do not rely on it for commercial decisions, and do not type personal or sensitive information into it. For anything official, use the contact page.",
          ],
        },
        {
          heading: "Content and intellectual property",
          paragraphs: [
            "The words, layout and original artwork of this website belong to Arian. Game names, characters and assets referenced on this site belong to their respective owners.",
            "This website is an independent fan and creator project. It is not affiliated with, sponsored by, or endorsed by HoYoverse, Kuro Games or any other game publisher. No official logos or copyrighted game artwork are reproduced here without permission; gallery and audio content is uploaded only where Arian holds the rights to publish it.",
          ],
        },
        {
          heading: "Availability",
          paragraphs: [
            "The site is provided as is. Features may change or be unavailable at times, including while content is being updated. Arian is not liable for losses arising from use of the site or reliance on the assistant's answers.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "These terms may be updated as the site evolves. Continuing to use the site after an update means you accept the current version. For any question about these terms, use the contact form.",
          ],
        },
      ]}
    />
  );
}
