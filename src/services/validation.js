/**
 * validation.js — Input validation for AWS resource names and payloads
 *
 * Returns { valid: true } or { valid: false, error: 'Human-readable message' }
 * so pages can show inline errors before hitting the SDK.
 */

/**
 * S3 bucket name — AWS rules:
 * 3–63 chars, lowercase letters, numbers, hyphens.
 * Must start/end with letter or number. No consecutive hyphens.
 */
export function validateBucketName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Bucket name is required.' };
  if (name.length < 3) return { valid: false, error: 'Bucket name must be at least 3 characters.' };
  if (name.length > 63) return { valid: false, error: 'Bucket name must be 63 characters or fewer.' };
  if (!/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/.test(name)) {
    return { valid: false, error: 'Lowercase letters, numbers, and hyphens only. Must start and end with a letter or number.' };
  }
  if (/--/.test(name)) return { valid: false, error: 'Bucket name cannot contain consecutive hyphens.' };
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(name)) {
    return { valid: false, error: 'Bucket name cannot be formatted as an IP address.' };
  }
  return { valid: true };
}

/**
 * DynamoDB table name — 3–255 chars, letters/numbers/underscore/hyphen/dot.
 */
export function validateTableName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Table name is required.' };
  if (name.length < 3) return { valid: false, error: 'Table name must be at least 3 characters.' };
  if (name.length > 255) return { valid: false, error: 'Table name must be 255 characters or fewer.' };
  if (!/^[a-zA-Z0-9_.\-]+$/.test(name)) {
    return { valid: false, error: 'Letters, numbers, underscores, hyphens, and dots only.' };
  }
  return { valid: true };
}

/**
 * SQS queue name — 1–80 chars, letters/numbers/hyphen/underscore.
 * FIFO queues must end in .fifo.
 */
export function validateQueueName(name, fifo = false) {
  if (!name || !name.trim()) return { valid: false, error: 'Queue name is required.' };
  const effective = fifo && !name.endsWith('.fifo') ? name + '.fifo' : name;
  if (effective.length > 80) return { valid: false, error: 'Queue name must be 80 characters or fewer.' };
  if (!/^[a-zA-Z0-9_\-]+(\.fifo)?$/.test(effective)) {
    return { valid: false, error: 'Letters, numbers, hyphens, and underscores only.' };
  }
  return { valid: true };
}

/**
 * SNS topic name — same rules as SQS.
 */
export function validateTopicName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Topic name is required.' };
  if (name.length > 256) return { valid: false, error: 'Topic name must be 256 characters or fewer.' };
  if (!/^[a-zA-Z0-9_\-]+$/.test(name)) {
    return { valid: false, error: 'Letters, numbers, hyphens, and underscores only.' };
  }
  return { valid: true };
}

/**
 * Lambda function name — 1–64 chars, letters/numbers/hyphen/underscore.
 */
export function validateFunctionName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Function name is required.' };
  if (name.length > 64) return { valid: false, error: 'Function name must be 64 characters or fewer.' };
  if (!/^[a-zA-Z0-9_\-]+$/.test(name)) {
    return { valid: false, error: 'Letters, numbers, hyphens, and underscores only.' };
  }
  return { valid: true };
}

/**
 * IAM user/role/policy name — 1–128 chars, letters/numbers/=,.@_-
 */
export function validateIAMName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Name is required.' };
  if (name.length > 128) return { valid: false, error: 'Name must be 128 characters or fewer.' };
  if (!/^[a-zA-Z0-9=,.@_\-]+$/.test(name)) {
    return { valid: false, error: 'Letters, numbers, and these characters: =,.@_-' };
  }
  return { valid: true };
}

/**
 * SSM Parameter name — must start with / and be a valid path.
 */
export function validateParameterName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'Parameter name is required.' };
  const n = name.startsWith('/') ? name : '/' + name;
  if (n.length > 2048) return { valid: false, error: 'Parameter name must be 2048 characters or fewer.' };
  if (!/^\/[a-zA-Z0-9_.\/\-]+$/.test(n)) {
    return { valid: false, error: 'Use a path like /app/env/key — letters, numbers, underscores, hyphens, dots, and slashes.' };
  }
  return { valid: true };
}

/**
 * JSON payload — must be valid JSON.
 */
export function validateJSON(value) {
  if (!value || !value.trim()) return { valid: false, error: 'Payload is required.' };
  try {
    JSON.parse(value);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${e.message}` };
  }
}

/**
 * LocalStack endpoint URL
 */
export function validateEndpoint(url) {
  if (!url || !url.trim()) return { valid: false, error: 'Endpoint URL is required.' };
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Enter a valid URL, e.g. http://localhost:4566' };
  }
}

/**
 * Generic required-field check
 */
export function validateRequired(value, label = 'This field') {
  if (!value || !String(value).trim()) {
    return { valid: false, error: `${label} is required.` };
  }
  return { valid: true };
}
