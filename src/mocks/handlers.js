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
    res(ctx.json({
      Buckets: [
        { Name: 'my-test-bucket', CreationDate: '2024-01-01T00:00:00.000Z' },
        { Name: 'another-bucket', CreationDate: '2024-01-02T00:00:00.000Z' },
      ],
    }))
  ),
  // List objects in bucket
  rest.get(`${ENDPOINT}/:bucket`, (req, res, ctx) =>
    res(ctx.json({
      Name: req.params.bucket,
      IsTruncated: false,
      Contents: [
        { Key: 'hello.txt', Size: 12, LastModified: '2024-01-01T00:00:00.000Z', StorageClass: 'STANDARD' },
        { Key: 'data/sample.json', Size: 256, LastModified: '2024-01-02T00:00:00.000Z', StorageClass: 'STANDARD' },
      ],
    }))
  ),
  // Create bucket
  rest.put(`${ENDPOINT}/:bucket`, (req, res, ctx) => res(ctx.status(200))),
  // Delete bucket
  rest.delete(`${ENDPOINT}/:bucket`, (req, res, ctx) => res(ctx.status(204))),
];

// ── DynamoDB ───────────────────────────────────────────────────────────────────
const dynamoHandlers = [];

// ── SQS ────────────────────────────────────────────────────────────────────────
// Queue-specific endpoints for SQS operations on existing queues
const sqsHandlers = [
  rest.post(`${ENDPOINT}/000000000000/my-queue`, (req, res, ctx) => {
    const target = req.headers.get('x-amz-target') || '';
    if (target.includes('ReceiveMessage')) {
      return res(ctx.json({
        Messages: [{
          MessageId: 'msg-001',
          ReceiptHandle: 'receipt-001',
          Body: '{"hello":"world"}',
          Attributes: { SentTimestamp: '1704067200000' },
        }],
      }));
    }
    if (target.includes('SendMessage')) {
      return res(ctx.json({
        MessageId: 'test-message-id-123',
        MD5OfMessageBody: 'abc123',
      }));
    }
    if (target.includes('GetQueueAttributes')) {
      return res(ctx.json({
        Attributes: {
          ApproximateNumberOfMessages: '5',
          ApproximateNumberOfMessagesNotVisible: '0',
          ApproximateNumberOfMessagesDelayed: '0',
        },
      }));
    }
    return res(ctx.json({}));
  }),
  rest.post(`${ENDPOINT}/000000000000/my-fifo-queue.fifo`, (req, res, ctx) => {
    const target = req.headers.get('x-amz-target') || '';
    if (target.includes('GetQueueAttributes')) {
      return res(ctx.json({
        Attributes: {
          ApproximateNumberOfMessages: '3',
          ApproximateNumberOfMessagesNotVisible: '0',
          ApproximateNumberOfMessagesDelayed: '0',
          FifoQueue: 'true',
        },
      }));
    }
    return res(ctx.json({}));
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
const iamHandlers = [];

// ── Unified POST handler ────────────────────────────────────────────────────────
// DynamoDB, SQS, and IAM all POST to the same endpoint.
// We route based on x-amz-target header (DynamoDB, SQS) and body content (IAM query protocol).
const unifiedPostHandler = rest.post(ENDPOINT + '/', (req, res, ctx) => {
  const target = req.headers.get('x-amz-target') || '';
  const contentType = req.headers.get('content-type') || '';
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

  // ── DynamoDB (JSON protocol, x-amz-target: DynamoDB_20120810.*)
  if (target.includes('DynamoDB')) {
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
  }

  // ── SQS (JSON protocol, x-amz-target: AmazonSQS.*)
  if (target.includes('AmazonSQS') || target.includes('SQS')) {
    if (target.includes('ListQueues')) {
      return res(ctx.json({
        QueueUrls: [
          `${ENDPOINT}/000000000000/my-queue`,
          `${ENDPOINT}/000000000000/my-fifo-queue.fifo`,
        ],
      }));
    }
    if (target.includes('CreateQueue')) {
      return res(ctx.json({
        QueueUrl: `${ENDPOINT}/000000000000/new-queue`,
      }));
    }
    if (target.includes('DeleteQueue')) {
      return res(ctx.json({}));
    }
    return res(ctx.json({}));
  }

  // ── IAM (XML query protocol, body contains Action=)
  if (body.includes('Action=ListUsers') || body.includes('Action%3DListUsers')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <ListUsersResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
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
  if (body.includes('Action=ListRoles') || body.includes('Action%3DListRoles')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <ListRolesResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
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
  if (body.includes('Action=ListPolicies') || body.includes('Action%3DListPolicies')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <ListPoliciesResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ListPoliciesResult><Policies/></ListPoliciesResult>
      </ListPoliciesResponse>`));
  }
  if (body.includes('Action=CreateUser') || body.includes('Action%3DCreateUser')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <CreateUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <CreateUserResult><User><UserName>new-user</UserName></User></CreateUserResult>
      </CreateUserResponse>`));
  }
  if (body.includes('Action=DeleteUser') || body.includes('Action%3DDeleteUser')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <DeleteUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ResponseMetadata><RequestId>test</RequestId></ResponseMetadata>
      </DeleteUserResponse>`));
  }
  if (body.includes('Action=DeleteRole') || body.includes('Action%3DDeleteRole')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <DeleteRoleResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ResponseMetadata><RequestId>test</RequestId></ResponseMetadata>
      </DeleteRoleResponse>`));
  }

  // ── STS (XML query protocol)
  if (body.includes('Action=GetCallerIdentity') || body.includes('Action%3DGetCallerIdentity')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <GetCallerIdentityResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
        <GetCallerIdentityResult>
          <Account>000000000000</Account>
          <Arn>arn:aws:iam::000000000000:root</Arn>
          <UserId>AKIAIOSFODNN7EXAMPLE</UserId>
        </GetCallerIdentityResult>
      </GetCallerIdentityResponse>`));
  }
  if (body.includes('Action=GetSessionToken') || body.includes('Action%3DGetSessionToken')) {
    return res(ctx.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <GetSessionTokenResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
        <GetSessionTokenResult>
          <Credentials>
            <AccessKeyId>ASIAIOSFODNN7EXAMPLE</AccessKeyId>
            <SecretAccessKey>wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY</SecretAccessKey>
            <SessionToken>FwoGZXIvYXdzEBAaDEXAMPLE</SessionToken>
            <Expiration>2024-01-01T01:00:00Z</Expiration>
          </Credentials>
        </GetSessionTokenResult>
      </GetSessionTokenResponse>`));
  }

  // Fallback — return empty JSON
  return res(ctx.json({}));
});

export const handlers = [
  healthHandler,
  ...s3Handlers,
  ...sqsHandlers,
  ...lambdaHandlers,
  ...snsHandlers,
  unifiedPostHandler,
];
