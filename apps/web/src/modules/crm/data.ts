import { contactName, type Company, type Contact, type Member, type Stage } from '@ggo/shared';
import type { Lookups, Option } from '../../components/fields/fields';
import { api } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';

// Everything the CRM screens need to turn ids into names and offer choices. Loaded together;
// fine for an org with a few thousand records, to be replaced by search-as-you-type later.

export type CrmData = {
  members: Member[];
  companies: Company[];
  contacts: Contact[];
  stages: Stage[];
};

export function useCrmData() {
  return useLoad<CrmData>(async () => {
    const [members, companies, contacts, stages] = await Promise.all([
      api<Member[]>('/v1/core/members'),
      api<Company[]>('/v1/crm/companies'),
      api<Contact[]>('/v1/crm/contacts'),
      api<Stage[]>('/v1/crm/stages'),
    ]);
    return { members, companies, contacts, stages };
  });
}

export function memberOptions(members: Member[]): Option[] {
  return members.filter((m) => m.status !== 'disabled').map((m) => ({ id: m.userId, label: m.name ?? m.email }));
}

export function crmLookups(d: CrmData): Lookups {
  return {
    users: memberOptions(d.members),
    refs: {
      companies: d.companies
        .map((c) => ({ id: c.id, label: c.name, href: `/crm/companies/${c.id}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      contacts: d.contacts
        .map((c) => ({ id: c.id, label: contactName(c), href: `/crm/contacts/${c.id}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      stages: d.stages.map((s) => ({ id: s.id, label: s.name })),
    },
  };
}
