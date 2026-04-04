import React, { useState, useCallback } from 'react';
import { Flame, RefreshCw, Plus, Trash2, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import { fmtDate } from '../utils/formatters';

const STATUS_COLORS = { ACTIVE: 'green', CREATING: 'yellow', DELETING: 'red' };

const CREATE_FIELDS = [
  { name: 'name', label: 'Stream Name', required: true, placeholder: 'my-delivery-stream' },
  { name: 'destBucket', label: 'S3 Destination Bucket', placeholder: 'my-data-lake-bucket', helpText: 'The S3 bucket must exist in LocalStack. Leave blank to auto-name.' },
  { name: 'destPrefix', label: 'S3 Prefix (optional)', placeholder: 'data/year=!{timestamp:yyyy}/' },
];

const PUT_RECORD_FIELDS = [
  { name: 'record', label: 'Record Data (JSON or text)', type: 'textarea', defaultValue: '{"event":"test","timestamp":"2024-01-01"}' },
];

export default function FirehosePage({ showNotification }) {
  const [streamDetails, setStreamDetails] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showPut, setShowPut] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const { confirmDialog, requestConfirm } = useConfirm();

  const getDestType = (d) => {
    if (!d) return '-';
    const dest = d.Destinations?.[0];
    if (dest?.S3DestinationDescription) return 'S3';
    if (dest?.ExtendedS3DestinationDescription) return 'S3 (Extended)';
    if (dest?.RedshiftDestinationDescription) return 'Redshift';
    if (dest?.ElasticsearchDestinationDescription) return 'OpenSearch';
    return 'Unknown';
  };

  const loadStreams = useCallback(async () => {
    const { FirehoseClient, ListDeliveryStreamsCommand, DescribeDeliveryStreamCommand } = await import('@aws-sdk/client-firehose');
    const client = new FirehoseClient(getConfig());
    const res = await client.send(new ListDeliveryStreamsCommand({ Limit: 100 }));
    const names = res.DeliveryStreamNames || [];
    const details = {};
    await Promise.all(names.map(async name => {
      try {
        const d = await client.send(new DescribeDeliveryStreamCommand({ DeliveryStreamName: name }));
        details[name] = d.DeliveryStreamDescription;
      } catch {}
    }));
    setStreamDetails(details);
    // Return objects with name key so DataTable can use rowKey
    return names.map(name => ({ name }));
  }, []);

  const { items: streams, loading, refresh } = useAwsResource(loadStreams, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const createStream = async (values) => {
    if (!values.name) return;
    try {
      const { FirehoseClient, CreateDeliveryStreamCommand } = await import('@aws-sdk/client-firehose');
      const client = new FirehoseClient(getConfig());
      await client.send(new CreateDeliveryStreamCommand({
        DeliveryStreamName: values.name,
        DeliveryStreamType: 'DirectPut',
        S3DestinationConfiguration: {
          BucketARN: `arn:aws:s3:::${values.destBucket || values.name + '-bucket'}`,
          RoleARN: 'arn:aws:iam::000000000000:role/firehose-role',
          Prefix: values.destPrefix || undefined,
        },
      }));
      showNotification(`Delivery stream "${values.name}" created`);
      setShowCreate(false);
      refresh();
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
          showNotification('Stream deleted');
          refresh();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const putRecord = async (values) => {
    try {
      const { FirehoseClient, PutRecordCommand } = await import('@aws-sdk/client-firehose');
      const client = new FirehoseClient(getConfig());
      await client.send(new PutRecordCommand({
        DeliveryStreamName: selectedStream,
        Record: { Data: new TextEncoder().encode(values.record + '\n') },
      }));
      showNotification('Record delivered');
      setShowPut(false);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const columns = [
    { key: 'name', label: 'Stream name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: '_status', label: 'Status', render: (_, row) => (
      <StatusBadge status={streamDetails[row.name]?.DeliveryStreamStatus || '...'} colorMap={STATUS_COLORS} />
    )},
    { key: '_dest', label: 'Destination', render: (_, row) => (
      <span className="badge badge-blue">{getDestType(streamDetails[row.name])}</span>
    )},
    { key: '_created', label: 'Created', render: (_, row) => (
      <span style={{ fontSize: 12 }}>{fmtDate(streamDetails[row.name]?.CreateTimestamp)}</span>
    )},
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Flame size={20} /> Kinesis Data Firehose</div>
          <div className="page-subtitle">{streams.length} delivery stream{streams.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create stream</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={streams}
        loading={loading}
        rowKey="name"
        emptyIcon={Flame}
        emptyTitle="No delivery streams"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setSelectedStream(row.name); setShowPut(true); }}>
              <Send size={11} /> Put
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteStream(row.name)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create Delivery Stream"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createStream}
        fields={CREATE_FIELDS}
        submitLabel="Create"
      />

      <CreateModal
        title={`Put Record → ${selectedStream}`}
        open={showPut}
        onClose={() => setShowPut(false)}
        onSubmit={putRecord}
        fields={PUT_RECORD_FIELDS}
        submitLabel="Put Record"
      />

      {confirmDialog}
    </div>
  );
}
