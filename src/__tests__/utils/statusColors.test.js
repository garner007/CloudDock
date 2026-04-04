import { getStatusColor, STATUS_COLORS } from '../../utils/statusColors';

describe('getStatusColor', () => {
  it('returns green for ACTIVE', () => {
    expect(getStatusColor('ACTIVE')).toBe('badge-green');
  });

  it('returns green for RUNNING', () => {
    expect(getStatusColor('RUNNING')).toBe('badge-green');
  });

  it('returns green for CREATE_COMPLETE', () => {
    expect(getStatusColor('CREATE_COMPLETE')).toBe('badge-green');
  });

  it('returns green for SUCCEEDED', () => {
    expect(getStatusColor('SUCCEEDED')).toBe('badge-green');
  });

  it('returns red for FAILED', () => {
    expect(getStatusColor('FAILED')).toBe('badge-red');
  });

  it('returns red for CREATE_FAILED', () => {
    expect(getStatusColor('CREATE_FAILED')).toBe('badge-red');
  });

  it('returns yellow for PENDING', () => {
    expect(getStatusColor('PENDING')).toBe('badge-yellow');
  });

  it('returns yellow for CREATING', () => {
    expect(getStatusColor('CREATING')).toBe('badge-yellow');
  });

  it('returns yellow for CREATE_IN_PROGRESS', () => {
    expect(getStatusColor('CREATE_IN_PROGRESS')).toBe('badge-yellow');
  });

  it('returns gray for unknown status', () => {
    expect(getStatusColor('SOMETHING_ELSE')).toBe('badge-gray');
  });

  it('is case insensitive', () => {
    expect(getStatusColor('active')).toBe('badge-green');
    expect(getStatusColor('Failed')).toBe('badge-red');
  });

  it('returns gray for null', () => {
    expect(getStatusColor(null)).toBe('badge-gray');
  });

  it('returns gray for undefined', () => {
    expect(getStatusColor(undefined)).toBe('badge-gray');
  });

  it('returns gray for empty string', () => {
    expect(getStatusColor('')).toBe('badge-gray');
  });

  it('returns green for ENABLED', () => {
    expect(getStatusColor('ENABLED')).toBe('badge-green');
  });

  it('returns gray for DISABLED', () => {
    expect(getStatusColor('DISABLED')).toBe('badge-gray');
  });

  it('returns gray for DELETED', () => {
    expect(getStatusColor('DELETED')).toBe('badge-gray');
  });

  it('returns red for EXPIRED', () => {
    expect(getStatusColor('EXPIRED')).toBe('badge-red');
  });

  it('returns red for REVOKED', () => {
    expect(getStatusColor('REVOKED')).toBe('badge-red');
  });

  it('returns yellow for UPDATING', () => {
    expect(getStatusColor('UPDATING')).toBe('badge-yellow');
  });

  it('has all expected statuses in STATUS_COLORS', () => {
    expect(Object.keys(STATUS_COLORS).length).toBeGreaterThan(15);
  });
});
