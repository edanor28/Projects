import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Category extends Model {
  static table = 'categories';

  @field('name') name!: string;
  @field('color_hex') colorHex!: string;
  @field('icon') icon!: string;
  @field('type') type!: string; // e.g., expense/income
}
