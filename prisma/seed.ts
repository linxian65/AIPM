import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const presets = [
    {
      slug: "ecom-return",
      title: "电商客服退换货 Agent",
      brief:
        "自动处理用户退换货申请，判断是否符合政策，生成处理动作，复杂场景转人工。",
      domain: "电商",
    },
    {
      slug: "doc-qa",
      title: "企业文档问答 Agent",
      brief:
        "基于内部知识库回答员工问题，标注引用来源，不确定时明确说明而非编造。",
      domain: "文档",
    },
    {
      slug: "sales-email",
      title: "销售邮件助手 Agent",
      brief:
        "根据客户背景和沟通历史，生成个性化跟进邮件草稿，销售确认后发送。",
      domain: "销售",
    },
  ];

  for (const p of presets) {
    await prisma.presetCase.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log(`Seeded ${presets.length} preset cases`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());