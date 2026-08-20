export default class Category {
  static table = 'categories';

  name!: string;
  colorHex!: string;
  icon!: string;
  type!: string;

  constructor(values: Partial<Category> = {}) {
    Object.assign(this, values);
  }
}
