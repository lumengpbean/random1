import { PrismaClient, PostState } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await hash("AdminPass123!", 10);
  const userPass = await hash("UserPass123!", 10);

  const [admin, user] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@satirical-commons.local" },
      update: {},
      create: { email: "admin@satirical-commons.local", name: "Editor-in-Chief", role: "admin", locale: "en", passwordHash: adminPass }
    }),
    prisma.user.upsert({
      where: { email: "reader@satirical-commons.local" },
      update: {},
      create: { email: "reader@satirical-commons.local", name: "Community Reader", role: "user", locale: "zh", passwordHash: userPass }
    })
  ]);

  const governance = await prisma.tag.upsert({ where: { name: "governance" }, update: {}, create: { name: "governance" } });
  const campus = await prisma.tag.upsert({ where: { name: "campus" }, update: {}, create: { name: "campus" } });

  const preprint = await prisma.post.upsert({
    where: { slug: "committee-approves-more-committees" },
    update: {},
    create: {
      slug: "committee-approves-more-committees",
      title: "Committee Approves Forming More Committees",
      summary: "A procedural comedy on policy feedback loops.",
      content: "In a surprise unanimous vote, the oversight committee approved a proposal to establish an exploratory panel tasked with evaluating whether another committee should assess the feasibility of future committees.",
      locale: "en",
      state: PostState.published_preprint,
      featured: true,
      authorId: admin.id,
      publishedAt: new Date()
    }
  });

  const promoted = await prisma.post.upsert({
    where: { slug: "cafeteria-honors-line-standing" },
    update: {},
    create: {
      slug: "cafeteria-honors-line-standing",
      title: "Cafeteria Introduces Medal for Exemplary Queue Endurance",
      summary: "A bilingual social satire on scarcity and patience.",
      content: "The campus cafeteria has launched a medal system that awards bronze, silver, and gold distinctions based on minutes spent waiting for noodles while reflecting on civic virtue.",
      locale: "bilingual",
      isBilingual: true,
      state: PostState.promoted_to_journal,
      featured: true,
      authorId: user.id,
      publishedAt: new Date()
    }
  });

  await prisma.postTag.upsert({ where: { postId_tagId: { postId: preprint.id, tagId: governance.id } }, update: {}, create: { postId: preprint.id, tagId: governance.id } });
  await prisma.postTag.upsert({ where: { postId_tagId: { postId: promoted.id, tagId: campus.id } }, update: {}, create: { postId: promoted.id, tagId: campus.id } });

  await prisma.comment.createMany({
    data: [
      { postId: preprint.id, userId: user.id, body: "This is painfully accurate and very funny." },
      { postId: promoted.id, userId: admin.id, body: "Promoted for sharp structure and clear satire labeling." }
    ],
    skipDuplicates: true
  });

  await prisma.vote.createMany({
    data: [
      { postId: preprint.id, userId: user.id, value: 1 },
      { postId: promoted.id, userId: admin.id, value: 1 }
    ],
    skipDuplicates: true
  });

  await prisma.announcement.createMany({
    data: [
      { title: "Call for bilingual submissions", body: "We are opening a themed week for EN/ZH civic satire.", locale: "en", published: true },
      { title: "双语投稿周开启", body: "欢迎英文与中文讽刺作品投稿。", locale: "zh", published: true }
    ],
    skipDuplicates: true
  });

  const issue = await prisma.issueCollection.upsert({ where: { id: "demo-issue-1" }, update: {}, create: { id: "demo-issue-1", title: "Issue 1: Public Absurdities", locale: "en" } });
  await prisma.issuePost.upsert({ where: { issueId_postId: { issueId: issue.id, postId: promoted.id } }, update: { order: 1 }, create: { issueId: issue.id, postId: promoted.id, order: 1 } });

  await prisma.siteSetting.upsert({ where: { key: "platform_name" }, update: { value: "Satirical Commons" }, create: { key: "platform_name", value: "Satirical Commons" } });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
