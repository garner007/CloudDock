// Mock for @aws-sdk/client-secrets-manager
export class SecretsManagerClient {
  constructor() {}
  send() {
    return Promise.resolve({
      SecretList: [
        {
          Name: 'my-secret',
          ARN: 'arn:aws:secretsmanager:us-east-1:000000000000:secret:my-secret-abc123',
          Description: 'Test secret',
          LastChangedDate: '2024-01-01T00:00:00Z',
          LastAccessedDate: '2024-01-02T00:00:00Z',
        },
      ],
      SecretString: '{"username":"admin","password":"secret"}',
    });
  }
  destroy() {}
}

export class ListSecretsCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class CreateSecretCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class DeleteSecretCommand { constructor(i) { if (i) Object.assign(this, i); } }
export class GetSecretValueCommand { constructor(i) { if (i) Object.assign(this, i); } }
