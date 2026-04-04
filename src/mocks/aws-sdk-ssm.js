// Mock for @aws-sdk/client-ssm
export class SSMClient {
  constructor() {}
  send() {
    return Promise.resolve({
      Parameters: [
        {
          Name: '/myapp/db/password',
          Type: 'SecureString',
          Description: 'Database password',
          Version: 1,
          LastModifiedDate: '2024-01-01T00:00:00Z',
        },
      ],
      Parameter: { Value: 'secret-value' },
    });
  }
  destroy() {}
}

export class DescribeParametersCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class PutParameterCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteParameterCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class GetParameterCommand { constructor(i) { if (i) Object.assign(this, i); } }
