import React, { useState, useEffect, useCallback } from 'react';
import { Flame, RefreshCw, Plus, Trash2, X, Send, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function FirehosePage({ showNotification }) {
  const [streams, setStreams] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [streamDetails, setStreamDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPut, setShowPut] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [newStream, setNewStream] = useState({ name: '', destBucket: '', destPrefix: '' });
  const [record, setRecord] = useState('{"event":"test","timestamp":"2024-01-01"}');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { FirehoseClient, ListDeliveryStreamsCommand, DescribeDeliveryStreamCommand } = await import('@aws-sdk/client-firehose');
      const client = new FirehoseClient(getConfig());
      const res = await client.send(new ListDeliveryStreamsCommand({ Limit: 100 }));
      const names = res.DeliveryStreamNames || [];
      setStreams(names);
      const details = {};
      await Promise.all(names.map(async name => {
        try {
          const d = await client.send(new DescribeDeliveryStreamCommand({ DeliveryStreamName: name }));
          details[name] = d.DeliveryStreamDescription;
        } catch {}
      }));
      setStreamDetails(details);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const createStream = async () => {
    if (!newStream.name) return;
    try {
      const { FirehoseClient, CreateDeliveryStreamCommand } = await import('@aws-sdk/client-firehose');
      const client = new FirehoseClient(getConfig());
      await client.send(new CreateDeliveryStreamCommand({
        DeliveryStreamName: newStream.name,
        DeliveryStreamType: 'DirectPut',
        S3DestinationConfiguration: {
          BucketARN: `arn:aws:s3:::${newStream.destBucket || newStream.name + '-bucket'}`,
          RoleARN: 'arn:aws:iam::000000000000:role/firehose-role',
          Prefix: newStream.destPrefix || undefined,
        },
      }));
      showNotification(`Delivery stream "${newStream.name}" created`);
      setShowCreate(false); setNewStream({ name: '', destBucket: '', destPrefix: '' }); load();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteStream = (name) => {
    requestConfirm({
      title: `Delete stream "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { FirehoseClient, DeleteDeliveryStreamCommand } = await import('@aws-sdk/client-firehose');
        const client = new FirehoseClient(getConfig());
        await client.send(new DeleteDeliveryStreamCommand({ DeliveryStreamName: name }));
        showNotification('Stream deleted'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const putRecord = async () => {
    try {
      const { FirehoseClient, PutRecordCommand } = await import('@aws-sdk/client-firehose');
      const client = new FirehoseClient(getConfig());
      await client.send(new PutRecordCommand({
        DeliveryStreamName: selectedStream,
        Record: { Data: new TextEncoder().encode(record + '\n') },
      }));
      showNotification('Record delivered');
      setShowPut(false);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const statusColor = (s) => ({ ACTIVE: 'badge-green', CREATING: 'badge-yellow', DELETING: 'badge-red' }[s] || 'badge-gray');
  const getDestType = (d) => {
    if (!d) return '-';
    const dest = d.Destinations?.[0];
    if (dest?.S3DestinationDescription) return 'S3';
    if (dest?.ExtendedS3DestinationDescription) return 'S3 (Extended)';
    if (dest?.RedshiftDestinationDescription) return 'Redshift';
    if (dest?.ElasticsearchDestinationDescription) return 'OpenSearch';
    return 'Unknown';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Flame size={20} /> Kinesis Data Firehose</div>
          <div className="page-subtitle">{streams.length} delivery stream{streams.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create stream</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : streams.length === 0 ? (
          <div className="empty-state"><Flame size={40} /><h3>No delivery streams</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create delivery stream</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Stream name</th><th>Status</th><th>Destination</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {streams.map(name => {
                const d = streamDetails[name];
                return (
                  <tr key={name}>
                    <td style={{ fontWeight: 500 }}>{name}</td>
                    <td><span className={`badge ${statusColor(d?.DeliveryStreamStatus)}`}>{d?.DeliveryStreamStatus || '...'}</span></td>
                    <td><span className="badge badge-blue">{getDestType(d)}</span></td>
                    <td style={{ fontSize: 12 }}>{d?.CreateTimestamp ? new Date(d.CreateTimestamp).toLocaleString() : '...'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedStream(name); setShowPut(true); }}>
                          <Send size={11} /> Put
                        </button>
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
              <span className="modal-title">Create Delivery Stream</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Stream Name</label>
                <input className="input" style={{ width: '100%' }} value={newStream.name}
                  onChange={e => setNewStream({ ...newStream, name: e.target.value })} placeholder="my-delivery-stream" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">S3 Destination Bucket</label>
                <input className="input" style={{ width: '100%' }} value={newStream.destBucket}
                  onChange={e => setNewStream({ ...newStream, destBucket: e.target.value })} placeholder="my-data-lake-bucket" />
                <div style={{ fontSize: 11, color: 'var(--aws-text-muted)', marginTop: 5 }}>
                  The S3 bucket must exist in LocalStack. Leave blank to auto-name.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">S3 Prefix (optional)</label>
                <input className="input" style={{ width: '100%' }} value={newStream.destPrefix}
                  onChange={e => setNewStream({ ...newStream, destPrefix: e.target.value })} placeholder="data/year=!{timestamp:yyyy}/" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createStream}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showPut && selectedStream && (
        <div className="modal-overlay" onClick={() => setShowPut(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Put Record → {selectedStream}</span>
              <button className="close-btn" onClick={() => setShowPut(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Record Data (JSON or text)</label>
                <textarea className="input" style={{ width: '100%', minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={record} onChange={e => setRecord(e.target.value)} />
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
