import type { FieldDef } from './fields';

// CRM record shapes and field definitions (documentation/plans/CRM_PLAN.md).

export const COMPANY_STATUSES = ['lead', 'prospect', 'client', 'former'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const STAGE_KINDS = ['open', 'won', 'lost'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

type Base = { id: string; createdAt: string; updatedAt: string; createdBy: string | null };

export type Company = Base & {
  name: string;
  status: CompanyStatus;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string | null;
  ownerId: string | null;
  tags: string[];
};

export type Contact = Base & {
  firstName: string;
  lastName: string | null;
  companyId: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  ownerId: string | null;
  tags: string[];
};

export type Deal = Base & {
  title: string;
  companyId: string | null;
  contactId: string | null;
  stageId: string;
  amountMinor: number;
  currency: string;
  ownerId: string | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  lostReason: string | null;
  tags: string[];
};

export type Stage = { id: string; name: string; position: number; kind: StageKind };

export const COMPANY_FIELDS: readonly FieldDef[] = [
  { key: 'name', column: 'name', label: 'Name', type: 'text', required: true, max: 200 },
  { key: 'status', column: 'status', label: 'Status', type: 'enum', required: true, options: COMPANY_STATUSES },
  { key: 'industry', column: 'industry', label: 'Industry', type: 'text', max: 100 },
  { key: 'website', column: 'website', label: 'Website', type: 'url' },
  { key: 'email', column: 'email', label: 'Email', type: 'email' },
  { key: 'phone', column: 'phone', label: 'Phone', type: 'phone', max: 50 },
  { key: 'address', column: 'address', label: 'Address', type: 'longtext', max: 500 },
  { key: 'source', column: 'source', label: 'Source', type: 'text', max: 100 },
  { key: 'ownerId', column: 'owner_id', label: 'Owner', type: 'user' },
  { key: 'tags', column: 'tags', label: 'Tags', type: 'tags' },
];

export const CONTACT_FIELDS: readonly FieldDef[] = [
  { key: 'firstName', column: 'first_name', label: 'First name', type: 'text', required: true, max: 100 },
  { key: 'lastName', column: 'last_name', label: 'Last name', type: 'text', max: 100 },
  { key: 'companyId', column: 'company_id', label: 'Company', type: 'ref', ref: 'companies' },
  { key: 'jobTitle', column: 'job_title', label: 'Job title', type: 'text', max: 100 },
  { key: 'email', column: 'email', label: 'Email', type: 'email' },
  { key: 'phone', column: 'phone', label: 'Phone', type: 'phone', max: 50 },
  { key: 'ownerId', column: 'owner_id', label: 'Owner', type: 'user' },
  { key: 'tags', column: 'tags', label: 'Tags', type: 'tags' },
];

export const DEAL_FIELDS: readonly FieldDef[] = [
  { key: 'title', column: 'title', label: 'Title', type: 'text', required: true, max: 200 },
  { key: 'companyId', column: 'company_id', label: 'Company', type: 'ref', ref: 'companies' },
  { key: 'contactId', column: 'contact_id', label: 'Contact', type: 'ref', ref: 'contacts' },
  { key: 'stageId', column: 'stage_id', label: 'Stage', type: 'ref', ref: 'stages', required: true },
  { key: 'amountMinor', column: 'amount_minor', label: 'Value', type: 'money' },
  { key: 'currency', column: 'currency', label: 'Currency', type: 'currency', required: true },
  { key: 'ownerId', column: 'owner_id', label: 'Owner', type: 'user' },
  { key: 'expectedCloseDate', column: 'expected_close_date', label: 'Expected close', type: 'date' },
  { key: 'lostReason', column: 'lost_reason', label: 'Lost reason', type: 'longtext', max: 1000 },
  { key: 'tags', column: 'tags', label: 'Tags', type: 'tags' },
  { key: 'closedAt', column: 'closed_at', label: 'Closed', type: 'date', editable: false },
];

export const STAGE_FIELDS: readonly FieldDef[] = [
  { key: 'name', column: 'name', label: 'Name', type: 'text', required: true, max: 80 },
  { key: 'position', column: 'position', label: 'Order', type: 'int' },
  { key: 'kind', column: 'kind', label: 'Kind', type: 'enum', required: true, options: STAGE_KINDS },
];

export const DEFAULT_STAGES: readonly Omit<Stage, 'id'>[] = [
  { name: 'New', position: 10, kind: 'open' },
  { name: 'Qualified', position: 20, kind: 'open' },
  { name: 'Proposal', position: 30, kind: 'open' },
  { name: 'Negotiation', position: 40, kind: 'open' },
  { name: 'Won', position: 90, kind: 'won' },
  { name: 'Lost', position: 100, kind: 'lost' },
];

/** `closed_at` follows the stage: set when entering won/lost, cleared when back to open. */
export function closedAtFor(kind: StageKind, previousClosedAt: string | null, now: Date): string | null {
  if (kind === 'open') return null;
  return previousClosedAt ?? now.toISOString();
}

export function contactName(c: Pick<Contact, 'firstName' | 'lastName'>): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ');
}

export type SearchHit = { type: 'company' | 'contact' | 'deal'; id: string; title: string; subtitle: string | null };
