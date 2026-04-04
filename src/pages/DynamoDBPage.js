import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Plus, Trash2, X, Eye, AlertCircle } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { validateTableName } from '../services/validation';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function DynamoDBPage({ showNotification }) {
  const [tables, setTables] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [tableDetails, setTableDetails] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTable, setNewTable] = useState({ name: '', hashKey: 'id', hashType: 'S' });
  const [tableNameError, setTableNameError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [tab, setTab] = useState('items');

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient(getConfig());
      const res = await client.send(new ListTablesCommand({}));
      const names = res.TableNames || [];
      setTables(names);
      // Load details for each table
      const details = {};
      await Promise.all(names.map(async name => {
        try {
          const d = await client.send(new DescribeTableCommand({ TableName: name }));
          details[name] = d.Table;
        } catch {}
      }));
      setTableDetails(details);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadItems = useCallback(async (tableName) => {
    setLoading(true);
    try {
      const { DynamoDBClient, ScanCommand } = await import('@aws-sdk/client-dynamodb');
      const { unmarshall } = await import('@aws-sdk/util-dynamodb');
      const client = new DynamoDBClient(getConfig());
      // Paginate through all results using LastEvaluatedKey
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
      } while (lastKey && allItems.length < 1000); // cap at 1000 to avoid freezing
      setItems(allItems);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  const createTable = async () => {
    const check = validateTableName(newTable.name);
    if (!check.valid) { setTableNameError(check.error); return; }
    setTableNameError('');
    try {
      const { DynamoDBClient, CreateTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = new DynamoDBClient(getConfig());
      await client.send(new CreateTableCommand({
        TableName: newTable.name,
        AttributeDefinitions: [{ AttributeName: newTable.hashKey, AttributeType: newTable.hashType }],
        KeySchema: [{ AttributeName: newTable.hashKey, KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      showNotification(`Table "${newTable.name}" created`);
      setShowCreate(false);
      setNewTable({ name: '', hashKey: 'id', hashType: 'S' });
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
        const { DynamoDBClient, DeleteTableCommand } = await import('@aws-sdk/client-dynamodb');
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
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTable(null)}>← Tables</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadItems(selectedTable)}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
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
            {loading ? (
              <div className="loading-center"><RefreshCw size={16} className="spin" /> Scanning...</div>
            ) : items.length === 0 ? (
              <div className="empty-state"><Database size={40} /><h3>No items</h3><p>This table is empty.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {cols.map(c => <th key={c}>{c}</th>)}
                      <th></th>
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
                  <div><span className={`badge ${detail.TableStatus === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`}>{detail.TableStatus}</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Item Count</div>
                  <div className="stat-value">{detail.ItemCount?.toLocaleString() || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Size</div>
                  <div className="stat-value" style={{ fontSize: 18 }}>
                    {detail.TableSizeBytes ? `${(detail.TableSizeBytes / 1024).toFixed(1)} KB` : '0 B'}
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

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /> Loading tables...</div>
        ) : tables.length === 0 ? (
          <div className="empty-state">
            <Database size={40} />
            <h3>No tables</h3>
            <p>Create your first DynamoDB table.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create table</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Table name</th><th>Status</th><th>Items</th><th>Size</th><th>Billing</th><th></th></tr>
            </thead>
            <tbody>
              {tables.map(name => {
                const d = tableDetails[name];
                return (
                  <tr key={name}>
                    <td>
                      <button className="link-btn" onClick={() => openTable(name)}>{name}</button>
                    </td>
                    <td>
                      <span className={`badge ${d?.TableStatus === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`}>
                        {d?.TableStatus || '...'}
                      </span>
                    </td>
                    <td>{d?.ItemCount?.toLocaleString() ?? '...'}</td>
                    <td style={{ fontSize: 12 }}>
                      {d?.TableSizeBytes != null ? `${(d.TableSizeBytes / 1024).toFixed(1)} KB` : '...'}
                    </td>
                    <td><span className="badge badge-gray">{d?.BillingModeSummary?.BillingMode || 'PAY_PER_REQUEST'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openTable(name)}>Browse</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTable(name)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create DynamoDB Table</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Table Name</label>
                <input className="input" style={{ width: '100%', borderColor: tableNameError ? 'var(--aws-red)' : undefined }}
                  value={newTable.name}
                  onChange={e => { setNewTable({ ...newTable, name: e.target.value }); if (tableNameError) setTableNameError(''); }}
                  placeholder="my-table" autoFocus />
                {tableNameError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, color: 'var(--aws-red)' }}>
                    <AlertCircle size={12} /> {tableNameError}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Partition Key Name</label>
                <input className="input" style={{ width: '100%' }} value={newTable.hashKey}
                  onChange={e => setNewTable({ ...newTable, hashKey: e.target.value })} placeholder="id" />
              </div>
              <div className="form-group">
                <label className="form-label">Partition Key Type</label>
                <select className="input" style={{ width: '100%' }} value={newTable.hashType}
                  onChange={e => setNewTable({ ...newTable, hashType: e.target.value })}>
                  <option value="S">String (S)</option>
                  <option value="N">Number (N)</option>
                  <option value="B">Binary (B)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTable}>Create Table</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;font-weight:500;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
