import React, { useState, useEffect, useCallback } from 'react';
import { Waves, RefreshCw, Plus, Trash2, X, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function KinesisPage({ showNotification }) {
  const [streams, setStreams] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [streamDetails, setStreamDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newStream, setNewStream] = useState({ name: '', shards: 1 });
  const [showPut, setShowPut] = useState(false);
  const [record, setRecord] = useState({ data: '{"hello":"world"}', partitionKey: 'key-1' });

  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const { KinesisClient, ListStreamsCommand, DescribeStreamSummaryCommand } = await import('@aws-sdk/client-kinesis');
      const client = new KinesisClient(getConfig());
      const res = await client.send(new ListStreamsCommand({ Limit: 100 }));
      const names = res.StreamNames || [];
      setStreams(names);
      const details = {};
      await Promise.all(names.map(async name => {
        try {
          const d = await client.send(new DescribeStreamSummaryCommand({ StreamName: name }));
          details[name] = d.StreamDescriptionSummary;
        } catch {}
      }));
      setStreamDetails(details);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadStreams(); }, [loadStreams]);

  const createStream = async () => {
    if (!newStream.name) return;
    try {
      const { KinesisClient, CreateStreamCommand } = await import('@aws-sdk/client-kinesis');
      const client = new KinesisClient(getConfig());
      await client.send(new CreateStreamCommand({ StreamName: newStream.name, ShardCount: newStream.shards }));
      showNotification(`Stream "${newStream.name}" created`);
      setShowCreate(false);
      setNewStream({ name: '', shards: 1 });
      loadStreams();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteStream = (name) => {
    requestConfirm({
      title: `Delete stream "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { KinesisClient, DeleteStreamCommand } = await import('@aws-sdk/client-kinesis');
        const client = new KinesisClient(getConfig());
        await client.send(new DeleteStreamCommand({ StreamName: name }));
        showNotification('Stream deleted');
        if (selectedStream === name) setSelectedStream(null);
        loadStreams();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const putRecord = async () => {
    try {
      const { KinesisClient, PutRecordCommand } = await import('@aws-sdk/client-kinesis');
      const client = new KinesisClient(getConfig());
      const res = await client.send(new PutRecordCommand({
        StreamName: selectedStream,
        Data: new TextEncoder().encode(record.data),
        PartitionKey: record.partitionKey,
      }));
      showNotification(`Record written to shard ${res.ShardId}`);
      setShowPut(false);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const statusBadge = (status) => {
    if (status === 'ACTIVE') return 'badge-green';
    if (status === 'CREATING') return 'badge-yellow';
    if (status === 'DELETING') return 'badge-red';
    return 'badge-gray';
  };

  const detail = selectedStream ? streamDetails[selectedStream] : null;

  if (selectedStream) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Waves size={20} /> Kinesis › {selectedStream}</div>
            <div className="page-subtitle">
              {detail ? `${detail.OpenShardCount} shard${detail.OpenShardCount !== 1 ? 's' : ''} · ${detail.StreamStatus}` : 'Loading...'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStream(null)}>← Streams</button>
            <button className="btn btn-secondary btn-sm" onClick={loadStreams}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
            <button className="btn btn-primary" onClick={() => setShowPut(true)}><Send size={13} /> Put record</button>
          </div>
        </div>

        {detail && (
          <div className="stats-row">
            <div className="stat-card"><div className="stat-label">Status</div><div style={{ marginTop: 8 }}><span className={`badge ${statusBadge(detail.StreamStatus)}`}>{detail.StreamStatus}</span></div></div>
            <div className="stat-card"><div className="stat-label">Open Shards</div><div className="stat-value">{detail.OpenShardCount}</div></div>
            <div className="stat-card"><div className="stat-label">Retention (hrs)</div><div className="stat-value">{detail.RetentionPeriodHours}</div></div>
            <div className="stat-card"><div className="stat-label">Consumers</div><div className="stat-value">{detail.ConsumerCount || 0}</div></div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><span className="card-title">Stream Details</span></div>
          <div style={{ padding: 20 }}>
            {detail ? (
              <pre className="detail-json">{JSON.stringify(detail, null, 2)}</pre>
            ) : (
              <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
            )}
          </div>
        </div>

        {showPut && (
          <div className="modal-overlay" onClick={() => setShowPut(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Put Record into {selectedStream}</span>
                <button className="close-btn" onClick={() => setShowPut(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Partition Key</label>
                  <input className="input" style={{ width: '100%' }} value={record.partitionKey}
                    onChange={e => setRecord({ ...record, partitionKey: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data (JSON or text)</label>
                  <textarea className="input" style={{ width: '100%', minHeight: 100, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    value={record.data} onChange={e => setRecord({ ...record, data: e.target.value })} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPut(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={putRecord}><Send size={13} /> Put Record</button>
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
          <div className="page-title"><Waves size={20} /> Kinesis Streams</div>
          <div className="page-subtitle">{streams.length} stream{streams.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadStreams}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create stream</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : streams.length === 0 ? (
          <div className="empty-state">
            <Waves size={40} /><h3>No streams</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create stream</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Stream name</th><th>Status</th><th>Shards</th><th>Retention</th><th>ARN</th><th></th></tr></thead>
            <tbody>
              {streams.map(name => {
                const d = streamDetails[name];
                return (
                  <tr key={name}>
                    <td><button className="link-btn" onClick={() => setSelectedStream(name)}>{name}</button></td>
                    <td><span className={`badge ${statusBadge(d?.StreamStatus)}`}>{d?.StreamStatus || '...'}</span></td>
                    <td>{d?.OpenShardCount ?? '...'}</td>
                    <td>{d?.RetentionPeriodHours ? `${d.RetentionPeriodHours}h` : '...'}</td>
                    <td className="mono" style={{ fontSize: 10, color: 'var(--aws-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d?.StreamARN || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStream(name)}>Details</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteStream(name)}><Trash2 size={11} /></button>
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
              <span className="modal-title">Create Kinesis Stream</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Stream Name</label>
                <input className="input" style={{ width: '100%' }} value={newStream.name}
                  onChange={e => setNewStream({ ...newStream, name: e.target.value })} placeholder="my-stream" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Shard Count</label>
                <input className="input" style={{ width: '100%' }} type="number" min={1} max={100} value={newStream.shards}
                  onChange={e => setNewStream({ ...newStream, shards: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createStream}>Create Stream</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
