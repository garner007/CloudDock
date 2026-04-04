/**
 * awsClients.js — AWS SDK v3 client factory for LocalStack
 *
 * Reads connection settings directly from localStorage (matching SettingsContext).
 * All clients point to the configured LocalStack endpoint.
 */

const DEFAULTS = {
  ls_endpoint:   'http://localhost:4566',
  ls_region:     'us-east-1',
  ls_access_key: 'test',
  ls_secret_key: 'test',
};

export function getConfig(overrides = {}) {
  return {
    endpoint:       localStorage.getItem('ls_endpoint')   || DEFAULTS.ls_endpoint,
    region:         localStorage.getItem('ls_region')      || DEFAULTS.ls_region,
    credentials: {
      accessKeyId:     localStorage.getItem('ls_access_key')  || DEFAULTS.ls_access_key,
      secretAccessKey: localStorage.getItem('ls_secret_key')  || DEFAULTS.ls_secret_key,
    },
    forcePathStyle: true,
    ...overrides,
  };
}

// Lazy client cache — keyed by service name + config hash
let _clients = {};

function configHash() {
  const c = getConfig();
  return `${c.endpoint}|${c.region}|${c.credentials.accessKeyId}`;
}

export function clearClientCache() {
  for (const client of Object.values(_clients)) {
    try { if (typeof client.destroy === 'function') client.destroy(); } catch {}
  }
  _clients = {};
}

async function getClient(serviceName, importFn) {
  const key = `${serviceName}:${configHash()}`;
  if (!_clients[key]) {
    const Cls = await importFn();
    _clients[key] = new Cls(getConfig());
  }
  return _clients[key];
}

export const getS3Client       = () => getClient('s3',               async () => { const { S3Client }                    = await import('@aws-sdk/client-s3');                    return S3Client; });
export const getDynamoClient   = () => getClient('dynamodb',         async () => { const { DynamoDBClient }              = await import('@aws-sdk/client-dynamodb');              return DynamoDBClient; });
export const getSQSClient      = () => getClient('sqs',              async () => { const { SQSClient }                   = await import('@aws-sdk/client-sqs');                   return SQSClient; });
export const getLambdaClient   = () => getClient('lambda',           async () => { const { LambdaClient }                = await import('@aws-sdk/client-lambda');                return LambdaClient; });
export const getSNSClient      = () => getClient('sns',              async () => { const { SNSClient }                   = await import('@aws-sdk/client-sns');                   return SNSClient; });
export const getIAMClient      = () => getClient('iam',              async () => { const { IAMClient }                   = await import('@aws-sdk/client-iam');                   return IAMClient; });
export const getCFNClient      = () => getClient('cloudformation',   async () => { const { CloudFormationClient }        = await import('@aws-sdk/client-cloudformation');        return CloudFormationClient; });
export const getSecretsClient  = () => getClient('secrets-manager',  async () => { const { SecretsManagerClient }        = await import('@aws-sdk/client-secrets-manager');       return SecretsManagerClient; });
