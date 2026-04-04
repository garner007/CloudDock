import React, { useState, useEffect, useCallback } from 'react';
import { Waves, RefreshCw, Plus, Trash2, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';

const KINESIS_STATUS_MAP = {
  ACTIVE: 'green',
  CREATING: 'yellow',
  DELETING: 'red',
};

export default function KinesisPage({ showNotification }) {
  const [streams, setStreams] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [streamDetails, setStreamDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
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

  const createStream = async (values) => {
    if (!values.name) return;
    try {
      const { KinesisClient, CreateStreamCommand } = await import('@aws-sdk/client-kinesis');
      const client = new KinesisClient(getConfig());
      await client.send(new CreateStreamCommand({ StreamName: values.name, ShardCount: parseInt(values.shards) || 1 }));
      showNotification(`Stream "${values.name}" created`);
      setShowCreate(false);
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

  const detail = selectedStream ? streamDetails[selectedStream] : null;

  if (selectedStream) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Waves size={20} /> Kinesis &rsaquo; {selectedStream}</div>
            <div className="page-subtitle">
              {detail ? `${detail.OpenShardCount} shard${detail.OpenShardCount !== 1 ? 's' : ''} · ${detail.StreamStatus}` : 'Loading...'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStream(null)}>&#8592; Streams</button>
            <button className="btn btn-secondary btn-sm" onClick={loadStreams}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
            <button className="btn btn-primary" onClick={() => setShowPut(true)}><Send size={13} /> Put record</button>
          </div>
        </div>

        {detail && (
          <div className="stats-row">
            <div className="stat-card"><div className="stat-label">Status</div><div style={{ marginTop: 8 }}><StatusBadge status={detail.StreamStatus} colorMap={KINESIS_STATUS_MAP} /></div></div>
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
                <button className="close-btn" onClick={() => setShowPut(false)}><span style={{ fontSize: 16 }}>&times;</span></button>
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

  // Build table data enriched with details
  const tableData = streams.map(name => ({ name, ...(streamDetails[name] || {}) }));

  const streamColumns = [
    { key: 'name', label: 'Stream name', render: (v) => <button className="link-btn" onClick={() => setSelectedStream(v)}>{v}</button> },
    { key: 'StreamStatus', label: 'Status', render: (v) => v ? <StatusBadge status={v} colorMap={KINESIS_STATUS_MAP} /> : '...' },
    { key: 'OpenShardCount', label: 'Shards', render: (v) => v ?? '...' },
    { key: 'RetentionPeriodHours', label: 'Retention', render: (v) => v ? `${v}h` : '...' },
    { key: 'StreamARN', label: 'ARN', mono: true, render: (v) => <span style={{ fontSize: 10, color: 'var(--aws-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>{v || '-'}</span> },
  ];

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

      <DataTable
        columns={streamColumns}
        data={tableData}
        loading={loading}
        rowKey="name"
        emptyIcon={Waves}
        emptyTitle="No streams"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStream(row.name)}>Details</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteStream(row.name)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create Kinesis Stream"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createStream}
        fields={[
          { name: 'name', label: 'Stream Name', required: true, placeholder: 'my-stream' },
          { name: 'shards', label: 'Shard Count', type: 'number', defaultValue: '1', placeholder: '1' },
        ]}
        submitLabel="Create Stream"
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
