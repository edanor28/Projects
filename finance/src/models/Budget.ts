import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Budget extends Model {
  static table = 'budgets';

  @field('category_id') categoryId!: string;
  @field('monthly_limit') monthlyLimit!: number;
  @field('month_year') monthYear!: string; // e.g., 2026-08
}
