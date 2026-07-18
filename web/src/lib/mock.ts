// Demo fallback data so the mockup is fully navigable when no backend is attached
// (static preview). Real pages call the API first and fall back to this on failure.
import type { OwnerGroup, PlanEntry, Recipe, SettingItem } from './types';
import { currentWeek } from './week';

export const demoRecipes: Recipe[] = [
  {
    id: 'r1',
    title: 'Lemon Pasta',
    servings: 2,
    tags: ['dinner', 'vegetarian', 'quick'],
    ingredients: ['200g spaghetti', '2 lemons (zest + juice)', '50g parmesan', '2 tbsp olive oil', 'Fresh basil', 'Salt & pepper'],
    steps: [
      'Boil spaghetti in salted water until al dente.',
      'Whisk lemon juice, zest and olive oil in a bowl.',
      'Toss drained pasta with the lemon mixture and parmesan.',
      'Finish with basil, salt and pepper.',
    ],
    ownerId: 'u-user',
    updatedAt: '2026-07-16T10:00:00Z',
  },
  {
    id: 'r2',
    title: 'Weeknight Veggie Chili',
    servings: 4,
    tags: ['dinner', 'batch-cook', 'vegan'],
    ingredients: ['2 cans kidney beans', '1 can chopped tomatoes', '1 onion', '2 peppers', '2 tbsp chili powder', '1 tsp cumin'],
    steps: [
      'Sauté onion and peppers until soft.',
      'Add spices and cook 1 minute.',
      'Add tomatoes and beans, simmer 25 minutes.',
      'Season and serve with rice.',
    ],
    ownerId: 'u-user',
    updatedAt: '2026-07-14T18:30:00Z',
  },
  {
    id: 'r3',
    title: 'Overnight Oats',
    servings: 1,
    tags: ['breakfast', 'quick'],
    ingredients: ['50g rolled oats', '120ml milk', '1 tbsp yogurt', '1 tbsp honey', 'Handful of berries'],
    steps: ['Combine oats, milk and yogurt in a jar.', 'Stir in honey.', 'Refrigerate overnight.', 'Top with berries before serving.'],
    ownerId: 'u-user',
    updatedAt: '2026-07-12T07:15:00Z',
  },
];

export const demoAdminOwnedRecipes: Recipe[] = [
  {
    id: 'r4',
    title: 'Sheet-Pan Salmon',
    servings: 2,
    tags: ['dinner', 'high-protein'],
    ingredients: ['2 salmon fillets', 'Broccoli', 'Olive oil', 'Lemon', 'Garlic'],
    steps: ['Heat oven to 200°C.', 'Toss broccoli in oil and garlic.', 'Add salmon, roast 15 min.', 'Squeeze lemon and serve.'],
    ownerId: 'u-admin',
    updatedAt: '2026-07-15T19:00:00Z',
  },
];

export function demoPlanEntries(week: string): PlanEntry[] {
  return [
    { id: 'p1', week, day: 'WED', recipeId: 'r1', recipeTitle: 'Lemon Pasta' },
    { id: 'p2', week, day: 'MON', recipeId: 'r3', recipeTitle: 'Overnight Oats' },
    { id: 'p3', week, day: 'FRI', recipeId: 'r2', recipeTitle: 'Weeknight Veggie Chili' },
  ];
}

export const demoOwnerGroups: OwnerGroup[] = [
  { ownerId: 'u-admin', email: 'admin@demo.test', role: 'ADMIN', recipes: demoAdminOwnedRecipes },
  { ownerId: 'u-user', email: 'user@demo.test', role: 'USER', recipes: demoRecipes },
];

export const demoSettings: SettingItem[] = [
  {
    key: 'postgresql',
    label: 'PostgreSQL Database',
    configured: false,
    maskedValue: '',
    fields: ['host', 'port', 'database', 'username', 'password'],
  },
  {
    key: 'minio',
    label: 'MinIO Object Storage',
    configured: false,
    maskedValue: '',
    fields: ['endpoint', 'accessKey', 'secretKey', 'bucket'],
  },
];

export const CURRENT_WEEK = currentWeek();
