import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/auth/default-categories";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;
  const name = process.env.SEED_USER_NAME?.trim() || "Usuario";

  if (!email || !password) {
    throw new Error("Defina SEED_USER_EMAIL y SEED_USER_PASSWORD para crear el usuario inicial.");
  }
  if (password.length < 10) {
    throw new Error("SEED_USER_PASSWORD debe tener al menos 10 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
    select: { id: true, email: true },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: user.id })),
    skipDuplicates: true,
  });

  console.info(`Usuario inicial listo: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "No se pudo ejecutar la semilla.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

