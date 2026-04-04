// Mock for @aws-sdk/client-sts
export class STSClient {
  constructor() {}
  send() {
    return Promise.resolve({
      Account: '000000000000',
      Arn: 'arn:aws:iam::000000000000:root',
      UserId: 'AKIAIOSFODNN7EXAMPLE',
      Credentials: {
        AccessKeyId: 'ASIAIOSFODNN7EXAMPLE',
        SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        SessionToken: 'FwoGZXIvYXdzEBAaDEXAMPLE',
        Expiration: '2024-01-01T01:00:00Z',
      },
    });
  }
  destroy() {}
}

export class GetCallerIdentityCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class GetSessionTokenCommand { constructor(i) { if (i) Object.assign(this, i); } }
