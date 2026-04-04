/**
 * MSW (Mock Service Worker) handlers
 * Intercepts all AWS SDK HTTP calls at the network level.
 * These handlers simulate LocalStack responses so unit tests run fully offline.
 */
import { rest } from 'msw';

const ENDPOINT = 'http://localhost:4566';

// ── Health ─────────────────────────────────────────────────────────────────────
const healthHandler = rest.get(`${ENDPOINT}/_localstack/health`, (req, res, ctx) =>
  res(ctx.json({
    services: {
      s3: 'running', dynamodb: 'running', lambda: 'running',
      sqs: 'running', sns: 'running', iam: 'running',
      cloudformation: 'running', secretsmanager: 'running',
      cloudwatch: 'running', cognito: 'running',
      kinesis: 'running', ssm: 'running',
    },
    version: '3.0.0',
  }))
);

// ── S3 ─────────────────────────────────────────────────────────────────────────
const s3Handlers = [
  // List buckets
  rest.get(ENDPOINT + '/', (req, res, ctx) =>
    res(ctx.xml(`<?xml version="1.0"?>
      <ListAllMyBucketsResult>
        <Buckets>
          <Bucket><Name>my-test-bucket</Name><CreationDate>2024-01-01T00:00:00Z</CreationDate></Bucket>
          <Bucket><Name>another-bucket</Name><CreationDate>2024-01-02T00:00:00Z</CreationDate></Bucket>
        </Buckets>
      </ListAllMyBucketsResult>`))
  ),
  // List objects in bucket
  rest.get(`${ENDPOINT}/:bucket`, (req, res, ctx) =>
    res(ctx.xml(`<?xml version="1.0"?>
      <ListBucketResult>
        <Name>${req.params.bucket}</Name>
        <Contents>
          <Key>hello.txt</Key><Size>12</Size><LastModified>2024-01-01T00:00:00Z</LastModified>
          <StorageClass>STANDARD</StorageClass>
        </Contents>
        <Contents>
          <Key>data/sample.json</Key><Size>256</Size><LastModified>2024-01-02T00:00:00Z</LastModified>
          <StorageClass>STANDARD</StorageClass>
        </Contents>
      </ListBucketResult>`))
  ),
  // Create bucket
  rest.put(`${ENDPOINT}/:bucket`, (req, res, ctx) => res(ctx.status(200))),
  // Delete bucket
  rest.delete(`${ENDPOINT}/:bucket`, (req, res, ctx) => res(ctx.status(204))),
];

// ── DynamoDB ───────────────────────────────────────────────────────────────────
const dynamoHandlers = [
  rest.post(ENDPOINT + '/', (req, res, ctx) => {
    const target = req.headers.get('x-amz-target') || '';

    if (target.includes('ListTables')) {
      return res(ctx.json({ TableNames: ['users', 'products', 'orders'] }));
    }
    if (target.includes('DescribeTable')) {
      return res(ctx.json({
        Table: {
          TableName: 'users',
          TableStatus: 'ACTIVE',
          ItemCount: 42,
          TableSizeBytes: 4096,
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
        },
      }));
    }
    if (target.includes('CreateTable')) {
      return res(ctx.json({
        TableDescription: { TableName: 'new-table', TableStatus: 'CREATING' },
      }));
    }
    if (target.includes('DeleteTable')) {
      return res(ctx.json({ TableDescription: { TableStatus: 'DELETING' } }));
    }
    if (target.includes('Scan')) {
      return res(ctx.json({
        Items: [
          { id: { S: 'user-1' }, name: { S: 'Alice' }, email: { S: 'alice@example.com' } },
          { id: { S: 'user-2' }, name: { S: 'Bob' }, email: { S: 'bob@example.com' } },
        ],
        Count: 2,
      }));
    }
    return res(ctx.json({}));
  }),
];

// ── SQS ────────────────────────────────────────────────────────────────────────
const sqsHandlers = [
  rest.post(ENDPOINT + '/', (req, res, ctx) => {
    const body = req.body?.toString() || '';
    if (body.includes('Action=ListQueues')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ListQueuesResponse>
          <ListQueuesResult>
            <QueueUrl>${ENDPOINT}/000000000000/my-queue</QueueUrl>
            <QueueUrl>${ENDPOINT}/000000000000/my-fifo-queue.fifo</QueueUrl>
          </ListQueuesResult>
        </ListQueuesResponse>`));
    }
    if (body.includes('Action=GetQueueAttributes')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <GetQueueAttributesResponse>
          <GetQueueAttributesResult>
            <Attribute><Name>ApproximateNumberOfMessages</Name><Value>5</Value></Attribute>
            <Attribute><Name>ApproximateNumberOfMessagesNotVisible</Name><Value>0</Value></Attribute>
            <Attribute><Name>ApproximateNumberOfMessagesDelayed</Name><Value>0</Value></Attribute>
          </GetQueueAttributesResult>
        </GetQueueAttributesResponse>`));
    }
    if (body.includes('Action=CreateQueue')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <CreateQueueResponse>
          <CreateQueueResult>
            <QueueUrl>${ENDPOINT}/000000000000/new-queue</QueueUrl>
          </CreateQueueResult>
        </CreateQueueResponse>`));
    }
    if (body.includes('Action=SendMessage')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <SendMessageResponse>
          <SendMessageResult>
            <MessageId>test-message-id-123</MessageId>
            <MD5OfMessageBody>abc123</MD5OfMessageBody>
          </SendMessageResult>
        </SendMessageResponse>`));
    }
    if (body.includes('Action=ReceiveMessage')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ReceiveMessageResponse>
          <ReceiveMessageResult>
            <Message>
              <MessageId>msg-001</MessageId>
              <ReceiptHandle>receipt-001</ReceiptHandle>
              <Body>{"hello":"world"}</Body>
              <Attribute><Name>SentTimestamp</Name><Value>1704067200000</Value></Attribute>
            </Message>
          </ReceiveMessageResult>
        </ReceiveMessageResponse>`));
    }
    return res(ctx.xml('<Response></Response>'));
  }),
];

// ── Lambda ─────────────────────────────────────────────────────────────────────
const lambdaHandlers = [
  rest.get(`${ENDPOINT}/2015-03-31/functions`, (req, res, ctx) =>
    res(ctx.json({
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
    }))
  ),
  rest.post(`${ENDPOINT}/2015-03-31/functions/:name/invocations`, (req, res, ctx) =>
    res(
      ctx.set('X-Amz-Log-Result', btoa('START RequestId: abc\nEND RequestId: abc\nREPORT Duration: 12.3 ms\n')),
      ctx.json({ statusCode: 200, body: '"Hello from Lambda!"' })
    )
  ),
  rest.delete(`${ENDPOINT}/2015-03-31/functions/:name`, (req, res, ctx) =>
    res(ctx.status(204))
  ),
];

// ── SNS ─────────────────────────────────────────────────────────────────────────
const snsHandlers = [
  rest.post(`${ENDPOINT}/`, (req, res, ctx) => {
    const body = req.body?.toString() || '';
    if (body.includes('Action=ListTopics')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ListTopicsResponse>
          <ListTopicsResult>
            <Topics>
              <member><TopicArn>arn:aws:sns:us-east-1:000000000000:my-topic</TopicArn></member>
              <member><TopicArn>arn:aws:sns:us-east-1:000000000000:alerts</TopicArn></member>
            </Topics>
          </ListTopicsResult>
        </ListTopicsResponse>`));
    }
    if (body.includes('Action=CreateTopic')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <CreateTopicResponse>
          <CreateTopicResult>
            <TopicArn>arn:aws:sns:us-east-1:000000000000:new-topic</TopicArn>
          </CreateTopicResult>
        </CreateTopicResponse>`));
    }
    if (body.includes('Action=Publish')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <PublishResponse>
          <PublishResult><MessageId>pub-msg-id-001</MessageId></PublishResult>
        </PublishResponse>`));
    }
    if (body.includes('Action=ListSubscriptionsByTopic')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ListSubscriptionsByTopicResponse>
          <ListSubscriptionsByTopicResult><Subscriptions/></ListSubscriptionsByTopicResult>
        </ListSubscriptionsByTopicResponse>`));
    }
    return res(ctx.xml('<Response></Response>'));
  }),
];

// ── IAM ─────────────────────────────────────────────────────────────────────────
const iamHandlers = [
  rest.post(`${ENDPOINT}/`, (req, res, ctx) => {
    const body = req.body?.toString() || '';
    if (body.includes('Action=ListUsers')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ListUsersResponse>
          <ListUsersResult>
            <Users>
              <member>
                <UserId>AIDAAAAAAAAAAAAAAAAAA</UserId>
                <UserName>admin</UserName>
                <Arn>arn:aws:iam::000000000000:user/admin</Arn>
                <CreateDate>2024-01-01T00:00:00Z</CreateDate>
              </member>
            </Users>
          </ListUsersResult>
        </ListUsersResponse>`));
    }
    if (body.includes('Action=ListRoles')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ListRolesResponse>
          <ListRolesResult>
            <Roles>
              <member>
                <RoleId>AROAAAAAAAAAAAAAAAAAA</RoleId>
                <RoleName>lambda-execution-role</RoleName>
                <Arn>arn:aws:iam::000000000000:role/lambda-execution-role</Arn>
                <CreateDate>2024-01-01T00:00:00Z</CreateDate>
              </member>
            </Roles>
          </ListRolesResult>
        </ListRolesResponse>`));
    }
    if (body.includes('Action=ListPolicies')) {
      return res(ctx.xml(`<?xml version="1.0"?>
        <ListPoliciesResponse><ListPoliciesResult><Policies/></ListPoliciesResult></ListPoliciesResponse>`));
    }
    return res(ctx.xml('<Response></Response>'));
  }),
];

export const handlers = [
  healthHandler,
  ...s3Handlers,
  ...dynamoHandlers,
  ...sqsHandlers,
  ...lambdaHandlers,
  ...snsHandlers,
  ...iamHandlers,
];
