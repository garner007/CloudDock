/**
 * backends.js — Multi-backend support registry
 *
 * Defines every supported AWS emulator backend, how to detect it,
 * and which services each one supports.
 *
 * Detection strategy:
 *   1. Try /_localstack/health on the configured endpoint
 *   2. Fingerprint the response JSON to identify the backend
 *   3. Fall back to a probe-only check for Moto (no health endpoint)
 */

// ── Backend definitions ────────────────────────────────────────────────────────

export const BACKENDS = {
  localstack: {
    id:          'localstack',
    name:        'LocalStack',
    description: 'Full-featured AWS emulator. Requires auth token for paid plan.',
    logo:        '🟠',
    defaultPort: 4566,
    defaultEndpoint: 'http://localhost:4566',
    docsUrl:     'https://docs.localstack.cloud',
    dockerCmd:   'docker run -p 4566:4566 -e LOCALSTACK_AUTH_TOKEN=<token> localstack/localstack',
    healthPath:  '/_localstack/health',
    hasPaidTier: true,
    color:       '#FF9900',
  },
  floci: {
    id:          'floci',
    name:        'Floci',
    description: 'Free, MIT-licensed. Starts in 24ms. 25 services. No auth required.',
    logo:        '🌊',
    defaultPort: 4566,
    defaultEndpoint: 'http://localhost:4566',
    docsUrl:     'https://hectorvent.dev/floci',
    dockerCmd:   'docker run --rm -p 4566:4566 hectorvent/floci:latest',
    healthPath:  '/_localstack/health',
    hasPaidTier: false,
    color:       '#00b4d8',
  },
  ministack: {
    id:          'ministack',
    name:        'MiniStack',
    description: 'Free, MIT-licensed. Real containers for RDS/ElastiCache. 34 services.',
    logo:        '🔮',
    defaultPort: 4566,
    defaultEndpoint: 'http://localhost:4566',
    docsUrl:     'https://ministack.org',
    dockerCmd:   'docker run -p 4566:4566 nahuelnucera/ministack',
    healthPath:  '/_localstack/health',
    hasPaidTier: false,
    color:       '#7b2d8b',
  },
  moto: {
    id:          'moto',
    name:        'Moto',
    description: 'In-memory mock. Best for unit testing. No persistence between restarts.',
    logo:        '🐍',
    defaultPort: 5000,
    defaultEndpoint: 'http://localhost:5000',
    docsUrl:     'https://docs.getmoto.org/en/latest/docs/server_mode.html',
    dockerCmd:   'docker run --rm -p 5000:5000 motoserver/moto:latest',
    healthPath:  null,  // Moto has no health endpoint
    hasPaidTier: false,
    color:       '#3572A5',
  },
};

export const BACKEND_LIST = Object.values(BACKENDS);

// ── Service support per backend ────────────────────────────────────────────────
// Maps service IDs to the backends that support them.
// Based on official docs and research as of April 2026.

export const SERVICE_BACKEND_SUPPORT = {
  // ── Storage ────────────────────────────────────────────────────────────────
  's3':               ['localstack', 'floci', 'ministack', 'moto'],
  's3tables':         ['localstack'],
  'dynamodb':         ['localstack', 'floci', 'ministack', 'moto'],
  'dynamodbstreams':  ['localstack', 'floci', 'ministack', 'moto'],
  'elasticache':      ['localstack', 'floci', 'ministack'],
  'memorydb':         ['localstack'],
  'rds':              ['localstack', 'floci', 'ministack', 'moto'],
  'docdb':            ['localstack', 'moto'],
  'neptune':          ['localstack', 'ministack', 'moto'],
  'redshift':         ['localstack', 'ministack', 'moto'],
  'efs':              ['localstack'],
  'glacier':          ['localstack', 'moto'],
  'backup':           ['localstack', 'ministack'],
  'dms':              ['localstack'],

  // ── Compute ────────────────────────────────────────────────────────────────
  'lambda':                   ['localstack', 'floci', 'ministack', 'moto'],
  'ec2':                      ['localstack', 'ministack', 'moto'],
  'ecs':                      ['localstack', 'ministack', 'moto'],
  'eks':                      ['localstack'],
  'ecr':                      ['localstack', 'ministack', 'moto'],
  'elasticbeanstalk':         ['localstack', 'moto'],
  'batch':                    ['localstack', 'moto'],
  'emr':                      ['localstack', 'moto'],
  'sagemaker':                ['localstack', 'moto'],
  'bedrock':                  ['localstack'],
  'autoscaling':              ['localstack', 'moto'],
  'application-autoscaling':  ['localstack', 'moto'],
  'elb':                      ['localstack', 'moto'],
  'serverlessrepo':           ['localstack', 'moto'],

  // ── Messaging ──────────────────────────────────────────────────────────────
  'sqs':                  ['localstack', 'floci', 'ministack', 'moto'],
  'sns':                  ['localstack', 'floci', 'ministack', 'moto'],
  'kinesis':              ['localstack', 'floci', 'ministack', 'moto'],
  'firehose':             ['localstack', 'ministack', 'moto'],
  'eventbridge':          ['localstack', 'floci', 'ministack', 'moto'],
  'eventbridge-pipes':    ['localstack'],
  'eventbridge-scheduler':['localstack'],
  'ses':                  ['localstack', 'floci', 'ministack', 'moto'],
  'msk':                  ['localstack'],
  'mq':                   ['localstack', 'moto'],
  'kinesis-analytics':    ['localstack'],
  'mwaa':                 ['localstack'],
  'iot':                  ['localstack', 'moto'],
  'pinpoint':             ['localstack', 'moto'],
  'swf':                  ['localstack', 'moto'],

  // ── Networking ─────────────────────────────────────────────────────────────
  'apigateway':     ['localstack', 'floci', 'ministack', 'moto'],
  'route53':        ['localstack', 'ministack', 'moto'],
  'route53resolver':['localstack', 'moto'],
  'cloudfront':     ['localstack', 'moto'],
  'acm':            ['localstack', 'floci', 'ministack', 'moto'],
  'acm-pca':        ['localstack', 'moto'],
  'appsync':        ['localstack', 'moto'],
  'waf':            ['localstack', 'moto'],
  'shield':         ['localstack', 'moto'],
  'transfer':       ['localstack', 'moto'],
  'servicediscovery':['localstack', 'moto'],
  'mediaconvert':   ['localstack'],

  // ── Security ───────────────────────────────────────────────────────────────
  'iam':                ['localstack', 'floci', 'ministack', 'moto'],
  'cognito':            ['localstack', 'floci', 'ministack', 'moto'],
  'secrets':            ['localstack', 'floci', 'ministack', 'moto'],
  'kms':                ['localstack', 'floci', 'ministack', 'moto'],
  'sts':                ['localstack', 'floci', 'ministack', 'moto'],
  'organizations':      ['localstack', 'moto'],
  'account':            ['localstack', 'moto'],
  'identitystore':      ['localstack'],
  'sso-admin':          ['localstack'],
  'verifiedpermissions':['localstack'],
  'ram':                ['localstack', 'moto'],

  // ── Management ─────────────────────────────────────────────────────────────
  'cloudwatch':             ['localstack', 'floci', 'ministack', 'moto'],
  'cloudformation':         ['localstack', 'floci', 'ministack', 'moto'],
  'ssm':                    ['localstack', 'floci', 'ministack', 'moto'],
  'stepfunctions':          ['localstack', 'floci', 'ministack', 'moto'],
  'appconfig':              ['localstack', 'moto'],
  'cloudtrail':             ['localstack', 'ministack', 'moto'],
  'config':                 ['localstack', 'moto'],
  'cloudcontrol':           ['localstack'],
  'codecommit':             ['localstack', 'moto'],
  'codebuild':              ['localstack', 'moto'],
  'codepipeline':           ['localstack', 'moto'],
  'codedeploy':             ['localstack', 'moto'],
  'codeartifact':           ['localstack', 'moto'],
  'codeconnections':        ['localstack'],
  'xray':                   ['localstack', 'moto'],
  'fis':                    ['localstack'],
  'resource-groups':        ['localstack', 'moto'],
  'resource-groups-tagging':['localstack', 'moto'],
  'support':                ['localstack', 'moto'],
  'ce':                     ['localstack', 'moto'],
  'amplify':                ['localstack', 'moto'],

  // ── Analytics ──────────────────────────────────────────────────────────────
  'athena':             ['localstack', 'ministack', 'moto'],
  'glue':               ['localstack', 'ministack', 'moto'],
  'lakeformation':      ['localstack', 'moto'],
  'opensearch':         ['localstack', 'floci', 'moto'],
  'timestream':         ['localstack', 'ministack', 'moto'],
  'qldb':               ['localstack', 'ministack', 'moto'],
  'managedblockchain':  ['localstack', 'moto'],
  'textract':           ['localstack', 'moto'],
  'transcribe':         ['localstack', 'moto'],
};

/**
 * Returns true if a service is supported by a given backend.
 */
export function isServiceSupported(serviceId, backendId) {
  const supported = SERVICE_BACKEND_SUPPORT[serviceId];
  if (!supported) return false;
  return supported.includes(backendId);
}

// ── Backend detection ──────────────────────────────────────────────────────────

/**
 * Fingerprint the health response to identify which backend is running.
 * Returns a backend ID string, or 'unknown'.
 */
export function detectBackendFromHealth(data, responseHeaders) {
  if (!data) return 'unknown';

  const version  = (data.version  || '').toLowerCase();
  const platform = (data.platform || '').toLowerCase();
  const serverHeader = (responseHeaders?.get?.('server') || '').toLowerCase();

  // LocalStack — has version field containing "localstack" or specific version format
  if (version.includes('localstack') || version.match(/^\d{4}\.\d{2}\.\d+/)) {
    return 'localstack';
  }

  // MiniStack — includes "ministack" in version or platform
  if (version.includes('ministack') || platform.includes('ministack')) {
    return 'ministack';
  }

  // Floci — Java/Quarkus server, check server header or floci marker
  if (serverHeader.includes('floci') || serverHeader.includes('quarkus') ||
      data.floci !== undefined || platform.includes('floci')) {
    return 'floci';
  }

  // If health responds but we can't fingerprint, check service list shape
  // LocalStack has a nested services object; if that's absent it might be Floci/MiniStack
  if (data.services && typeof data.services === 'object' &&
      Object.keys(data.services).length > 10) {
    return 'localstack'; // LocalStack reports many service statuses
  }

  // Some health response present but minimal — likely Floci or MiniStack
  if (data.status === 'running' || data.status === 'ok') {
    return 'floci'; // Floci is more likely to have minimal health response
  }

  return 'unknown';
}

/**
 * Full health check — returns a normalized health object regardless of backend.
 * @param {string} endpoint  e.g. 'http://localhost:4566'
 * @param {string} backendId e.g. 'localstack'
 */
export async function checkBackendHealth(endpoint, backendId) {
  const backend = BACKENDS[backendId] || BACKENDS.localstack;

  // Moto has no health endpoint — just probe with a simple GET
  if (!backend.healthPath) {
    try {
      const r = await fetch(`${endpoint}/moto-api/state`, {
        signal: AbortSignal.timeout(3000),
      });
      // Moto responds to this endpoint if running
      return {
        status:    'connected',
        backend:   'moto',
        endpoint,
        services:  {},
        version:   'moto',
        edition:   'community',
      };
    } catch {
      // Try a plain GET to root
      try {
        await fetch(endpoint, { signal: AbortSignal.timeout(2000) });
        return { status: 'connected', backend: 'moto', endpoint, services: {}, version: 'moto', edition: 'community' };
      } catch {
        return { status: 'disconnected', backend: 'moto', endpoint };
      }
    }
  }

  // All others have a /_localstack/health-compatible endpoint
  try {
    const r = await fetch(`${endpoint}${backend.healthPath}`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await r.json();
    const detectedBackend = detectBackendFromHealth(data, r.headers);

    return {
      status:   'connected',
      backend:  detectedBackend !== 'unknown' ? detectedBackend : backendId,
      endpoint,
      services: data.services || {},
      version:  data.version || '',
      edition:  resolveEdition(data, detectedBackend),
    };
  } catch {
    return { status: 'disconnected', backend: backendId, endpoint };
  }
}

function resolveEdition(data, backendId) {
  if (backendId === 'localstack') {
    const s = data.services || {};
    const paidServices = ['cognito-idp','cognito','ecs','elasticache','rds','athena','glue','eks'];
    const hasPaid = paidServices.some(k => s[k] === 'running' || s[k] === 'available');
    return hasPaid ? 'pro' : 'community';
  }
  // All other backends are fully free — no edition distinction
  return 'community';
}
