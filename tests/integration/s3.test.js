const { S3Client, CreateBucketCommand, ListBucketsCommand,
        PutObjectCommand, GetObjectCommand, ListObjectsV2Command,
        DeleteObjectCommand, DeleteBucketCommand } = require('@aws-sdk/client-s3');
const { BASE_CONFIG } = require('./setup');

const client = new S3Client(BASE_CONFIG);
const BUCKET = `test-integration-${Date.now()}`;

describe('S3 Integration', () => {
  afterAll(async () => {
    // Clean up: delete all objects then delete the bucket
    try {
      const list = await client.send(new ListObjectsV2Command({ Bucket: BUCKET }));
      for (const obj of (list.Contents || [])) {
        await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key }));
      }
      await client.send(new DeleteBucketCommand({ Bucket: BUCKET }));
    } catch {}
  });

  test('creates a bucket', async () => {
    const res = await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  test('lists buckets and finds the new one', async () => {
    const res = await client.send(new ListBucketsCommand({}));
    const names = (res.Buckets || []).map(b => b.Name);
    expect(names).toContain(BUCKET);
  });

  test('uploads an object', async () => {
    const res = await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'hello.txt',
      Body: Buffer.from('Hello, LocalStack!'),
      ContentType: 'text/plain',
    }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  test('uploads a JSON object', async () => {
    const res = await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'data/test.json',
      Body: Buffer.from(JSON.stringify({ integration: true, timestamp: Date.now() })),
      ContentType: 'application/json',
    }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  test('lists objects in the bucket', async () => {
    const res = await client.send(new ListObjectsV2Command({ Bucket: BUCKET }));
    const keys = (res.Contents || []).map(o => o.Key);
    expect(keys).toContain('hello.txt');
    expect(keys).toContain('data/test.json');
  });

  test('lists objects with prefix filter', async () => {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'data/',
      Delimiter: '/',
    }));
    const keys = (res.Contents || []).map(o => o.Key);
    expect(keys).toContain('data/test.json');
    expect(keys).not.toContain('hello.txt');
  });

  test('gets an object and verifies content', async () => {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: 'hello.txt' }));
    const body = await res.Body.transformToString();
    expect(body).toBe('Hello, LocalStack!');
  });

  test('deletes an object', async () => {
    const res = await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: 'hello.txt' }));
    expect(res.$metadata.httpStatusCode).toBe(204);
  });

  test('object no longer appears after deletion', async () => {
    const res = await client.send(new ListObjectsV2Command({ Bucket: BUCKET }));
    const keys = (res.Contents || []).map(o => o.Key);
    expect(keys).not.toContain('hello.txt');
  });
});
