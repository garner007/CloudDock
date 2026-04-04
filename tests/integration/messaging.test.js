const { SQSClient, CreateQueueCommand, ListQueuesCommand,
        SendMessageCommand, ReceiveMessageCommand, GetQueueAttributesCommand,
        DeleteQueueCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, CreateTopicCommand, ListTopicsCommand,
        PublishCommand, DeleteTopicCommand } = require('@aws-sdk/client-sns');
const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { BASE_CONFIG } = require('./setup');

const sqsClient = new SQSClient(BASE_CONFIG);
const snsClient = new SNSClient(BASE_CONFIG);
const lambdaClient = new LambdaClient(BASE_CONFIG);

// ── SQS ───────────────────────────────────────────────────────────────────────
describe('SQS Integration', () => {
  let queueUrl;
  const QUEUE_NAME = `test-queue-${Date.now()}`;

  afterAll(async () => {
    if (queueUrl) {
      try { await sqsClient.send(new DeleteQueueCommand({ QueueUrl: queueUrl })); } catch {}
    }
  });

  test('creates a standard queue', async () => {
    const res = await sqsClient.send(new CreateQueueCommand({ QueueName: QUEUE_NAME }));
    queueUrl = res.QueueUrl;
    expect(queueUrl).toContain(QUEUE_NAME);
  });

  test('queue appears in ListQueues', async () => {
    const res = await sqsClient.send(new ListQueuesCommand({}));
    expect(res.QueueUrls || []).toContain(queueUrl);
  });

  test('queue has expected attributes', async () => {
    const res = await sqsClient.send(new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['All'],
    }));
    expect(res.Attributes).toHaveProperty('ApproximateNumberOfMessages');
    expect(res.Attributes.ApproximateNumberOfMessages).toBe('0');
  });

  test('sends a message', async () => {
    const res = await sqsClient.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({ hello: 'world', ts: Date.now() }),
    }));
    expect(res.MessageId).toBeDefined();
    expect(res.MD5OfMessageBody).toBeDefined();
  });

  test('sends multiple messages', async () => {
    for (let i = 0; i < 3; i++) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ index: i }),
      }));
    }
  });

  test('receives messages', async () => {
    const res = await sqsClient.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 0,
    }));
    expect(Array.isArray(res.Messages)).toBe(true);
    expect(res.Messages.length).toBeGreaterThan(0);
  });

  test('received message body is parseable JSON', async () => {
    const res = await sqsClient.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 0,
      VisibilityTimeout: 0,
    }));
    if (res.Messages?.length > 0) {
      const body = JSON.parse(res.Messages[0].Body);
      expect(typeof body).toBe('object');
    }
  });

  test('creates a FIFO queue', async () => {
    const fifoName = `fifo-test-${Date.now()}.fifo`;
    const res = await sqsClient.send(new CreateQueueCommand({
      QueueName: fifoName,
      Attributes: { FifoQueue: 'true', ContentBasedDeduplication: 'true' },
    }));
    expect(res.QueueUrl).toContain('.fifo');
    // Cleanup
    await sqsClient.send(new DeleteQueueCommand({ QueueUrl: res.QueueUrl }));
  });
});

// ── SNS ───────────────────────────────────────────────────────────────────────
describe('SNS Integration', () => {
  let topicArn;
  const TOPIC_NAME = `test-topic-${Date.now()}`;

  afterAll(async () => {
    if (topicArn) {
      try { await snsClient.send(new DeleteTopicCommand({ TopicArn: topicArn })); } catch {}
    }
  });

  test('creates a topic', async () => {
    const res = await snsClient.send(new CreateTopicCommand({ Name: TOPIC_NAME }));
    topicArn = res.TopicArn;
    expect(topicArn).toContain(TOPIC_NAME);
  });

  test('topic appears in ListTopics', async () => {
    const res = await snsClient.send(new ListTopicsCommand({}));
    const arns = (res.Topics || []).map(t => t.TopicArn);
    expect(arns).toContain(topicArn);
  });

  test('publishes a message', async () => {
    const res = await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Message: 'Integration test message',
      Subject: 'Test',
    }));
    expect(res.MessageId).toBeDefined();
  });

  test('publishes a JSON message', async () => {
    const res = await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({ event: 'test', data: { value: 42 } }),
    }));
    expect(res.MessageId).toBeDefined();
  });
});

// ── Lambda ────────────────────────────────────────────────────────────────────
describe('Lambda Integration', () => {
  test('ListFunctions returns an array', async () => {
    const res = await lambdaClient.send(new ListFunctionsCommand({}));
    expect(Array.isArray(res.Functions)).toBe(true);
  });

  test('each function has required fields', async () => {
    const res = await lambdaClient.send(new ListFunctionsCommand({}));
    (res.Functions || []).forEach(fn => {
      expect(fn).toHaveProperty('FunctionName');
      expect(fn).toHaveProperty('FunctionArn');
      expect(fn).toHaveProperty('Runtime');
    });
  });
});
