import { useState } from 'react';
import { DEAL_FIELDS, formatMoney, type Deal, type Stage } from '@ggo/shared';
import { optionLabel, type Lookups } from '../../components/fields/fields';
import { BoardView } from '../../components/views/BoardView';
import { ListView, type Column } from '../../components/views/ListView';
import { RecordPage } from '../../components/views/RecordPage';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Link, navigate, useParam } from '../../lib/router';
import { useLoad } from '../../lib/useLoad';
import { useSession } from '../../session';
import { Loading, NewRecordButton, PageHeader, useCanManageCrm } from './common';
import { crmLookups, useCrmData } from './data';

/** "AED 12,000 + USD 3,000": totals per currency, never mixed. */
export function totalsByCurrency(deals: Pick<Deal, 'amountMinor' | 'currency'>[]): string {
  const sums = new Map<string, number>();
  for (const d of deals) sums.set(d.currency, (sums.get(d.currency) ?? 0) + d.amountMinor);
  return [...sums].map(([currency, amountMinor]) => formatMoney({ amountMinor, currency })).join(' + ');
}

function useNewDealButton(lookups: Lookups, stages: Stage[]) {
  const session = useSession();
  return (
    <NewRecordButton
      noun="deal"
      fields={DEAL_FIELDS}
      lookups={lookups}
      apiPath="/v1/crm/deals"
      pagePath="/crm/deals"
      initial={{
        ownerId: session.userId,
        currency: session.org?.defaultCurrency,
        stageId: stages.find((s) => s.kind === 'open')?.id,
        amountMinor: 0,
        tags: [],
      }}
    />
  );
}

function ViewSwitch({ current }: { current: 'board' | 'list' }) {
  return (
    <div className="segmented">
      <Link to="/crm" className={current === 'board' ? 'seg active' : 'seg'}>
        Board
      </Link>
      <Link to="/crm/deals" className={current === 'list' ? 'seg active' : 'seg'}>
        List
      </Link>
    </div>
  );
}

function NoStages() {
  return (
    <p className="notice">
      There are no pipeline stages yet. <Link to="/crm/settings">Set up your pipeline</Link> first.
    </p>
  );
}

export function DealsBoard() {
  const session = useSession();
  const canManage = useCanManageCrm();
  const data = useCrmData();
  const deals = useLoad(() => api<Deal[]>('/v1/crm/deals'));
  const [error, setError] = useState<string | null>(null);
  const newDeal = useNewDealButton(data.data ? crmLookups(data.data) : { refs: {}, users: [] }, data.data?.stages ?? []);

  if (!data.data || !deals.data) return <Loading error={deals.error ?? data.error} />;
  const lookups = crmLookups(data.data);
  const all = deals.data;

  async function move(deal: Deal, stageId: string) {
    setError(null);
    const previous = all;
    deals.setData(all.map((d) => (d.id === deal.id ? { ...d, stageId } : d)));
    try {
      const updated = await api<Deal>(`/v1/crm/deals/${deal.id}`, { method: 'PATCH', body: JSON.stringify({ stageId }) });
      deals.setData(previous.map((d) => (d.id === deal.id ? updated : d)));
    } catch (err) {
      deals.setData(previous);
      setError((err as Error).message);
    }
  }

  return (
    <section className="page full">
      <PageHeader title="Deals" intro="Drag a deal to another stage to move it.">
        <ViewSwitch current="board" />
        {newDeal}
      </PageHeader>
      {error && <p className="error">{error}</p>}
      {data.data.stages.length === 0 ? (
        <NoStages />
      ) : (
        <BoardView
          columns={data.data.stages.map((s) => {
            const inStage = all.filter((d) => d.stageId === s.id);
            return {
              id: s.id,
              title: s.name,
              footer: inStage.length ? totalsByCurrency(inStage) : null,
              tone: s.kind === 'open' ? undefined : s.kind,
            };
          })}
          items={all}
          columnOf={(d) => d.stageId}
          itemKey={(d) => d.id}
          canMove={canManage}
          onMove={move}
          renderCard={(d) => (
            <Link to={`/crm/deals/${d.id}`} className="deal-card" draggable={false}>
              <span className="deal-title">{d.title}</span>
              {d.companyId && <span className="muted small">{optionLabel(lookups.refs.companies, d.companyId)}</span>}
              <span className="deal-meta small">
                <strong>{formatMoney({ amountMinor: d.amountMinor, currency: d.currency })}</strong>
                {d.expectedCloseDate && <span className="muted">{formatDate(d.expectedCloseDate, session.org)}</span>}
              </span>
              {d.ownerId && <span className="muted small">{optionLabel(lookups.users, d.ownerId)}</span>}
            </Link>
          )}
        />
      )}
    </section>
  );
}

export function DealsList() {
  const session = useSession();
  const data = useCrmData();
  const deals = useLoad(() => api<Deal[]>('/v1/crm/deals'));
  const newDeal = useNewDealButton(data.data ? crmLookups(data.data) : { refs: {}, users: [] }, data.data?.stages ?? []);
  if (!data.data || !deals.data) return <Loading error={deals.error ?? data.error} />;
  const lookups = crmLookups(data.data);
  const stages = data.data.stages;
  const stage = (id: string) => stages.find((s) => s.id === id);

  const columns: Column<Deal>[] = [
    { key: 'title', label: 'Deal', value: (d) => d.title, render: (d) => <Link to={`/crm/deals/${d.id}`}>{d.title}</Link> },
    { key: 'company', label: 'Company', value: (d) => optionLabel(lookups.refs.companies, d.companyId) },
    { key: 'stage', label: 'Stage', value: (d) => stage(d.stageId)?.position ?? 0, render: (d) => stage(d.stageId)?.name },
    {
      key: 'value',
      label: 'Value',
      align: 'right',
      value: (d) => d.amountMinor,
      render: (d) => formatMoney({ amountMinor: d.amountMinor, currency: d.currency }),
    },
    { key: 'owner', label: 'Owner', value: (d) => optionLabel(lookups.users, d.ownerId) },
    {
      key: 'close',
      label: 'Expected close',
      value: (d) => d.expectedCloseDate,
      render: (d) => formatDate(d.expectedCloseDate, session.org),
    },
  ];

  return (
    <section className="page wide">
      <PageHeader title="Deals">
        <ViewSwitch current="list" />
        {newDeal}
      </PageHeader>
      {stages.length === 0 && <NoStages />}
      <ListView title="Deals" rows={deals.data} columns={columns} rowKey={(d) => d.id} empty="No deals yet." />
    </section>
  );
}

export function DealPage() {
  const id = useParam('id');
  const canManage = useCanManageCrm();
  const data = useCrmData();
  const deal = useLoad(() => api<Deal>(`/v1/crm/deals/${id}`));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  if (!data.data || !deal.data) return <Loading error={deal.error ?? data.error} />;
  const lookups = crmLookups(data.data);
  const d = deal.data;
  const stage = data.data.stages.find((s) => s.id === d.stageId);

  async function setStage(stageId: string) {
    setError(null);
    try {
      deal.setData(await api<Deal>(`/v1/crm/deals/${d.id}`, { method: 'PATCH', body: JSON.stringify({ stageId }) }));
      setVersion((v) => v + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <RecordPage
        key={version}
        title={d.title}
        subtitle={
          <>
            {formatMoney({ amountMinor: d.amountMinor, currency: d.currency })}
            {d.companyId && (
              <>
                {' · '}
                <Link to={`/crm/companies/${d.companyId}`}>{optionLabel(lookups.refs.companies, d.companyId)}</Link>
              </>
            )}
            {stage && stage.kind !== 'open' && <span className={`pill pill-${stage.kind}`}>{stage.kind}</span>}
          </>
        }
        record={d}
        fields={DEAL_FIELDS}
        lookups={lookups}
        entityType="crm_deal"
        apiPath="/v1/crm/deals"
        back={{ label: 'Deals', to: '/crm' }}
        noun="deal"
        canManage={canManage}
        onChanged={(r) => deal.setData(r as unknown as Deal)}
        headerExtra={
          canManage && (
            <select className="stage-select" value={d.stageId} onChange={(e) => setStage(e.target.value)} aria-label="Stage">
              {data.data.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )
        }
      />
    </>
  );
}
