export default class Transaction {
  static table = 'transactions';

  amount!: number;
  date!: number;
  rawDescription!: string;
  processingState!: string;
  categoryId?: string;

  constructor(values: Partial<Transaction> = {}) {
    Object.assign(this, values);
  }
}
