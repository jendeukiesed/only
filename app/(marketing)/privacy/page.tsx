import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PawDrop handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <section>
          <h2>1. What we collect</h2>
          <p className="mt-2">
            Account data (email, username, hashed password), profile details you choose to add,
            photos you upload, and activity inside the platform (unlocks, likes, comments, votes,
            streaks). If you sign in with Google, we receive your name, email, and avatar from
            Google.
          </p>
        </section>

        <section>
          <h2>2. How we use it</h2>
          <p className="mt-2">
            To run the marketplace: showing your profile and uploads, computing scores and
            leaderboards, awarding points, sending the notifications you enable, and keeping the
            platform safe through moderation and rate limiting. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2>3. Emails & notifications</h2>
          <p className="mt-2">
            We send transactional emails (verification, password reset) and, only if you enable
            them, web push notifications for things like wishlist matches and contest results. You
            can turn push off at any time from your device or account settings.
          </p>
        </section>

        <section>
          <h2>4. Cookies & sessions</h2>
          <p className="mt-2">
            We use essential cookies to keep you signed in securely. We do not use third-party
            advertising cookies.
          </p>
        </section>

        <section>
          <h2>5. Third-party services</h2>
          <p className="mt-2">
            Photos are stored and served via our image hosting provider; uploads may be analyzed by
            an AI scoring service to verify they are real dog photos. Authentication with Google is
            handled by Google. Each provider only receives what it needs to perform its function.
          </p>
        </section>

        <section>
          <h2>6. Your rights</h2>
          <p className="mt-2">
            You can view and edit your profile data in settings, export your collection, and delete
            your account — which removes your personal data and unpublishes your uploads. For any
            data request, contact support.
          </p>
        </section>

        <section>
          <h2>7. Security</h2>
          <p className="mt-2">
            Passwords are stored hashed, two-factor authentication is available on every account,
            and access to production data is restricted. No system is perfectly secure — if we
            learn of a breach affecting you, we will notify you.
          </p>
        </section>
      </div>
    </div>
  );
}
