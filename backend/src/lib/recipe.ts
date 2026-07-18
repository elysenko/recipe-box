// Recipe field (de)serialization. The DB stores ingredients/steps/tags as
// JSON-encoded string columns; the API exposes them as string[].

interface RecipeRow {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  tags: string;
  servings: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeDto {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  servings: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export function parseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

// Accepts arrays (from the SPA), JSON strings, or newline-delimited text.
export function serializeArray(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((v) => String(v).trim()).filter(Boolean));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return JSON.stringify(parsed.map((v) => String(v).trim()).filter(Boolean));
    } catch {
      /* not JSON — fall through to newline split */
    }
    return JSON.stringify(
      value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  return '[]';
}

export function toRecipeDto(row: RecipeRow): RecipeDto {
  return {
    id: row.id,
    title: row.title,
    ingredients: parseArray(row.ingredients),
    steps: parseArray(row.steps),
    tags: parseArray(row.tags),
    servings: row.servings,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
