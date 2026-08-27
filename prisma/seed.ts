import { PrismaClient } from "@prisma/client";
import { COMPETENCIES, LEARNING_PATHS, BADGES } from "../src/lib/curriculum";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Echolink Simulation Engine — Blockchain Academy...");

  const academy = await prisma.academy.upsert({
    where: { slug: "blockchain" },
    update: {},
    create: {
      slug: "blockchain",
      name: "Blockchain Academy",
      description:
        "Learn blockchain by building and operating it — hashing, blocks, chains, cryptography, distributed networks, and consensus.",
    },
  });

  const competencyIdByCode: Record<string, string> = {};
  for (const c of COMPETENCIES) {
    const row = await prisma.competency.upsert({
      where: { academyId_code: { academyId: academy.id, code: c.code } },
      update: { name: c.name, description: c.description, dependsOnCode: c.dependsOnCode },
      create: {
        academyId: academy.id,
        code: c.code,
        name: c.name,
        description: c.description,
        dependsOnCode: c.dependsOnCode,
      },
    });
    competencyIdByCode[c.code] = row.id;
  }

  for (const pathDef of LEARNING_PATHS) {
    const path = await prisma.learningPath.upsert({
      where: { academyId_slug: { academyId: academy.id, slug: pathDef.slug } },
      update: { name: pathDef.name, level: pathDef.level, order: pathDef.order },
      create: {
        academyId: academy.id,
        slug: pathDef.slug,
        name: pathDef.name,
        level: pathDef.level,
        order: pathDef.order,
      },
    });

    for (const m of pathDef.missions) {
      const mission = await prisma.mission.upsert({
        where: { learningPathId_slug: { learningPathId: path.id, slug: m.slug } },
        update: {
          order: m.order,
          title: m.title,
          problemPrompt: m.problemPrompt,
          narrative: m.narrative,
          primitiveKey: m.primitiveKey,
          mode: m.mode,
          config: m.config as any,
        },
        create: {
          learningPathId: path.id,
          slug: m.slug,
          order: m.order,
          title: m.title,
          problemPrompt: m.problemPrompt,
          narrative: m.narrative,
          primitiveKey: m.primitiveKey,
          mode: m.mode,
          config: m.config as any,
        },
      });

      for (const mc of m.competencyCodes) {
        await prisma.missionCompetency.upsert({
          where: { missionId_competencyId: { missionId: mission.id, competencyId: competencyIdByCode[mc.code] } },
          update: { weight: mc.weight },
          create: { missionId: mission.id, competencyId: competencyIdByCode[mc.code], weight: mc.weight },
        });
      }

      for (const h of m.hints) {
        await prisma.hintDefinition.upsert({
          where: { missionId_errorCode_level: { missionId: mission.id, errorCode: h.errorCode, level: h.level } },
          update: { text: h.text },
          create: { missionId: mission.id, errorCode: h.errorCode, level: h.level, text: h.text },
        });
      }
    }

    for (const code of pathDef.credential.requiredCompetencyCodes) {
      await prisma.credentialRequirement.upsert({
        where: { learningPathId_competencyId: { learningPathId: path.id, competencyId: competencyIdByCode[code] } },
        update: { minMastery: pathDef.credential.minMastery },
        create: { learningPathId: path.id, competencyId: competencyIdByCode[code], minMastery: pathDef.credential.minMastery },
      });
    }
  }

  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: { name: b.name, description: b.description },
      create: b,
    });
  }

  console.log(`Seed complete — ${LEARNING_PATHS.length} learning paths, ${COMPETENCIES.length} competencies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
