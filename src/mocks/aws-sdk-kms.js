// Mock for @aws-sdk/client-kms
export class KMSClient {
  constructor() {}
  send() {
    return Promise.resolve({
      Keys: [
        { KeyId: 'abcd1234-5678-90ab-cdef-1234567890ab', KeyArn: 'arn:aws:kms:us-east-1:000000000000:key/abcd1234' },
      ],
      KeyMetadata: {
        KeyId: 'abcd1234-5678-90ab-cdef-1234567890ab',
        KeyState: 'Enabled',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
        Description: 'Test key',
        CreationDate: '2024-01-01T00:00:00Z',
      },
    });
  }
  destroy() {}
}

export class ListKeysCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DescribeKeyCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class CreateKeyCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class ScheduleKeyDeletionCommand { constructor(i) { if (i) Object.assign(this, i); } }
