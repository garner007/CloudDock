// Mock for @aws-sdk/client-dynamodb
export class DynamoDBClient {
  constructor() {}
  send() {
    return Promise.resolve({
      TableNames: ['users', 'products', 'orders'],
      Table: {
        TableName: 'users', TableStatus: 'ACTIVE', ItemCount: 42, TableSizeBytes: 4096,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      },
      Items: [
        { id: { S: 'user-1' }, name: { S: 'Alice' }, email: { S: 'alice@example.com' } },
        { id: { S: 'user-2' }, name: { S: 'Bob' }, email: { S: 'bob@example.com' } },
      ],
      Count: 2,
      TableDescription: { TableName: 'new-table', TableStatus: 'CREATING' },
    });
  }
  destroy() {}
}

export class ListTablesCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DescribeTableCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class CreateTableCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteTableCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class ScanCommand { constructor(i) { if (i) Object.assign(this, i); } }
