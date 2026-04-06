import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Plus, Trash2, X, Eye } from 'lucide-react';
import { DynamoDBClient, ListTablesCommand, DescribeTableCommand,
         CreateTableCommand, DeleteTableCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getConfig } from '../services/awsClients';
import { validateTableName } from '../services/validation';
import { fmtSize } from '../utils/formatters';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const TABLE_STATUS_COLORS = {
  ACTIVE: 'green',
  CREATING: 'yellow',
  DELETING: 'yellow',
  UPDATING: 'yellow',
};

export default function DynamoDBPage({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [tableDetails, setTableDetails] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [items, setItems] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tab, setTab] = useState('items');

  const loadTablesFn = useCallback(async () => {
    const client = new DynamoDBClient(getConfig());
    const res = await client.send(new ListTablesCommand({}));
    const names = res.TableNames || [];
    // Load details for each table
    const details = {};
    await Promise.all(names.map(async name => {
      try {
        const d = await client.send(new DescribeTableCommand({ TableName: name }));
        details[name] = d.Table;
      } catch {}
    }));
    setTableDetails(details);
    return names;
  }, []);

  const { items: tables, loading, refresh: loadTables } = useAwsResource(loadTablesFn, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const loadItems = useCallback(async (tableName) => {
    setItemLoading(true);
    try {
      const client = new DynamoDBClient(getConfig());
      const allItems = [];
      let lastKey = undefined;
      do {
        const res = await client.send(new ScanCommand({
          TableName: tableName,
          Limit: 100,
          ExclusiveStartKey: lastKey,
        }));
        (res.Items || []).forEach(item => allItems.push(unmarshall(item)));
        lastKey = res.LastEvaluatedKey;
      } while (lastKey && allItems.length < 1000);
      setItems(allItems);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setItemLoading(false); }
  }, [showNotification]);

  const createTable = async (values) => {
    const check = validateTableName(values.tableName);
    if (!check.valid) { showNotification(check.error, 'error'); return; }
    try {
      const client = new DynamoDBClient(getConfig());
      await client.send(new CreateTableCommand({
        TableName: values.tableName,
        AttributeDefinitions: [{ AttributeName: values.hashKey || 'id', AttributeType: values.hashType || 'S' }],
        KeySchema: [{ AttributeName: values.hashKey || 'id', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      showNotification(`Table "${values.tableName}" created`);
      setShowCreate(false);
      loadTables();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteTable = (name) => {
    requestConfirm({
      title: `Delete table "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const client = new DynamoDBClient(getConfig());
          await client.send(new DeleteTableCommand({ TableName: name }));
          showNotification(`Table deleted`);
          if (selectedTable === name) setSelectedTable(null);
          loadTables();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const openTable = (name) => {
    setSelectedTable(name);
    setTab('items');
    loadItems(name);
  };

  const getColumns = (items) => {
    const cols = new Set();
    items.forEach(item => Object.keys(item).forEach(k => cols.add(k)));
    return Array.from(cols).slice(0, 8);
  };

  const formatCell = (val) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--aws-text-muted)' }}>null</span>;
    if (typeof val === 'object') return <span style={{ color: 'var(--aws-cyan)', fontSize: 11 }}>{JSON.stringify(val).slice(0, 60)}...</span>;
    return String(val).slice(0, 80);
  };

  const detail = selectedTable ? tableDetails[selectedTable] : null;

  // ── Item browser view ─────────────────────────────────────────────────────────
  if (selectedTable) {
    const cols = getColumns(items);
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Database size={20} /> DynamoDB &gt; {selectedTable}</div>
            <div className="page-subtitle">{items.length} items (scan limit 100)</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTable(null)}>&larr; Tables</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadItems(selectedTable)}>
              <RefreshCw size={13} className={itemLoading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div className="tab-bar">
          {['items', 'overview', 'indexes'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'items' && (
          <div className="card">
            {itemLoading ? (
              <div className="loading-center"><RefreshCw size={16} className="spin" /> Scanning...</div>
            ) : items.length === 0 ? (
              <div className="empty-state"><Database size={40} /><h3>No items</h3><p>This table is empty.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {cols.map(c => <th key={c}>{c}</th>)}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        {cols.map(c => <td key={c} className={typeof item[c] === 'string' ? 'mono' : ''}>{formatCell(item[c])}</td>)}
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(item)}>
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'overview' && detail && (
          <div className="card">
            <div style={{ padding: 20 }}>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Status</div>
                  <div><StatusBadge status={detail.TableStatus} colorMap={TABLE_STATUS_COLORS} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Item Count</div>
                  <div className="stat-value">{detail.ItemCount?.toLocaleString() || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Size</div>
                  <div className="stat-value" style={{ fontSize: 18 }}>
                    {detail.TableSizeBytes ? fmtSize(detail.TableSizeBytes) : '0 B'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Billing</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>{detail.BillingModeSummary?.BillingMode || 'PAY_PER_REQUEST'}</div>
                </div>
              </div>
              <div className="form-label" style={{ marginBottom: 8 }}>Key Schema</div>
              <pre className="detail-json">{JSON.stringify(detail.KeySchema, null, 2)}</pre>
              <div className="form-label" style={{ marginTop: 16, marginBottom: 8 }}>Attribute Definitions</div>
              <pre className="detail-json">{JSON.stringify(detail.AttributeDefinitions, null, 2)}</pre>
            </div>
          </div>
        )}

        {tab === 'indexes' && detail && (
          <div className="card">
            <div style={{ padding: 20 }}>
              {(!detail.GlobalSecondaryIndexes?.length && !detail.LocalSecondaryIndexes?.length) ? (
                <div className="empty-state"><Database size={30} /><p>No secondary indexes on this table.</p></div>
              ) : (
                <pre className="detail-json">{JSON.stringify({
                  GlobalSecondaryIndexes: detail.GlobalSecondaryIndexes || [],
                  LocalSecondaryIndexes: detail.LocalSecondaryIndexes || [],
                }, null, 2)}</pre>
              )}
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Item Details</span>
                <button className="close-btn" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <pre className="detail-json">{JSON.stringify(selectedItem, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
        {confirmDialog}
      </div>
    );
  }

  // ── Table list (using DataTable) ──────────────────────────────────────────────
  const tableData = tables.map(name => {
    const d = tableDetails[name];
    return {
      name,
      status: d?.TableStatus || '...',
      itemCount: d?.ItemCount?.toLocaleString() ?? '...',
      size: d?.TableSizeBytes != null ? fmtSize(d.TableSizeBytes) : '...',
      billing: d?.BillingModeSummary?.BillingMode || 'PAY_PER_REQUEST',
    };
  });

  const tableColumns = [
    {
      key: 'name', label: 'Table name',
      render: (val) => (
        <button className="link-btn" onClick={() => openTable(val)}>{val}</button>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (val) => <StatusBadge status={val} colorMap={TABLE_STATUS_COLORS} />,
    },
    { key: 'itemCount', label: 'Items' },
    { key: 'size', label: 'Size' },
    {
      key: 'billing', label: 'Billing',
      render: (val) => <span className="badge badge-gray">{val}</span>,
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Database size={20} /> DynamoDB Tables</div>
          <div className="page-subtitle">{tables.length} table{tables.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadTables}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create table</button>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={tableData}
        loading={loading}
        rowKey="name"
        emptyIcon={Database}
        emptyTitle="No tables"
        emptyDescription="Create your first DynamoDB table."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => openTable(row.name)}>Browse</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteTable(row.name)}><Trash2 size={12} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create DynamoDB Table"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createTable}
        submitLabel="Create Table"
        fields={[
          { name: 'tableName', label: 'Table Name', placeholder: 'my-table', required: true },
          { name: 'hashKey', label: 'Partition Key Name', placeholder: 'id', defaultValue: 'id' },
          {
            name: 'hashType', label: 'Partition Key Type', type: 'select',
            options: ['S', 'N', 'B'],
            defaultValue: 'S',
          },
        ]}
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;font-weight:500;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
