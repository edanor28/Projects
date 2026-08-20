export default class Budget {
  static table = 'budgets';

  categoryId!: string;
  monthlyLimit!: number;
  monthYear!: string;

  constructor(values: Partial<Budget> = {}) {
    Object.assign(this, values);
  }
}
