import { prisma } from "@/lib/db";
import { createCreditPackCheckout } from "@/lib/stripe/checkout";

async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "demo@glitterhits.online" } });
  const pack = await prisma.creditPack.findFirstOrThrow({ where: { slug: "starter-100" } });
  const result = await createCreditPackCheckout({
    userId: user.id,
    email: user.email,
    name: user.name,
    packId: pack.id,
  });
  console.log(
    JSON.stringify({
      ok: Boolean(result.url),
      error: result.error ?? null,
      urlHost: result.url ? new URL(result.url).host : null,
    }),
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
