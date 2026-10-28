import { COMPANY_FIELDS, CONTACT_FIELDS, DEAL_FIELDS, contactName, formatMoney, type Company, type Contact, type Deal } from '@ggo/shared';
import { optionLabel } from '../../components/fields/fields';
import { ListView, type Column } from '../../components/views/ListView';
import { RecordPage } from '../../components/views/RecordPage';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Link, useParam } from '../../lib/router';
import { useLoad } from '../../lib/useLoad';
import { useSession } from '../../session';
import { Loading, NewRecordButton, PageHeader, useCanDeleteCrm, useCanManageCrm } from './common';
import { crmLookups, useCrmData } from './data';

export function CompaniesList() {
  const session = useSession();
  const data = useCrmData();
  if (!data.data) return <Loading error={data.error} />;
  const lookups = crmLookups(data.data);
  const contactsPer = new Map<string, number>();
  for (const c of data.data.contacts) if (c.companyId) contactsPer.set(c.companyId, (contactsPer.get(c.companyId) ?? 0) + 1);

  const columns: Column<Company>[] = [
    { key: 'name', label: 'Name', value: (c) => c.name, render: (c) => <Link to={`/crm/companies/${c.id}`}>{c.name}</Link> },
    { key: 'status', label: 'Status', value: (c) => c.status, render: (c) => <span className={`pill pill-${c.status}`}>{c.status}</span> },
    { key: 'industry', label: 'Industry', value: (c) => c.industry },
    { key: 'contacts', label: 'Contacts', value: (c) => contactsPer.get(c.id) ?? 0, align: 'right' },
    { key: 'owner', label: 'Owner', value: (c) => optionLabel(lookups.users, c.ownerId) },
    { key: 'tags', label: 'Tags', value: (c) => c.tags.join(', ') },
    { key: 'created', label: 'Added', value: (c) => c.createdAt, render: (c) => formatDate(c.createdAt, session.org) },
  ];

  return (
    <section className="page wide">
      <PageHeader title="Companies" intro="Clients and prospects.">
        <NewRecordButton
          noun="company"
          fields={COMPANY_FIELDS}
          lookups={lookups}
          apiPath="/v1/crm/companies"
          pagePath="/crm/companies"
          initial={{ status: 'lead', ownerId: session.userId, tags: [] }}
        />
      </PageHeader>
      <ListView title="Companies" rows={data.data.companies} columns={columns} rowKey={(c) => c.id} empty="No companies yet. Add your first client or prospect." />
    </section>
  );
}

export function CompanyPage() {
  const id = useParam('id');
  const session = useSession();
  const canManage = useCanManageCrm();
  const canDelete = useCanDeleteCrm();
  const data = useCrmData();
  const company = useLoad(() => api<Company>(`/v1/crm/companies/${id}`));
  const deals = useLoad(() => api<Deal[]>(`/v1/crm/deals?companyId=${id}`));


  if (!data.data || !company.data) return <Loading error={company.error ?? data.error} />;
  const lookups = crmLookups(data.data);
  const contacts: Contact[] = data.data.contacts.filter((c) => c.companyId === id);
  const stageName = (sid: string) => data.data?.stages.find((s) => s.id === sid)?.name ?? '';

  return (
    <RecordPage
      title={company.data.name}
      subtitle={<span className="capitalize">{company.data.status}</span>}
      record={company.data}
      fields={COMPANY_FIELDS}
      lookups={lookups}
      entityType="crm_company"
      apiPath="/v1/crm/companies"
      back={{ label: 'Companies', to: '/crm/companies' }}
      noun="company"
      canManage={canManage}
      canDelete={canDelete}
      onChanged={(r) => company.setData(r as unknown as Company)}
      related={
        <>
          <section className="related">
            <div className="related-head">
              <h2>Contacts ({contacts.length})</h2>
              <NewRecordButton
                noun="contact"
                fields={CONTACT_FIELDS}
                lookups={lookups}
                apiPath="/v1/crm/contacts"
                pagePath="/crm/contacts"
                initial={{ companyId: id, ownerId: session.userId, tags: [] }}
              />
            </div>
            {contacts.length === 0 ? (
              <p className="muted small">No contacts at this company yet.</p>
            ) : (
              <ul className="related-list">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <Link to={`/crm/contacts/${c.id}`}>{contactName(c)}</Link>
                    <span className="muted small">{[c.jobTitle, c.email, c.phone].filter(Boolean).join(' · ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
                  companyId: id,
                  ownerId: session.userId,
                  currency: session.org?.defaultCurrency,
                  stageId: data.data.stages.find((s) => s.kind === 'open')?.id,
                  amountMinor: 0,
                  tags: [],
                }}
              />
            </div>
            {deals.data?.length === 0 ? (
              <p className="muted small">No deals with this company yet.</p>
            ) : (
              <ul className="related-list">
                {deals.data?.map((d) => (
                  <li key={d.id}>
                    <Link to={`/crm/deals/${d.id}`}>{d.title}</Link>
                    <span className="muted small">
                      {stageName(d.stageId)} · {formatMoney({ amountMinor: d.amountMinor, currency: d.currency })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      }
    />
  );
}
