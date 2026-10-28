import { CONTACT_FIELDS, DEAL_FIELDS, contactName, formatMoney, type Contact, type Deal } from '@ggo/shared';
import { optionLabel } from '../../components/fields/fields';
import { ListView, type Column } from '../../components/views/ListView';
import { RecordPage } from '../../components/views/RecordPage';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Link, useParam } from '../../lib/router';
import { useLoad } from '../../lib/useLoad';
import { useSession } from '../../session';
import { Loading, NewRecordButton, PageHeader, useCanManageCrm } from './common';
import { crmLookups, useCrmData } from './data';

export function ContactsList() {
  const session = useSession();
  const data = useCrmData();
  if (!data.data) return <Loading error={data.error} />;
  const lookups = crmLookups(data.data);
  const company = lookups.refs.companies ?? [];

  const columns: Column<Contact>[] = [
    { key: 'name', label: 'Name', value: (c) => contactName(c), render: (c) => <Link to={`/crm/contacts/${c.id}`}>{contactName(c)}</Link> },
    {
      key: 'company',
      label: 'Company',
      value: (c) => optionLabel(company, c.companyId),
      render: (c) => (c.companyId ? <Link to={`/crm/companies/${c.companyId}`}>{optionLabel(company, c.companyId)}</Link> : null),
    },
    { key: 'title', label: 'Job title', value: (c) => c.jobTitle },
    { key: 'email', label: 'Email', value: (c) => c.email },
    { key: 'phone', label: 'Phone', value: (c) => c.phone },
    { key: 'owner', label: 'Owner', value: (c) => optionLabel(lookups.users, c.ownerId) },
    { key: 'created', label: 'Added', value: (c) => c.createdAt, render: (c) => formatDate(c.createdAt, session.org) },
  ];

  return (
    <section className="page wide">
      <PageHeader title="Contacts" intro="People at your clients and prospects.">
        <NewRecordButton
          noun="contact"
          fields={CONTACT_FIELDS}
          lookups={lookups}
          apiPath="/v1/crm/contacts"
          pagePath="/crm/contacts"
          initial={{ ownerId: session.userId, tags: [] }}
        />
      </PageHeader>
      <ListView title="Contacts" rows={data.data.contacts} columns={columns} rowKey={(c) => c.id} empty="No contacts yet." />
    </section>
  );
}

export function ContactPage() {
  const id = useParam('id');
  const session = useSession();
  const canManage = useCanManageCrm();
  const data = useCrmData();
  const contact = useLoad(() => api<Contact>(`/v1/crm/contacts/${id}`));
  const deals = useLoad(() => api<Deal[]>(`/v1/crm/deals?contactId=${id}`));

  if (!data.data || !contact.data) return <Loading error={contact.error ?? data.error} />;
  const lookups = crmLookups(data.data);
  const c = contact.data;
  const companyName = optionLabel(lookups.refs.companies, c.companyId);

  return (
    <RecordPage
      title={contactName(c)}
      subtitle={
        [c.jobTitle, companyName].filter(Boolean).length ? (
          <>
            {c.jobTitle}
            {c.jobTitle && companyName ? ' at ' : ''}
            {c.companyId && <Link to={`/crm/companies/${c.companyId}`}>{companyName}</Link>}
          </>
        ) : undefined
      }
      record={c}
      fields={CONTACT_FIELDS}
      lookups={lookups}
      entityType="crm_contact"
      apiPath="/v1/crm/contacts"
      back={{ label: 'Contacts', to: '/crm/contacts' }}
      noun="contact"
      canManage={canManage}
      onChanged={(r) => contact.setData(r as unknown as Contact)}
      related={
        <section className="related">
          <div className="related-head">
            <h2>Deals ({deals.data?.length ?? 0})</h2>
            <NewRecordButton
              noun="deal"
              fields={DEAL_FIELDS}
              lookups={lookups}
              apiPath="/v1/crm/deals"
              pagePath="/crm/deals"
              initial={{
                contactId: id,
                companyId: c.companyId,
                ownerId: session.userId,
                currency: session.org?.defaultCurrency,
                stageId: data.data.stages.find((s) => s.kind === 'open')?.id,
                amountMinor: 0,
                tags: [],
              }}
            />
          </div>
          {deals.data?.length === 0 ? (
            <p className="muted small">No deals with this contact yet.</p>
          ) : (
            <ul className="related-list">
              {deals.data?.map((d) => (
                <li key={d.id}>
                  <Link to={`/crm/deals/${d.id}`}>{d.title}</Link>
                  <span className="muted small">{formatMoney({ amountMinor: d.amountMinor, currency: d.currency })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      }
    />
  );
}
