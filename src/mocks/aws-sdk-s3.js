// Mock for @aws-sdk/client-s3
export class S3Client {
  constructor() {}
  send() {
    return Promise.resolve({
      Buckets: [
        { Name: 'my-test-bucket', CreationDate: '2024-01-01T00:00:00.000Z' },
        { Name: 'another-bucket', CreationDate: '2024-01-02T00:00:00.000Z' },
      ],
      Contents: [
        { Key: 'hello.txt', Size: 12, LastModified: '2024-01-01T00:00:00.000Z', StorageClass: 'STANDARD' },
        { Key: 'data/sample.json', Size: 256, LastModified: '2024-01-02T00:00:00.000Z', StorageClass: 'STANDARD' },
      ],
      CommonPrefixes: [],
      IsTruncated: false,
    });
  }
  destroy() {}
}

export class ListBucketsCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class ListObjectsV2Command { constructor(i) { if (i) Object.assign(this, i); } }
export class CreateBucketCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteBucketCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteObjectCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class PutObjectCommand { constructor(i) { if (i) Object.assign(this, i); } }
