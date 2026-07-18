// Seed contract (Colossus): every seeded demo credential MUST be printed as a
// `SEED_CRED <ROLE> <email> <password>` line (or a single SEED_CREDS_JSON line) —
// the deploy activity sync_seed_credentials parses stdout to populate
// deployments.appDemoCredentials. Keep these lines when extending this seed.
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Passwords are FIXED demo constants (env-overridable) so the Login page's
// demo-fill buttons authenticate against the real backend. bcrypt matches the
// app's auth service (backend/src/lib/auth.ts).
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

const SEED_USERS: Array<{ email: string; name: string; role: Role; password: string }> = [
  {
    email: 'admin@demo.test',
    name: 'Admin User',
    role: Role.ADMIN,
    password: process.env.SEED_ADMIN_PASSWORD || 'demo-password',
  },
  {
    email: 'user@demo.test',
    name: 'Regular User',
    role: Role.USER,
    password: process.env.SEED_USER_PASSWORD || 'demo-password',
  },
];

// Sample recipes owned by the seeded USER so a fresh deploy isn't empty.
// Keyed by stable ids for idempotent upserts.
const SAMPLE_RECIPES: Array<{
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  servings: number;
  tags: string[];
}> = [
  {
    id: 'seed-recipe-lemon-pasta',
    title: 'Lemon Pasta',
    ingredients: ['spaghetti', 'lemon', 'olive oil', 'parmesan', 'garlic'],
    steps: [
      'Boil the spaghetti in salted water until al dente.',
      'Whisk lemon juice and zest with olive oil and minced garlic.',
      'Toss the drained pasta with the sauce and grated parmesan.',
    ],
    servings: 2,
    tags: ['quick', 'vegetarian'],
  },
  {
    id: 'seed-recipe-veggie-stirfry',
    title: 'Veggie Stir-Fry',
    ingredients: ['broccoli', 'bell pepper', 'carrot', 'soy sauce', 'ginger'],
    steps: [
      'Chop all the vegetables into bite-sized pieces.',
      'Stir-fry the vegetables over high heat until crisp-tender.',
      'Add soy sauce and grated ginger, then serve over steamed rice.',
    ],
    servings: 3,
    tags: ['vegetarian', 'healthy'],
  },
];

async function main(): Promise<void> {
  const creds: Array<{ role: string; email: string; password: string }> = [];
  let seededUserId: string | null = null;

  for (const u of SEED_USERS) {
    // Re-assert the password on every run (set in BOTH create and update) so the
    // stored hash never drifts from the credentials we emit on redeploy.
    const passwordHash = hashPassword(u.password);
    const account = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: passwordHash },
      create: { email: u.email, name: u.name, role: u.role, password: passwordHash },
    });
    if (u.role === Role.USER) seededUserId = account.id;
    console.log(`SEED_CRED ${u.role} ${u.email} ${u.password}`);
    creds.push({ role: u.role, email: u.email, password: u.password });
  }

  console.log(`SEED_CREDS_JSON ${JSON.stringify(creds)}`);

  if (seededUserId) {
    for (const r of SAMPLE_RECIPES) {
      const data = {
        title: r.title,
        ingredients: JSON.stringify(r.ingredients),
        steps: JSON.stringify(r.steps),
        servings: r.servings,
        tags: JSON.stringify(r.tags),
        ownerId: seededUserId,
      };
      await prisma.recipe.upsert({
        where: { id: r.id },
        update: data,
        create: { id: r.id, ...data },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
