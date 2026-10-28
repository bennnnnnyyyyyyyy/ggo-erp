import { describe, expect, it } from 'vitest';
import { closedAtFor, COMPANY_FIELDS, DEAL_FIELDS } from './crm';
import { inputToMinor, minorToInput, validateRecord } from './fields';
import { defaultPermissionsFor } from './permissions';

describe('validateRecord', () => {
  it('requires required fields and fills optional ones on create', () => {
    const { values, errors } = validateRecord(COMPANY_FIELDS, { status: 'lead' });
    expect(errors.name).toMatch(/required/);
    expect(values.tags).toEqual([]);
    expect(values.industry).toBeNull();
  });

  it('normalises values', () => {
    const { values, errors } = validateRecord(COMPANY_FIELDS, {
      name: '  Acme  ',
      status: 'client',
      website: 'acme.com',
      email: 'Sales@Acme.COM',
      tags: 'vip, health ,vip',
    });
    expect(errors).toEqual({});
    expect(values).toMatchObject({ name: 'Acme', website: 'https://acme.com', email: 'sales@acme.com', tags: ['vip', 'health'] });
  });

  it('rejects bad values', () => {
    const { errors } = validateRecord(COMPANY_FIELDS, { name: 'A', status: 'friend', email: 'nope', website: 'not a site' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'status', 'website']);
  });

  it('checks only present keys on a partial update and skips server-set fields', () => {
    const { values, errors } = validateRecord(DEAL_FIELDS, { amountMinor: 150000, closedAt: '2026-01-01' }, true);
    expect(errors).toEqual({});
    expect(values).toEqual({ amountMinor: 150000 });
  });

  it('rejects fractional or negative money', () => {
    expect(validateRecord(DEAL_FIELDS, { amountMinor: 1.5 }, true).errors.amountMinor).toBeDefined();
    expect(validateRecord(DEAL_FIELDS, { amountMinor: -1 }, true).errors.amountMinor).toBeDefined();
  });
});

describe('money inputs', () => {
  it('round-trips decimal input and minor units', () => {
    expect(inputToMinor('1,234.5', 2)).toBe(123450);
    expect(inputToMinor('12.345', 2)).toBeNull();
    expect(inputToMinor('abc', 2)).toBeNull();
    expect(minorToInput(123450, 2)).toBe('1234.50');
    expect(inputToMinor('500', 0)).toBe(500);
  });
});

describe('deal closing', () => {
  const now = new Date('2026-10-28T10:00:00Z');
  it('sets closed_at entering won/lost, keeps it, and clears it when reopened', () => {
    expect(closedAtFor('won', null, now)).toBe(now.toISOString());
    expect(closedAtFor('lost', '2026-10-01T00:00:00.000Z', now)).toBe('2026-10-01T00:00:00.000Z');
    expect(closedAtFor('open', '2026-10-01T00:00:00.000Z', now)).toBeNull();
  });
});

describe('module member grants', () => {
  it('lets members manage CRM records but not CRM settings', () => {
    const perms = defaultPermissionsFor('member');
    expect(perms).toContain('crm.records.manage');
    expect(perms).not.toContain('crm.settings.manage');
    expect(perms).not.toContain('crm.records.delete');
    expect(defaultPermissionsFor('admin')).toContain('crm.records.delete');
    expect(defaultPermissionsFor('viewer')).not.toContain('crm.records.manage');
  });
});
