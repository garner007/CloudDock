import { fmtDate, fmtSize, fmtArn, truncate, fmtNumber } from '../../utils/formatters';

describe('fmtDate', () => {
  it('formats a valid date', () => {
    const d = new Date('2024-06-15T10:30:00Z');
    expect(fmtDate(d)).toBe(d.toLocaleString());
  });

  it('formats a date string', () => {
    // Use ISO format with time to avoid timezone edge cases
    expect(fmtDate('2024-06-15T12:00:00')).toMatch(/2024/);
  });

  it('formats a timestamp number', () => {
    expect(fmtDate(1700000000000)).toMatch(/2023/);
  });

  it('returns dash for null', () => {
    expect(fmtDate(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(fmtDate(undefined)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(fmtDate('')).toBe('—');
  });

  it('returns dash for zero', () => {
    expect(fmtDate(0)).toBe('—');
  });
});

describe('fmtSize', () => {
  it('returns dash for falsy', () => {
    expect(fmtSize(null)).toBe('—');
    expect(fmtSize(undefined)).toBe('—');
    expect(fmtSize(0)).toBe('—');
  });

  it('formats bytes', () => {
    expect(fmtSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(fmtSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(fmtSize(5242880)).toBe('5.0 MB');
  });

  it('formats gigabytes', () => {
    expect(fmtSize(2147483648)).toBe('2.0 GB');
  });

  it('formats fractional sizes', () => {
    expect(fmtSize(1536)).toBe('1.5 KB');
  });
});

describe('fmtArn', () => {
  it('extracts resource name from ARN', () => {
    expect(fmtArn('arn:aws:s3:::my-bucket')).toBe('my-bucket');
  });

  it('handles ARN with slashes', () => {
    expect(fmtArn('arn:aws:iam::123456:role/my-role')).toBe('role/my-role');
  });

  it('returns dash for null', () => {
    expect(fmtArn(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(fmtArn(undefined)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(fmtArn('')).toBe('—');
  });
});

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('hello', 40)).toBe('hello');
  });

  it('truncates long strings with ellipsis', () => {
    const long = 'a'.repeat(50);
    expect(truncate(long, 10)).toBe('aaaaaaaaaa…');
  });

  it('uses default maxLen of 40', () => {
    const str = 'a'.repeat(50);
    expect(truncate(str)).toHaveLength(41); // 40 + ellipsis
  });

  it('returns empty string for null/undefined', () => {
    expect(truncate(null)).toBe('');
    expect(truncate(undefined)).toBe('');
  });

  it('handles exact length', () => {
    expect(truncate('abcde', 5)).toBe('abcde');
  });
});

describe('fmtNumber', () => {
  it('formats thousands with commas', () => {
    expect(fmtNumber(1000)).toBe('1,000');
  });

  it('formats millions', () => {
    expect(fmtNumber(1234567)).toBe('1,234,567');
  });

  it('returns dash for null/undefined', () => {
    expect(fmtNumber(null)).toBe('—');
    expect(fmtNumber(undefined)).toBe('—');
  });

  it('handles zero', () => {
    expect(fmtNumber(0)).toBe('0');
  });

  it('handles small numbers', () => {
    expect(fmtNumber(42)).toBe('42');
  });
});
