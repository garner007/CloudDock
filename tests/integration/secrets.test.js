const {
  SecretsManagerClient, CreateSecretCommand, ListSecretsCommand,
  GetSecretValueCommand, UpdateSecretCommand, DeleteSecretCommand,
} = require('@aws-sdk/client-secrets-manager');
const { BASE_CONFIG } = require('./setup');

const client = new SecretsManagerClient(BASE_CONFIG);
const SECRET_NAME = `test/integration/secret-${Date.now()}`;

describe('Secrets Manager Integration', () => {
  afterAll(async () => {
    try {
      await client.send(new DeleteSecretCommand({
        SecretId: SECRET_NAME,
        ForceDeleteWithoutRecovery: true,
      }));
    } catch {}
  });

  test('creates a plain string secret', async () => {
    const res = await client.send(new CreateSecretCommand({
      Name: SECRET_NAME,
      SecretString: 'my-super-secret-value',
      Description: 'Integration test secret',
    }));
    expect(res.Name).toBe(SECRET_NAME);
    expect(res.ARN).toBeDefined();
  });

  test('secret appears in ListSecrets', async () => {
    const res = await client.send(new ListSecretsCommand({}));
    const names = (res.SecretList || []).map(s => s.Name);
    expect(names).toContain(SECRET_NAME);
  });

  test('retrieves the secret value', async () => {
    const res = await client.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
    expect(res.SecretString).toBe('my-super-secret-value');
  });

  test('creates a JSON secret', async () => {
    const jsonName = `${SECRET_NAME}-json`;
    const payload = { username: 'admin', password: 'p@ssw0rd', host: 'db.local' };
    await client.send(new CreateSecretCommand({
      Name: jsonName,
      SecretString: JSON.stringify(payload),
    }));
    const res = await client.send(new GetSecretValueCommand({ SecretId: jsonName }));
    const retrieved = JSON.parse(res.SecretString);
    expect(retrieved).toMatchObject(payload);
    // Cleanup
    await client.send(new DeleteSecretCommand({ SecretId: jsonName, ForceDeleteWithoutRecovery: true }));
  });

  test('updates a secret value', async () => {
    await client.send(new UpdateSecretCommand({
      SecretId: SECRET_NAME,
      SecretString: 'updated-secret-value',
    }));
    const res = await client.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
    expect(res.SecretString).toBe('updated-secret-value');
  });
});
