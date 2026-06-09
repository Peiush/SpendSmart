export interface GoalInput {
  id: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
}

export interface GoalAllocation {
  goalId: string;
  amount: number;
}

function deadlineWeight(deadline: Date | null): number {
  if (!deadline) return 1;
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (daysLeft <= 0) return 0;
  if (daysLeft <= 90) return 3;
  if (daysLeft <= 180) return 2;
  return 1;
}

export function distributeSurplus(surplus: number, goals: GoalInput[]): GoalAllocation[] {
  if (surplus <= 0) return [];

  const eligible = goals
    .filter(g => g.currentAmount < g.targetAmount)
    .map(g => ({ ...g, weight: deadlineWeight(g.deadline), remaining: g.targetAmount - g.currentAmount }))
    .filter(g => g.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  if (!eligible.length) return [];

  const totalWeight = eligible.reduce((s, g) => s + g.weight, 0);
  const allocations: GoalAllocation[] = [];
  let left = surplus;

  for (const g of eligible) {
    if (left <= 0) break;
    const proportional = (g.weight / totalWeight) * surplus;
    const amount = Math.min(proportional, g.remaining, left);
    if (amount >= 0.01) {
      allocations.push({ goalId: g.id, amount: Math.round(amount * 100) / 100 });
      left -= amount;
    }
  }

  return allocations;
}
