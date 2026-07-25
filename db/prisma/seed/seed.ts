/**
 * Seed script — populates a fresh database with enough realistic data to
 * develop against every screen described in the spec: categories, tags,
 * achievements/badges/missions, an admin account, a handful of sellers with
 * approved/pending/rejected photos (with AI scores), buyers with purchase
 * history, and the social graph (follows/likes/comments) needed to render
 * non-empty dashboards.
 *
 * Run with: npm run db:seed
 */

import {
  PrismaClient,
  Role,
  UploadStatus,
  ScoreTier,
  EnergyLevel,
  AgeCategory,
  TransactionType,
  MissionPeriod,
  RewardCategory,
  ContestStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@pawdrop.app";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";
const STARTING_BUYER_POINTS = Number(process.env.STARTING_BUYER_POINTS ?? 100);

function scoreTierFromScore(score: number): ScoreTier {
  if (score >= 95) return "LEGENDARY";
  if (score >= 85) return "PLATINUM";
  if (score >= 70) return "GOLD";
  if (score >= 50) return "SILVER";
  return "BRONZE";
}

async function main() {
  console.log("Seeding PawDrop database...");

  // ── Categories ────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "Golden Retriever", slug: "golden-retriever", icon: "🐕" },
    { name: "French Bulldog", slug: "french-bulldog", icon: "🐶" },
    { name: "Corgi", slug: "corgi", icon: "🦴" },
    { name: "Husky", slug: "husky", icon: "🐺" },
    { name: "Poodle", slug: "poodle", icon: "🐩" },
    { name: "Labrador", slug: "labrador", icon: "🦮" },
    { name: "Puppies", slug: "puppies", icon: "🐾" },
    { name: "Mixed Breed", slug: "mixed-breed", icon: "❤️" },
  ];
  const categories = [];
  for (const [i, c] of categoryDefs.entries()) {
    categories.push(
      await db.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: { ...c, sortOrder: i, description: `Photos tagged ${c.name}` },
      }),
    );
  }

  // ── Tags ──────────────────────────────────────────────────────────────
  const tagDefs = [
    "sleepy", "zoomies", "beach-day", "snow", "birthday", "costume",
    "rescue-story", "senior-dog", "first-photoshoot", "playing-fetch",
    "studio-shot", "candid", "black-and-white", "golden-hour",
  ];
  const tags = [];
  for (const name of tagDefs) {
    tags.push(
      await db.tag.upsert({
        where: { slug: name },
        update: {},
        create: { name: name.replace(/-/g, " "), slug: name },
      }),
    );
  }

  // ── Achievements ──────────────────────────────────────────────────────
  const achievementDefs = [
    { key: "first_unlock", name: "First Unlock", description: "Unlock your first mystery photo", icon: "🎁", category: "buyer", xpReward: 50, pointsReward: 10, criteria: { type: "unlock_count", target: 1 } },
    { key: "collector_10", name: "Collector", description: "Unlock 10 photos", icon: "📸", category: "buyer", xpReward: 100, pointsReward: 25, criteria: { type: "unlock_count", target: 10 } },
    { key: "collector_100", name: "Master Collector", description: "Unlock 100 photos", icon: "🏆", category: "buyer", xpReward: 500, pointsReward: 100, criteria: { type: "unlock_count", target: 100 } },
    { key: "first_upload", name: "First Upload", description: "Get your first upload approved", icon: "📤", category: "seller", xpReward: 50, pointsReward: 10, criteria: { type: "approved_count", target: 1 } },
    { key: "top_seller", name: "Top Seller", description: "Earn 1000 points from sales", icon: "💰", category: "seller", xpReward: 300, pointsReward: 50, criteria: { type: "points_earned", target: 1000 } },
    { key: "week_streak", name: "Week Warrior", description: "7-day login streak", icon: "🔥", category: "engagement", xpReward: 75, pointsReward: 15, criteria: { type: "streak", target: 7 } },
    { key: "month_streak", name: "Dedicated", description: "30-day login streak", icon: "⭐", category: "engagement", xpReward: 400, pointsReward: 75, criteria: { type: "streak", target: 30 } },
    { key: "social_butterfly", name: "Social Butterfly", description: "Follow 25 creators", icon: "🦋", category: "social", xpReward: 60, pointsReward: 10, criteria: { type: "following_count", target: 25 } },
  ];
  for (const a of achievementDefs) {
    await db.achievement.upsert({ where: { key: a.key }, update: {}, create: a });
  }

  // ── Badges ────────────────────────────────────────────────────────────
  const badgeDefs = [
    { key: "verified_seller", name: "Verified Seller", icon: "✅", description: "Identity-verified creator", tier: 1 },
    { key: "top_rated", name: "Top Rated", icon: "🌟", description: "Maintains a 4.8+ reputation score", tier: 2 },
    { key: "founding_member", name: "Founding Member", icon: "🎖️", description: "Joined during the PawDrop beta", tier: 3 },
  ];
  for (const b of badgeDefs) {
    await db.badge.upsert({ where: { key: b.key }, update: {}, create: b });
  }

  // ── Missions ──────────────────────────────────────────────────────────
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const missionDefs = [
    { key: "daily_login", name: "Daily Check-in", description: "Log in today", period: MissionPeriod.DAILY, xpReward: 10, pointsReward: 5, targetCount: 1, criteria: { type: "login" }, startsAt: startOfDay, endsAt: endOfDay },
    { key: "daily_unlock_1", name: "Daily Mystery", description: "Unlock 1 photo today", period: MissionPeriod.DAILY, xpReward: 20, pointsReward: 0, targetCount: 1, criteria: { type: "unlock" }, startsAt: startOfDay, endsAt: endOfDay },
    { key: "weekly_unlock_5", name: "Weekly Explorer", description: "Unlock 5 photos this week", period: MissionPeriod.WEEKLY, xpReward: 100, pointsReward: 20, targetCount: 5, criteria: { type: "unlock" }, startsAt: startOfWeek, endsAt: endOfWeek },
    { key: "weekly_upload_3", name: "Weekly Creator", description: "Upload 3 photos this week", period: MissionPeriod.WEEKLY, xpReward: 100, pointsReward: 20, targetCount: 3, criteria: { type: "upload" }, startsAt: startOfWeek, endsAt: endOfWeek },
    { key: "monthly_challenge", name: "Monthly Challenge", description: "Unlock 20 photos this month", period: MissionPeriod.MONTHLY, xpReward: 500, pointsReward: 100, targetCount: 20, criteria: { type: "unlock" }, startsAt: startOfMonth, endsAt: endOfMonth },
  ];
  for (const m of missionDefs) {
    await db.mission.upsert({ where: { key: m.key }, update: {}, create: m });
  }

  // ── Platform settings ─────────────────────────────────────────────────
  await db.platformSetting.upsert({
    where: { key: "platform_commission_percent" },
    update: {},
    create: { key: "platform_commission_percent", value: Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 20), description: "Percentage of every unlock retained by the platform" },
  });
  await db.platformSetting.upsert({
    where: { key: "starting_buyer_points" },
    update: {},
    create: { key: "starting_buyer_points", value: STARTING_BUYER_POINTS, description: "Points granted to a new buyer on signup" },
  });

  // ── Admin user ────────────────────────────────────────────────────────
  const adminPasswordHash = await hash(ADMIN_PASSWORD, 12);
  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      username: "pawdrop_admin",
      name: "PawDrop Admin",
      hashedPassword: adminPasswordHash,
      emailVerified: new Date(),
      roles: [Role.ADMIN],
      primaryRole: Role.ADMIN,
      status: "ACTIVE",
    },
  });

  // ── Sellers ───────────────────────────────────────────────────────────
  const sellerDefs = [
    { username: "goldenpaws", name: "Golden Paws Studio", bio: "Professional pet photographer specializing in golden retrievers." },
    { username: "corgi_kingdom", name: "Corgi Kingdom", bio: "Short legs, big personality. Daily corgi content." },
    { username: "husky_howl", name: "Husky Howl", bio: "Snow days and zoomies, captured." },
    { username: "rescue_tales", name: "Rescue Tales", bio: "Every rescue has a story worth telling." },
  ];
  const sellers = [];
  for (const s of sellerDefs) {
    const password = await hash("Password123!", 12);
    sellers.push(
      await db.user.upsert({
        where: { email: `${s.username}@pawdrop.app` },
        update: {},
        create: {
          email: `${s.username}@pawdrop.app`,
          username: s.username,
          name: s.name,
          bio: s.bio,
          hashedPassword: password,
          emailVerified: new Date(),
          roles: [Role.SELLER, Role.BUYER],
          primaryRole: Role.SELLER,
          reputationScore: 4 + Math.random(),
          xp: Math.floor(Math.random() * 2000),
          level: Math.floor(Math.random() * 10) + 1,
        },
      }),
    );
  }

  // ── Buyers ────────────────────────────────────────────────────────────
  const buyerDefs = [
    { username: "dogloverjane", name: "Jane Miller" },
    { username: "pupfanatic", name: "Sam Ortiz" },
    { username: "woofcollector", name: "Priya Nair" },
  ];
  const buyers = [];
  for (const b of buyerDefs) {
    const password = await hash("Password123!", 12);
    buyers.push(
      await db.user.upsert({
        where: { email: `${b.username}@pawdrop.app` },
        update: {},
        create: {
          email: `${b.username}@pawdrop.app`,
          username: b.username,
          name: b.name,
          hashedPassword: password,
          emailVerified: new Date(),
          roles: [Role.BUYER],
          primaryRole: Role.BUYER,
          pointsBalance: STARTING_BUYER_POINTS,
          streakCount: Math.floor(Math.random() * 10),
        },
      }),
    );
    await db.pointTransaction.create({
      data: {
        userId: buyers[buyers.length - 1].id,
        type: TransactionType.SIGNUP_BONUS,
        amount: STARTING_BUYER_POINTS,
        balanceAfter: STARTING_BUYER_POINTS,
        description: "Welcome bonus",
      },
    });
  }

  // ── Photos (approved, pending, rejected) with AI scores ──────────────
  const sampleBreeds = ["Golden Retriever", "Corgi", "Husky", "Labrador", "French Bulldog", "Poodle"];
  const sampleTitles = [
    "Sunbathing on the porch", "Zoomies in the backyard", "First snow day",
    "Beach day adventures", "Nap time bliss", "Birthday boy turns 3",
    "Studio portrait session", "Playing fetch at the park", "Sleepy Sunday morning",
    "Rescue success story", "Puppy's first bath", "Golden hour walk",
  ];

  let totalApprovedPhotos = 0;

  for (const seller of sellers) {
    const uploadCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < uploadCount; i++) {
      const statusRoll = Math.random();
      const status: UploadStatus =
        statusRoll < 0.7 ? "APPROVED" : statusRoll < 0.9 ? "PENDING" : "REJECTED";

      const overallScore = status === "APPROVED" ? Math.round(40 + Math.random() * 60) : null;
      const publicId = `pawdrop/seed/${seller.username}-${nanoid(8)}`;
      const category = categories[Math.floor(Math.random() * categories.length)];

      const photo = await db.photo.create({
        data: {
          sellerId: seller.id,
          title: sampleTitles[Math.floor(Math.random() * sampleTitles.length)],
          description: "Seed data placeholder description for local development.",
          cloudinaryPublicId: publicId,
          url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
          blurredUrl: `https://res.cloudinary.com/demo/image/upload/e_blur:2000/${publicId}.jpg`,
          width: 1200,
          height: 1500,
          breed: sampleBreeds[Math.floor(Math.random() * sampleBreeds.length)],
          ageCategory: [AgeCategory.PUPPY, AgeCategory.YOUNG, AgeCategory.ADULT, AgeCategory.SENIOR][Math.floor(Math.random() * 4)],
          energyLevel: [EnergyLevel.CALM, EnergyLevel.MODERATE, EnergyLevel.ENERGETIC, EnergyLevel.HYPER][Math.floor(Math.random() * 4)],
          color: ["Cream", "Black", "Brown", "White", "Brindle"][Math.floor(Math.random() * 5)],
          categoryId: category.id,
          price: overallScore ? Math.max(5, Math.round(overallScore / 4)) : 10,
          status,
          overallScore: overallScore ?? undefined,
          scoreTier: overallScore ? scoreTierFromScore(overallScore) : undefined,
          rejectionReason: status === "REJECTED" ? "Image quality below marketplace threshold." : undefined,
          approvedById: status === "APPROVED" ? admin.id : undefined,
          approvedAt: status === "APPROVED" ? new Date() : undefined,
          tags: {
            create: [tags[Math.floor(Math.random() * tags.length)], tags[Math.floor(Math.random() * tags.length)]]
              .filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx)
              .map((t) => ({ tagId: t.id })),
          },
        },
      });

      if (overallScore) {
        await db.photoScore.create({
          data: {
            photoId: photo.id,
            overallScore,
            cutenessScore: Math.min(100, overallScore + Math.random() * 10 - 5),
            compositionScore: Math.min(100, overallScore + Math.random() * 10 - 5),
            lightingScore: Math.min(100, overallScore + Math.random() * 10 - 5),
            sharpnessScore: Math.min(100, overallScore + Math.random() * 10 - 5),
            emotionScore: Math.min(100, overallScore + Math.random() * 10 - 5),
            colorBalanceScore: Math.min(100, overallScore + Math.random() * 10 - 5),
            suggestedPrice: Math.max(5, Math.round(overallScore / 4)),
            confidenceScore: 0.75 + Math.random() * 0.2,
            explanation: "Seed-generated score: balanced composition and good lighting detected in placeholder analysis.",
            modelUsed: "seed-fixture",
          },
        });
        totalApprovedPhotos++;
      }
    }
  }

  // ── Social graph: follows, likes, comments ────────────────────────────
  const approvedPhotos = await db.photo.findMany({ where: { status: "APPROVED" }, take: 50 });

  for (const buyer of buyers) {
    for (const seller of sellers) {
      if (Math.random() > 0.4) {
        await db.follow.upsert({
          where: { followerId_followingId: { followerId: buyer.id, followingId: seller.id } },
          update: {},
          create: { followerId: buyer.id, followingId: seller.id },
        });
      }
    }
    for (const photo of approvedPhotos.slice(0, 8)) {
      if (Math.random() > 0.5) {
        await db.like.upsert({
          where: { userId_photoId: { userId: buyer.id, photoId: photo.id } },
          update: {},
          create: { userId: buyer.id, photoId: photo.id },
        });
        await db.photo.update({ where: { id: photo.id }, data: { likeCount: { increment: 1 } } });
      }
      if (Math.random() > 0.7) {
        await db.comment.create({
          data: {
            photoId: photo.id,
            userId: buyer.id,
            body: ["So cute!", "Look at that face!", "Best mystery unlock yet.", "10/10 would unlock again."][Math.floor(Math.random() * 4)],
          },
        });
        await db.photo.update({ where: { id: photo.id }, data: { commentCount: { increment: 1 } } });
      }
    }
  }

  // ── A few completed unlocks + point transactions for dashboard history ─
  for (const buyer of buyers) {
    const toUnlock = approvedPhotos.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const photo of toUnlock) {
      const price = photo.price;
      const commission = Math.round(price * 0.2);
      const sellerEarning = price - commission;

      const unlock = await db.mysteryUnlock.create({
        data: {
          buyerId: buyer.id,
          photoId: photo.id,
          requestedTier: photo.scoreTier ?? undefined,
          pointsSpent: price,
          platformFee: commission,
          sellerEarning,
        },
      });

      await db.pointTransaction.create({
        data: {
          userId: buyer.id,
          type: TransactionType.UNLOCK_SPEND,
          amount: -price,
          balanceAfter: Math.max(0, buyer.pointsBalance - price),
          relatedUnlockId: unlock.id,
          relatedPhotoId: photo.id,
          description: `Unlocked "${photo.title}"`,
        },
      });

      await db.pointTransaction.create({
        data: {
          userId: photo.sellerId,
          type: TransactionType.SALE_EARNING,
          amount: sellerEarning,
          balanceAfter: sellerEarning,
          relatedUnlockId: unlock.id,
          relatedPhotoId: photo.id,
          description: `Sale of "${photo.title}"`,
        },
      });

      await db.photo.update({ where: { id: photo.id }, data: { unlockCount: { increment: 1 } } });
      await db.user.update({
        where: { id: buyer.id },
        data: { pointsBalance: { decrement: price } },
      });
      await db.user.update({
        where: { id: photo.sellerId },
        data: { pointsBalance: { increment: sellerEarning } },
      });
    }
  }

  // ── Rewards catalog (Stage 15) ────────────────────────────────────────
  const rewardDefs = [
    {
      key: "badge_top_hat",
      name: "Top Hat Badge",
      description: "A cosmetic profile flair — no gameplay effect, just bragging rights.",
      category: RewardCategory.PROFILE_BADGE,
      pointsCost: 50,
      metadata: { badgeKey: "founding_member" },
    },
    {
      key: "feature_boost_3day",
      name: "3-Day Featured Boost",
      description: "Get featured on the PawDrop homepage for 3 days. Sellers only.",
      category: RewardCategory.FEATURE_BOOST,
      pointsCost: 150,
      metadata: { boostDays: 3 },
    },
    {
      key: "commission_discount_10",
      name: "10% Commission Discount (30 days)",
      description: "Keep an extra 10% of every sale for the next 30 days. Sellers only.",
      category: RewardCategory.COMMISSION_DISCOUNT,
      pointsCost: 300,
      metadata: { discountPercent: 10, days: 30 },
    },
  ];
  for (const r of rewardDefs) {
    await db.rewardItem.upsert({ where: { key: r.key }, update: {}, create: r });
  }

  // ── A sample contest with a couple of real-photo entries ─────────────
  const contestStart = new Date();
  contestStart.setDate(contestStart.getDate() - 2);
  const contestEnd = new Date();
  contestEnd.setDate(contestEnd.getDate() + 5);

  const sampleContest = await db.contest.upsert({
    where: { id: "seed-weekly-contest" },
    update: {},
    create: {
      id: "seed-weekly-contest",
      title: "Cutest Zoomies of the Week",
      description: "Show off your dog's best action shot. Community votes decide the winner.",
      period: MissionPeriod.WEEKLY,
      status: ContestStatus.ACTIVE,
      startsAt: contestStart,
      endsAt: contestEnd,
    },
  });

  for (const photo of approvedPhotos.slice(0, Math.min(3, sellers.length))) {
    await db.contestEntry.upsert({
      where: { contestId_sellerId: { contestId: sampleContest.id, sellerId: photo.sellerId } },
      update: {},
      create: { contestId: sampleContest.id, photoId: photo.id, sellerId: photo.sellerId, voteCount: Math.floor(Math.random() * 10) },
    });
  }

  // ── A sample mystery bundle ────────────────────────────────────────────
  const bundlePhotos = approvedPhotos.slice(3, 6);
  if (bundlePhotos.length >= 2) {
    const normalValue = bundlePhotos.reduce((sum, p) => sum + p.price, 0);
    const existingBundle = await db.bundle.findFirst({ where: { title: "Weekend Starter Pack" } });
    if (!existingBundle) {
      await db.bundle.create({
        data: {
          title: "Weekend Starter Pack",
          description: `${bundlePhotos.length} hand-picked mystery photos at a discount.`,
          price: Math.max(bundlePhotos.length, Math.round(normalValue * 0.8)),
          createdById: admin.id,
          photos: { create: bundlePhotos.map((p) => ({ photoId: p.id })) },
        },
      });
    }
  }

  console.log(`Seed complete: ${sellers.length} sellers, ${buyers.length} buyers, ${totalApprovedPhotos} scored photos.`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
