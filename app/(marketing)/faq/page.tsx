import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about PawDrop.",
};

const FAQS = [
  {
    q: "What is PawDrop?",
    a: "PawDrop is a marketplace where creators upload real dog photos and collectors spend points to unlock mystery reveals. You never know exactly which photo you'll get until you unlock it — that's the fun part.",
  },
  {
    q: "Do I need to pay real money?",
    a: "No. PawDrop runs entirely on an internal points system. You earn points through daily logins, streaks, missions, achievements, referrals, and contests — there are no real-money payments anywhere on the platform.",
  },
  {
    q: "How do I earn points?",
    a: "Log in daily to keep your streak alive, complete weekly and monthly missions, unlock achievements, refer friends (you both get a bonus when they make their first unlock), win photo contests, and climb the seasonal leaderboard.",
  },
  {
    q: "How does unlocking a photo work?",
    a: "Browse the marketplace, pick a photo card that intrigues you, and spend the listed points to unlock it. The full-quality photo is revealed and added to your collection permanently. Bundles let you unlock several photos together at a discount.",
  },
  {
    q: "How do I become a creator (seller)?",
    a: "Register a creator account, upload your dog photos, and set a price in points. Every upload is scored by our AI for cuteness and quality, then reviewed by a moderator before it goes live. You earn points every time someone unlocks your photo.",
  },
  {
    q: "What does the AI score mean?",
    a: "Each approved photo gets a 0–100 score across cuteness, quality, and rarity. Higher-scoring photos get better placement and can earn more. The AI also checks that uploads are real dog photos and flags anything suspicious for human review.",
  },
  {
    q: "Can I sell my points or cash out?",
    a: "No. Points have no real-world monetary value and can't be exchanged, sold, or withdrawn. Creators can spend their earnings in the rewards catalog — profile badges, featured boosts, and commission discounts.",
  },
  {
    q: "What are contests?",
    a: "Weekly and monthly photo contests where creators enter one of their approved photos and the community votes. Top three entries win point prizes. One entry per creator, one vote per user, real dog photos only.",
  },
  {
    q: "Something looks wrong — how do I report it?",
    a: "Every photo and profile has a report option. Our moderation team reviews reports and takes action on anything that breaks the rules — fake photos, duplicates, or inappropriate content.",
  },
];

export default function FaqPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Frequently asked questions
      </h1>
      <p className="mt-3 text-muted-foreground">
        Everything you need to know about collecting and creating on PawDrop.
      </p>

      <Accordion type="single" collapsible className="mt-10">
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.q} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
