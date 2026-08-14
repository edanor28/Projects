import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Transaction extends Model {
  static table = 'transactions';

  @field('amount') amount!: number;
  @field('date') date!: number; // store as epoch ms
  @field('raw_description') rawDescription!: string;
  @field('processing_state') processingState!: string;
  @field('category_id') categoryId?: string;
}
