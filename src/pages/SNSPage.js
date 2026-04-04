import React, { useState, useCallback } from 'react';
import { Bell, RefreshCw, Plus, Trash2, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import CreateModal from '../components/CreateModal';

export default function SNSPage({ showNotification }) {
  const [subscriptions, setSubscriptions] = useState({});
  const { confirmDialog, requestConfirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showPublish, setShowPublish] = useState(false);
  const [publishMsg, setPublishMsg] = useState({ subject: '', message: '' });

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const { SNSClient, ListTopicsCommand, ListSubscriptionsByTopicCommand } = await import('@aws-sdk/client-sns');
      const client = new SNSClient(getConfig());
      const res = await client.send(new ListTopicsCommand({}));
      const t = res.Topics || [];
      setTopics(t);
      const subs = {};
      await Promise.all(t.map(async ({ TopicArn }) => {
        try {
          const s = await client.send(new ListSubscriptionsByTopicCommand({ TopicArn }));
          subs[TopicArn] = s.Subscriptions || [];
        } catch { subs[TopicArn] = []; }
      }));
      setSubscriptions(subs);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  React.useEffect(() => { loadTopics(); }, [loadTopics]);

  const createTopic = async (values) => {
    if (!values.name) return;
    try {
      const { SNSClient, CreateTopicCommand } = await import('@aws-sdk/client-sns');
      const client = new SNSClient(getConfig());
      await client.send(new CreateTopicCommand({ Name: values.name }));
      showNotification(`Topic "${values.name}" created`);
      setShowCreate(false);
      loadTopics();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteTopic = (arn) => {
    const name = arn.split(':').pop();
    requestConfirm({
      title: `Delete topic "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const { SNSClient, DeleteTopicCommand } = await import('@aws-sdk/client-sns');
          const client = new SNSClient(getConfig());
          await client.send(new DeleteTopicCommand({ TopicArn: arn }));
          showNotification('Topic deleted');
          if (selectedTopic === arn) setSelectedTopic(null);
          loadTopics();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const publishMessage = async () => {
    try {
      const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
      const client = new SNSClient(getConfig());
      await client.send(new PublishCommand({
        TopicArn: selectedTopic,
        Message: publishMsg.message,
        Subject: publishMsg.subject || undefined,
      }));
      showNotification('Message published');
      setShowPublish(false);
      setPublishMsg({ subject: '', message: '' });
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const getName = (arn) => arn.split(':').pop();

  const topicColumns = [
    { key: 'TopicArn', label: 'Topic name', render: (arn) => <span style={{ fontWeight: 500 }}>{getName(arn)}</span> },
    { key: '_arn', label: 'ARN', mono: true, render: (_, row) => <span style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{row.TopicArn}</span> },
    { key: '_subs', label: 'Subscriptions', render: (_, row) => (
      <span className="badge badge-blue">
        {subscriptions[row.TopicArn]?.length || 0} sub{subscriptions[row.TopicArn]?.length !== 1 ? 's' : ''}
      </span>
    )},
  ];

  const subColumns = [
    { key: 'Protocol', label: 'Protocol', render: (v) => <span className="badge badge-blue">{v}</span> },
    { key: 'Endpoint', label: 'Endpoint', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'SubscriptionArn', label: 'Status', render: (v) => (
      <span className={`badge ${v === 'PendingConfirmation' ? 'badge-yellow' : 'badge-green'}`}>
        {v === 'PendingConfirmation' ? 'Pending' : 'Confirmed'}
      </span>
    )},
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Bell size={20} /> SNS Topics</div>
          <div className="page-subtitle">{topics.length} topic{topics.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadTopics}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create topic</button>
        </div>
      </div>

      <DataTable
        columns={topicColumns}
        data={topics}
        loading={loading}
        rowKey="TopicArn"
        emptyIcon={Bell}
        emptyTitle="No topics"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setSelectedTopic(row.TopicArn); setShowPublish(true); }}>
              <Send size={11} /> Publish
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteTopic(row.TopicArn)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      {selectedTopic && subscriptions[selectedTopic]?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Subscriptions — {getName(selectedTopic)}</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Protocol</th><th>Endpoint</th><th>Status</th></tr></thead>
            <tbody>
              {(subscriptions[selectedTopic] || []).map((sub, i) => (
                <tr key={i}>
                  <td><span className="badge badge-blue">{sub.Protocol}</span></td>
                  <td className="mono" style={{ fontSize: 11 }}>{sub.Endpoint}</td>
                  <td><span className={`badge ${sub.SubscriptionArn === 'PendingConfirmation' ? 'badge-yellow' : 'badge-green'}`}>
                    {sub.SubscriptionArn === 'PendingConfirmation' ? 'Pending' : 'Confirmed'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateModal
        title="Create SNS Topic"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createTopic}
        fields={[
          { name: 'name', label: 'Topic Name', required: true, placeholder: 'my-topic' },
        ]}
        submitLabel="Create"
      />

      {showPublish && selectedTopic && (
        <div className="modal-overlay" onClick={() => setShowPublish(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Publish to {getName(selectedTopic)}</span>
              <button className="close-btn" onClick={() => setShowPublish(false)}>
                <span style={{ fontSize: 16 }}>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Subject (optional)</label>
                <input className="input" style={{ width: '100%' }} value={publishMsg.subject}
                  onChange={e => setPublishMsg({ ...publishMsg, subject: e.target.value })} placeholder="My subject" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="input" style={{ width: '100%', minHeight: 120, resize: 'vertical' }}
                  value={publishMsg.message}
                  onChange={e => setPublishMsg({ ...publishMsg, message: e.target.value })}
                  placeholder="Message body..." autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPublish(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={publishMessage}><Send size={13} /> Publish</button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
