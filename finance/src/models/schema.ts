export const schema = {
  version: 1,
  tables: [
    {
      name: 'transactions',
      columns: [
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'number' },
        { name: 'raw_description', type: 'string' },
        { name: 'processing_state', type: 'string' },
        { name: 'category_id', type: 'string', isOptional: true }
      ]
    },
    {
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'color_hex', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }
      ]
    },
    {
      name: 'budgets',
      columns: [
        { name: 'category_id', type: 'string' },
        { name: 'monthly_limit', type: 'number' },
        { name: 'month_year', type: 'string' }
      ]
    }
  ]
};
