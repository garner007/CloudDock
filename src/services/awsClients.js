/**
 * awsClients.js — AWS SDK v3 client factory for LocalStack
 *
 * Uses getCredentialSync() for now (sync build config).
 * All clients point to the configured LocalStack endpoint.
 */
import { getCredentialSync } from './credentials';

export function getConfig(overrides = {}) {
  return {
    endpoint:       getCredentialSync('ls_endpoint'),
    region:         getCredentialSync('ls_region'),
    credentials: {
      accessKeyId:     getCredentialSync('ls_access_key'),
      secretAccessKey: getCredentialSync('ls_secret_key'),
    },
    forcePathStyle: true,
    ...overrides,
  };
}

// Lazy client cache — keyed by service + config hash
let _clients = {};

function configHash() {
  const c = getConfig();
  return `${c.endpoint}|${c.region}|${c.credentials.accessKeyId}`;
}

export function clearClientCache() { _clients = {}; }

async function getClient(importFn) {
  const key = importFn.toString().slice(0, 40) + configHash();
  if (!_clients[key]) {
    const Cls = await importFn();
    _clients[key] = new Cls(getConfig());
  }
  return _clients[key];
}

export const getS3Client       = () => getClient(async () => { const { S3Client }                    = await import('@aws-sdk/client-s3');                    return S3Client; });
export const getDynamoClient   = () => getClient(async () => { const { DynamoDBClient }              = await import('@aws-sdk/client-dynamodb');              return DynamoDBClient; });
export const getSQSClient      = () => getClient(async () => { const { SQSClient }                   = await import('@aws-sdk/client-sqs');                   return SQSClient; });
export const getLambdaClient   = () => getClient(async () => { const { LambdaClient }                = await import('@aws-sdk/client-lambda');                return LambdaClient; });
export const getSNSClient      = () => getClient(async () => { const { SNSClient }                   = await import('@aws-sdk/client-sns');                   return SNSClient; });
export const getIAMClient      = () => getClient(async () => { const { IAMClient }                   = await import('@aws-sdk/client-iam');                   return IAMClient; });
export const getCFNClient      = () => getClient(async () => { const { CloudFormationClient }        = await import('@aws-sdk/client-cloudformation');        return CloudFormationClient; });
export const getSecretsClient  = () => getClient(async () => { const { SecretsManagerClient }        = await import('@aws-sdk/client-secrets-manager');       return SecretsManagerClient; });
