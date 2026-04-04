import { validateBucketName, validateTableName, validateQueueName } from '../../services/validation';

describe('validateBucketName', () => {
  test('valid name returns valid:true', () => {
    expect(validateBucketName('my-bucket-123')).toEqual({ valid: true });
  });

  test('empty string returns valid:false', () => {
    const result = validateBucketName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('null returns valid:false', () => {
    const result = validateBucketName(null);
    expect(result.valid).toBe(false);
  });

  test('too short (< 3 chars) returns valid:false', () => {
    const result = validateBucketName('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least 3/);
  });

  test('too long (> 63 chars) returns valid:false', () => {
    const result = validateBucketName('a'.repeat(64));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/63 characters/);
  });

  test('uppercase letters are invalid', () => {
    const result = validateBucketName('MyBucket');
    expect(result.valid).toBe(false);
  });

  test('consecutive hyphens are invalid', () => {
    const result = validateBucketName('my--bucket');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/consecutive hyphens/);
  });

  test('IP address format is invalid', () => {
    const result = validateBucketName('192.168.1.1');
    expect(result.valid).toBe(false);
    // Dots fail the character check before reaching the IP-specific check
    expect(result.error).toBeDefined();
  });
});

describe('validateTableName', () => {
  test('valid name returns valid:true', () => {
    expect(validateTableName('my-table_v2')).toEqual({ valid: true });
  });

  test('empty returns valid:false', () => {
    expect(validateTableName('')).toEqual(expect.objectContaining({ valid: false }));
  });

  test('too short returns valid:false', () => {
    const result = validateTableName('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least 3/);
  });

  test('special characters are invalid', () => {
    const result = validateTableName('my table!');
    expect(result.valid).toBe(false);
  });

  test('dots are valid', () => {
    expect(validateTableName('my.table.name')).toEqual({ valid: true });
  });
});

describe('validateQueueName', () => {
  test('valid name returns valid:true', () => {
    expect(validateQueueName('my-queue')).toEqual({ valid: true });
  });

  test('empty returns valid:false', () => {
    expect(validateQueueName('')).toEqual(expect.objectContaining({ valid: false }));
  });

  test('too long (> 80 chars) returns valid:false', () => {
    const result = validateQueueName('a'.repeat(81));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/80 characters/);
  });

  test('fifo queue name is valid', () => {
    expect(validateQueueName('my-queue.fifo')).toEqual({ valid: true });
  });

  test('fifo flag appends .fifo suffix for validation', () => {
    expect(validateQueueName('my-queue', true)).toEqual({ valid: true });
  });

  test('special characters are invalid', () => {
    const result = validateQueueName('my queue!');
    expect(result.valid).toBe(false);
  });
});
