const { DynamoDBClient, CreateTableCommand, ListTablesCommand,
        DescribeTableCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand,
        QueryCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { BASE_CONFIG } = require('./setup');

const client = new DynamoDBClient(BASE_CONFIG);
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = `test-table-${Date.now()}`;

describe('DynamoDB Integration', () => {
  beforeAll(async () => {
    await client.send(new CreateTableCommand({
      TableName: TABLE,
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    // Brief pause for table to become ACTIVE
    await new Promise(r => setTimeout(r, 500));
  });

  afterAll(async () => {
    try { await client.send(new DeleteTableCommand({ TableName: TABLE })); } catch {}
  });

  test('table appears in ListTables', async () => {
    const res = await client.send(new ListTablesCommand({}));
    expect(res.TableNames).toContain(TABLE);
  });

  test('table status is ACTIVE', async () => {
    const res = await client.send(new DescribeTableCommand({ TableName: TABLE }));
    expect(res.Table.TableStatus).toBe('ACTIVE');
  });

  test('table uses PAY_PER_REQUEST billing', async () => {
    const res = await client.send(new DescribeTableCommand({ TableName: TABLE }));
    expect(res.Table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('puts an item', async () => {
    const res = await docClient.send(new PutCommand({
      TableName: TABLE,
      Item: { id: 'user-1', name: 'Alice', email: 'alice@example.com', age: 30 },
    }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  test('puts multiple items', async () => {
    const items = [
      { id: 'user-2', name: 'Bob', email: 'bob@example.com', age: 25 },
      { id: 'user-3', name: 'Carol', email: 'carol@example.com', age: 35 },
    ];
    for (const item of items) {
      await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    }
  });

  test('gets an item by key', async () => {
    const res = await docClient.send(new GetCommand({
      TableName: TABLE,
      Key: { id: 'user-1' },
    }));
    expect(res.Item).toMatchObject({ id: 'user-1', name: 'Alice', email: 'alice@example.com' });
  });

  test('gets non-existent item returns undefined', async () => {
    const res = await docClient.send(new GetCommand({
      TableName: TABLE,
      Key: { id: 'no-such-user' },
    }));
    expect(res.Item).toBeUndefined();
  });

  test('scan returns all items', async () => {
    const res = await docClient.send(new ScanCommand({ TableName: TABLE }));
    expect(res.Count).toBeGreaterThanOrEqual(3);
    const ids = res.Items.map(i => i.id);
    expect(ids).toContain('user-1');
    expect(ids).toContain('user-2');
    expect(ids).toContain('user-3');
  });

  test('scan with filter expression', async () => {
    const res = await docClient.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'age > :minAge',
      ExpressionAttributeValues: { ':minAge': 28 },
    }));
    res.Items.forEach(item => {
      expect(item.age).toBeGreaterThan(28);
    });
  });

  test('deletes an item', async () => {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id: 'user-3' } }));
    const res = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id: 'user-3' } }));
    expect(res.Item).toBeUndefined();
  });
});
