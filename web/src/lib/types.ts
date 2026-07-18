export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  servings: number;
  tags: string[];
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanEntry {
  id: string;
  week: string;
  day: string; // MON..SUN
  recipeId: string;
  recipeTitle?: string;
}

export interface OwnerGroup {
  ownerId: string;
  email: string;
  role: Role;
  recipes: Recipe[];
}

export interface SettingItem {
  key: string;
  label: string;
  configured: boolean;
  maskedValue: string;
  fields: string[];
}
