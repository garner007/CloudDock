const {
  SSMClient, PutParameterCommand, GetParameterCommand,
  DescribeParametersCommand, DeleteParameterCommand,
  GetParametersByPathCommand,
} = require('@aws-sdk/client-ssm');
const { BASE_CONFIG } = require('./setup');

const client = new SSMClient(BASE_CONFIG);
const BASE_PATH = `/integration-test/${Date.now()}`;

describe('SSM Parameter Store Integration', () => {
  afterAll(async () => {
    const names = [
      `${BASE_PATH}/db/password`,
      `${BASE_PATH}/db/host`,
      `${BASE_PATH}/feature-flags`,
    ];
    for (const name of names) {
      try { await client.send(new DeleteParameterCommand({ Name: name })); } catch {}
    }
  });

  test('creates a String parameter', async () => {
    const res = await client.send(new PutParameterCommand({
      Name: `${BASE_PATH}/db/host`,
      Value: 'db.localstack.internal',
      Type: 'String',
      Description: 'Database host',
    }));
    expect(res.Version).toBeGreaterThanOrEqual(1);
  });

  test('creates a SecureString parameter', async () => {
    const res = await client.send(new PutParameterCommand({
      Name: `${BASE_PATH}/db/password`,
      Value: 's3cr3tpassword',
      Type: 'SecureString',
    }));
    expect(res.Version).toBeGreaterThanOrEqual(1);
  });

  test('creates a StringList parameter', async () => {
    const res = await client.send(new PutParameterCommand({
      Name: `${BASE_PATH}/feature-flags`,
      Value: 'dark-mode,beta-ui,analytics',
      Type: 'StringList',
    }));
    expect(res.Version).toBeGreaterThanOrEqual(1);
  });

  test('retrieves a String parameter', async () => {
    const res = await client.send(new GetParameterCommand({
      Name: `${BASE_PATH}/db/host`,
    }));
    expect(res.Parameter.Value).toBe('db.localstack.internal');
    expect(res.Parameter.Type).toBe('String');
  });

  test('retrieves a SecureString with decryption', async () => {
    const res = await client.send(new GetParameterCommand({
      Name: `${BASE_PATH}/db/password`,
      WithDecryption: true,
    }));
    expect(res.Parameter.Value).toBe('s3cr3tpassword');
  });

  test('gets parameters by path', async () => {
    const res = await client.send(new GetParametersByPathCommand({
      Path: `${BASE_PATH}/db`,
      Recursive: true,
      WithDecryption: true,
    }));
    const names = (res.Parameters || []).map(p => p.Name);
    expect(names).toContain(`${BASE_PATH}/db/host`);
    expect(names).toContain(`${BASE_PATH}/db/password`);
  });

  test('overwrites an existing parameter', async () => {
    await client.send(new PutParameterCommand({
      Name: `${BASE_PATH}/db/host`,
      Value: 'new-db.localstack.internal',
      Type: 'String',
      Overwrite: true,
    }));
    const res = await client.send(new GetParameterCommand({
      Name: `${BASE_PATH}/db/host`,
    }));
    expect(res.Parameter.Value).toBe('new-db.localstack.internal');
    expect(res.Parameter.Version).toBeGreaterThanOrEqual(2);
  });

  test('deletes a parameter', async () => {
    await client.send(new DeleteParameterCommand({ Name: `${BASE_PATH}/db/host` }));
    await expect(
      client.send(new GetParameterCommand({ Name: `${BASE_PATH}/db/host` }))
    ).rejects.toThrow(/ParameterNotFound|NotFound/);
  });
});
