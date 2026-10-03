export function getPublishedBudgetUrl(origin: string, budget: {
  public_status?: string | null; public_token?: string | null;
}): string {
  if (!origin || budget.public_status !== 'published' || !budget.public_token) return '';
  return `${origin}/presupuesto/${encodeURIComponent(budget.public_token)}`;
}
