const {
  IAMClient, CreateUserCommand, ListUsersCommand,
  GetUserCommand, DeleteUserCommand,
  CreateRoleCommand, ListRolesCommand, DeleteRoleCommand,
} = require('@aws-sdk/client-iam');
const { BASE_CONFIG } = require('./setup');

const client = new IAMClient(BASE_CONFIG);
const USERNAME = `test-user-${Date.now()}`;
const ROLENAME = `test-role-${Date.now()}`;

const ASSUME_ROLE_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Effect: 'Allow',
    Principal: { Service: 'lambda.amazonaws.com' },
    Action: 'sts:AssumeRole',
  }],
});

describe('IAM Integration', () => {
  afterAll(async () => {
    try { await client.send(new DeleteUserCommand({ UserName: USERNAME })); } catch {}
    try { await client.send(new DeleteRoleCommand({ RoleName: ROLENAME })); } catch {}
  });

  test('creates a user', async () => {
    const res = await client.send(new CreateUserCommand({ UserName: USERNAME }));
    expect(res.User.UserName).toBe(USERNAME);
    expect(res.User.UserId).toBeDefined();
    expect(res.User.Arn).toContain(USERNAME);
  });

  test('user appears in ListUsers', async () => {
    const res = await client.send(new ListUsersCommand({}));
    const names = (res.Users || []).map(u => u.UserName);
    expect(names).toContain(USERNAME);
  });

  test('gets user by name', async () => {
    const res = await client.send(new GetUserCommand({ UserName: USERNAME }));
    expect(res.User.UserName).toBe(USERNAME);
  });

  test('creates a role with trust policy', async () => {
    const res = await client.send(new CreateRoleCommand({
      RoleName: ROLENAME,
      AssumeRolePolicyDocument: ASSUME_ROLE_POLICY,
      Description: 'Integration test role',
    }));
    expect(res.Role.RoleName).toBe(ROLENAME);
    expect(res.Role.RoleId).toBeDefined();
  });

  test('role appears in ListRoles', async () => {
    const res = await client.send(new ListRolesCommand({}));
    const names = (res.Roles || []).map(r => r.RoleName);
    expect(names).toContain(ROLENAME);
  });

  test('deletes user', async () => {
    await client.send(new DeleteUserCommand({ UserName: USERNAME }));
    const res = await client.send(new ListUsersCommand({}));
    const names = (res.Users || []).map(u => u.UserName);
    expect(names).not.toContain(USERNAME);
  });
});
