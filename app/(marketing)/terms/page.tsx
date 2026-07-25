import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules of using PawDrop.",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <section>
          <h2>1. About PawDrop</h2>
          <p className="mt-2">
            PawDrop is an entertainment platform where creators upload dog photos and collectors
            unlock them using an internal points system. By creating an account you agree to these
            terms.
          </p>
        </section>

        <section>
          <h2>2. Points are not money</h2>
          <p className="mt-2">
            Points have no real-world monetary value. They cannot be purchased with, or exchanged
            for, real currency, and they cannot be sold, transferred outside the platform, or
            withdrawn. Points may be adjusted or reset in cases of abuse or error.
          </p>
        </section>

        <section>
          <h2>3. Your content</h2>
          <p className="mt-2">
            Creators may only upload photos they own the rights to, and photos must depict real
            dogs. You keep ownership of your photos; by uploading, you grant PawDrop a license to
            display, resize, and distribute them within the platform. Uploading stolen,
            AI-generated-as-real, duplicate, or inappropriate content may result in content removal
            and account suspension.
          </p>
        </section>

        <section>
          <h2>4. Fair play</h2>
          <p className="mt-2">
            Multiple accounts, referral farming, vote manipulation in contests, automated scraping,
            and any attempt to exploit the points economy are prohibited. We may suspend or ban
            accounts involved in abuse.
          </p>
        </section>

        <section>
          <h2>5. Moderation</h2>
          <p className="mt-2">
            All uploads pass automated checks (AI scoring, duplicate detection) and human review.
            Moderation decisions are made in good faith and may be appealed by contacting support.
          </p>
        </section>

        <section>
          <h2>6. Availability & changes</h2>
          <p className="mt-2">
            PawDrop is provided "as is" without warranties. We may modify features, the points
            economy, or these terms at any time; continued use after changes means you accept the
            updated terms.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p className="mt-2">
            You can delete your account at any time from settings. We may suspend accounts that
            violate these terms. Upon termination, remaining points are forfeited.
          </p>
        </section>
      </div>
    </div>
  );
}
