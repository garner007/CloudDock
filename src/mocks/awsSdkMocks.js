/**
 * AWS SDK v3 mock factories for unit tests.
 *
 * Usage:
 *   jest.mock('@aws-sdk/client-s3', () => require('../../mocks/awsSdkMocks').mockS3());
 */

// Helper: create a mock client class whose `send` dispatches based on command name
function mockClient(handlers) {
  return class MockClient {
    constructor() {}
    send(command) {
      const name = command.constructor?.name || command.__mockName;
      const handler = handlers[name];
      if (handler) return Promise.resolve(handler(command));
      return Promise.resolve({});
    }
    destroy() {}
  };
}

// Helper: create a mock command class
function mockCommand(name) {
  return class {
    static __mockName = name;
    constructor(input) {
      Object.assign(this, input);
      this.__mockName = name;
    }
    get [Symbol.toStringTag]() { return name; }
  };
}

// ── S3 ─────────────────────────────────────────────────────────────────────────
export function mockS3(overrides = {}) {
  const defaults = {
    ListBucketsCommand: () => ({
      Buckets: [
        { Name: 'my-test-bucket', CreationDate: '2024-01-01T00:00:00.000Z' },
        { Name: 'another-bucket', CreationDate: '2024-01-02T00:00:00.000Z' },
      ],
    }),
    ListObjectsV2Command: () => ({
      Contents: [
        { Key: 'hello.txt', Size: 12, LastModified: '2024-01-01T00:00:00.000Z', StorageClass: 'STANDARD' },
        { Key: 'data/sample.json', Size: 256, LastModified: '2024-01-02T00:00:00.000Z', StorageClass: 'STANDARD' },
      ],
      CommonPrefixes: [],
      IsTruncated: false,
    }),
    CreateBucketCommand: () => ({}),
    DeleteBucketCommand: () => ({}),
    DeleteObjectCommand: () => ({}),
    PutObjectCommand: () => ({}),
  };
  const handlers = { ...defaults, ...overrides };
  return {
    S3Client: mockClient(handlers),
    ListBucketsCommand: mockCommand('ListBucketsCommand'),
    ListObjectsV2Command: mockCommand('ListObjectsV2Command'),
    CreateBucketCommand: mockCommand('CreateBucketCommand'),
    DeleteBucketCommand: mockCommand('DeleteBucketCommand'),
    DeleteObjectCommand: mockCommand('DeleteObjectCommand'),
    PutObjectCommand: mockCommand('PutObjectCommand'),
  };
}

// ── DynamoDB ───────────────────────────────────────────────────────────────────
export function mockDynamoDB(overrides = {}) {
  const defaults = {
    ListTablesCommand: () => ({ TableNames: ['users', 'products', 'orders'] }),
    DescribeTableCommand: () => ({
      Table: {
        TableName: 'users',
        TableStatus: 'ACTIVE',
        ItemCount: 42,
        TableSizeBytes: 4096,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      },
    }),
    CreateTableCommand: () => ({
      TableDescription: { TableName: 'new-table', TableStatus: 'CREATING' },
    }),
    DeleteTableCommand: () => ({
      TableDescription: { TableStatus: 'DELETING' },
    }),
    ScanCommand: () => ({
      Items: [
        { id: { S: 'user-1' }, name: { S: 'Alice' }, email: { S: 'alice@example.com' } },
        { id: { S: 'user-2' }, name: { S: 'Bob' }, email: { S: 'bob@example.com' } },
      ],
      Count: 2,
    }),
  };
  const handlers = { ...defaults, ...overrides };
  return {
    DynamoDBClient: mockClient(handlers),
    ListTablesCommand: mockCommand('ListTablesCommand'),
    DescribeTableCommand: mockCommand('DescribeTableCommand'),
    CreateTableCommand: mockCommand('CreateTableCommand'),
    DeleteTableCommand: mockCommand('DeleteTableCommand'),
    ScanCommand: mockCommand('ScanCommand'),
  };
}

export function mockDynamoDBUtil() {
  return {
    unmarshall: (item) => {
      const result = {};
      for (const [key, val] of Object.entries(item)) {
        if (val.S !== undefined) result[key] = val.S;
        else if (val.N !== undefined) result[key] = Number(val.N);
        else if (val.BOOL !== undefined) result[key] = val.BOOL;
        else result[key] = val;
      }
      return result;
    },
  };
}

// ── SQS ────────────────────────────────────────────────────────────────────────
export function mockSQS(overrides = {}) {
  const ENDPOINT = 'http://localhost:4566';
  const defaults = {
    ListQueuesCommand: () => ({
      QueueUrls: [
        `${ENDPOINT}/000000000000/my-queue`,
        `${ENDPOINT}/000000000000/my-fifo-queue.fifo`,
      ],
    }),
    GetQueueAttributesCommand: (cmd) => {
      const url = cmd.QueueUrl || '';
      if (url.includes('fifo')) {
        return {
          Attributes: {
            ApproximateNumberOfMessages: '3',
            ApproximateNumberOfMessagesNotVisible: '0',
            ApproximateNumberOfMessagesDelayed: '0',
            FifoQueue: 'true',
          },
        };
      }
      return {
        Attributes: {
          ApproximateNumberOfMessages: '5',
          ApproximateNumberOfMessagesNotVisible: '0',
          ApproximateNumberOfMessagesDelayed: '0',
        },
      };
    },
    CreateQueueCommand: () => ({
      QueueUrl: `${ENDPOINT}/000000000000/new-queue`,
    }),
    DeleteQueueCommand: () => ({}),
    ReceiveMessageCommand: () => ({
      Messages: [{
        MessageId: 'msg-001',
        ReceiptHandle: 'receipt-001',
        Body: '{"hello":"world"}',
        Attributes: { SentTimestamp: '1704067200000' },
      }],
    }),
    SendMessageCommand: () => ({
      MessageId: 'test-message-id-123',
      MD5OfMessageBody: 'abc123',
    }),
  };
  const handlers = { ...defaults, ...overrides };
  return {
    SQSClient: mockClient(handlers),
    ListQueuesCommand: mockCommand('ListQueuesCommand'),
    GetQueueAttributesCommand: mockCommand('GetQueueAttributesCommand'),
    CreateQueueCommand: mockCommand('CreateQueueCommand'),
    DeleteQueueCommand: mockCommand('DeleteQueueCommand'),
    ReceiveMessageCommand: mockCommand('ReceiveMessageCommand'),
    SendMessageCommand: mockCommand('SendMessageCommand'),
  };
}

// ── Lambda ─────────────────────────────────────────────────────────────────────
export function mockLambda(overrides = {}) {
  const defaults = {
    ListFunctionsCommand: () => ({
      Functions: [
        {
          FunctionName: 'my-function',
          Runtime: 'python3.11',
          Handler: 'handler.lambda_handler',
          MemorySize: 128,
          Timeout: 30,
          FunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:my-function',
          LastModified: '2024-01-01T00:00:00Z',
        },
        {
          FunctionName: 'node-function',
          Runtime: 'nodejs20.x',
          Handler: 'index.handler',
          MemorySize: 256,
          Timeout: 60,
          FunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:node-function',
          LastModified: '2024-01-02T00:00:00Z',
        },
      ],
    }),
    DeleteFunctionCommand: () => ({}),
    InvokeCommand: () => ({
      StatusCode: 200,
      Payload: new TextEncoder().encode(JSON.stringify({ statusCode: 200, body: '"Hello from Lambda!"' })),
      LogResult: btoa('START RequestId: abc\nEND RequestId: abc\nREPORT Duration: 12.3 ms\n'),
    }),
  };
  const handlers = { ...defaults, ...overrides };
  return {
    LambdaClient: mockClient(handlers),
    ListFunctionsCommand: mockCommand('ListFunctionsCommand'),
    DeleteFunctionCommand: mockCommand('DeleteFunctionCommand'),
    InvokeCommand: mockCommand('InvokeCommand'),
  };
}
