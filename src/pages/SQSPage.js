import React, { useState, useCallback } from 'react';
import { Layers, RefreshCw, Plus, Trash2, X, Send, Eye } from 'lucide-react';
import { SQSClient, ListQueuesCommand, GetQueueAttributesCommand,
         CreateQueueCommand, DeleteQueueCommand,
         ReceiveMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getConfig } from '../services/awsClients';
import { validateQueueName } from '../services/validation';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import CreateModal from '../components/CreateModal';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function SQSPage({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [queueAttrs, setQueueAttrs] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [showSend, setShowSend] = useState(false);

  const loadQueuesFn = useCallback(async () => {
    const client = new SQSClient(getConfig());
    const res = await client.send(new ListQueuesCommand({ MaxResults: 100 }));
    const urls = res.QueueUrls || [];
    const attrs = {};
    await Promise.all(urls.map(async url => {
      try {
        const a = await client.send(new GetQueueAttributesCommand({
          QueueUrl: url,
          AttributeNames: ['All'],
        }));
        attrs[url] = a.Attributes || {};
      } catch {}
    }));
    setQueueAttrs(attrs);
    return urls;
  }, []);

  const { items: queues, loading, refresh: loadQueues } = useAwsResource(loadQueuesFn, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const createQueue = async (values) => {
    const check = validateQueueName(values.queueName, values.fifo === 'true');
    if (!check.valid) { showNotification(check.error, 'error'); return; }
    try {
      const client = new SQSClient(getConfig());
      const name = values.fifo === 'true' && !values.queueName.endsWith('.fifo')
        ? values.queueName + '.fifo' : values.queueName;
      const attrs = values.fifo === 'true' ? { FifoQueue: 'true' } : {};
      await client.send(new CreateQueueCommand({ QueueName: name, Attributes: attrs }));
      showNotification(`Queue "${name}" created`);
      setShowCreate(false);
      loadQueues();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteQueue = (url) => {
    const name = url.split('/').pop();
    requestConfirm({
      title: `Delete queue "${name}"?`,
      message: 'All messages in this queue will be lost. This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const client = new SQSClient(getConfig());
          await client.send(new DeleteQueueCommand({ QueueUrl: url }));
          showNotification('Queue deleted');
          if (selectedQueue === url) setSelectedQueue(null);
          loadQueues();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const peekMessages = async (url) => {
    setSelectedQueue(url);
    setMsgLoading(true);
    try {
      const client = new SQSClient(getConfig());
      const res = await client.send(new ReceiveMessageCommand({
        QueueUrl: url,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 0,
        VisibilityTimeout: 0,
        AttributeNames: ['All'],
        MessageAttributeNames: ['All'],
      }));
      setMessages(res.Messages || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setMsgLoading(false); }
  };

  const sendMessage = async () => {
    if (!sendMsg.trim()) return;
    try {
      const client = new SQSClient(getConfig());
      await client.send(new SendMessageCommand({ QueueUrl: selectedQueue, MessageBody: sendMsg }));
      showNotification('Message sent');
      setSendMsg('');
      setShowSend(false);
      peekMessages(selectedQueue);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const getName = (url) => url.split('/').pop();
  const getAttr = (url, key) => queueAttrs[url]?.[key];

  // ── Queue detail view ─────────────────────────────────────────────────────────
  if (selectedQueue) {
    const name = getName(selectedQueue);
    const attrs = queueAttrs[selectedQueue] || {};
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Layers size={20} /> SQS &gt; {name}</div>
            <div className="page-subtitle">
              {getAttr(selectedQueue, 'ApproximateNumberOfMessages') || 0} messages available
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedQueue(null)}>&larr; Queues</button>
            <button className="btn btn-secondary btn-sm" onClick={() => peekMessages(selectedQueue)}>
              <RefreshCw size={13} className={msgLoading ? 'spin' : ''} />
            </button>
            <button className="btn btn-primary" onClick={() => setShowSend(true)}>
              <Send size={13} /> Send message
            </button>
          </div>
        </div>

        <div className="stats-row">
          {[
            ['Visible Messages', 'ApproximateNumberOfMessages'],
            ['In Flight', 'ApproximateNumberOfMessagesNotVisible'],
            ['Delayed', 'ApproximateNumberOfMessagesDelayed'],
          ].map(([label, key]) => (
            <div key={key} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{attrs[key] || '0'}</div>
            </div>
          ))}
          <div className="stat-card">
            <div className="stat-label">Type</div>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-blue">{attrs.FifoQueue === 'true' ? 'FIFO' : 'Standard'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Messages (peek, visibility=0)</span>
          </div>
          {msgLoading ? (
            <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          ) : messages.length === 0 ? (
            <div className="empty-state"><Layers size={30} /><h3>No messages</h3><p>The queue appears empty.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Message ID</th><th>Body (preview)</th><th>Sent</th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.MessageId}>
                    <td className="mono" style={{ fontSize: 11 }}>{m.MessageId?.slice(0, 16)}...</td>
                    <td style={{ maxWidth: 400 }}>{m.Body?.slice(0, 120)}{m.Body?.length > 120 ? '...' : ''}</td>
                    <td style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>
                      {m.Attributes?.SentTimestamp ? new Date(parseInt(m.Attributes.SentTimestamp)).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showSend && (
          <div className="modal-overlay" onClick={() => setShowSend(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Send Message to {name}</span>
                <button className="close-btn" onClick={() => setShowSend(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Message Body</label>
                  <textarea className="input" style={{ width: '100%', minHeight: 120, resize: 'vertical' }}
                    value={sendMsg} onChange={e => setSendMsg(e.target.value)}
                    placeholder='Message body' autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowSend(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
              </div>
            </div>
          </div>
        )}
        {confirmDialog}
      </div>
    );
  }

  // ── Queue list (using DataTable) ──────────────────────────────────────────────
  const queueData = queues.map(url => ({
    url,
    name: getName(url),
    type: getAttr(url, 'FifoQueue') === 'true' ? 'FIFO' : 'Standard',
    messages: getAttr(url, 'ApproximateNumberOfMessages') || '0',
    urlDisplay: url.slice(0, 50) + '...',
  }));

  const queueColumns = [
    {
      key: 'name', label: 'Queue name',
      render: (val, row) => <button className="link-btn" onClick={() => peekMessages(row.url)}>{val}</button>,
    },
    {
      key: 'type', label: 'Type',
      render: (val) => <span className="badge badge-blue">{val}</span>,
    },
    { key: 'messages', label: 'Messages' },
    { key: 'urlDisplay', label: 'URL', mono: true },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Layers size={20} /> SQS Queues</div>
          <div className="page-subtitle">{queues.length} queue{queues.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadQueues}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create queue</button>
        </div>
      </div>

      <DataTable
        columns={queueColumns}
        data={queueData}
        loading={loading}
        rowKey="url"
        emptyIcon={Layers}
        emptyTitle="No queues"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => peekMessages(row.url)}><Eye size={12} /> Peek</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteQueue(row.url)}><Trash2 size={12} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create SQS Queue"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createQueue}
        submitLabel="Create"
        fields={[
          { name: 'queueName', label: 'Queue Name', placeholder: 'my-queue', required: true },
          { name: 'fifo', label: 'FIFO Queue', type: 'select', options: ['false', 'true'], defaultValue: 'false' },
        ]}
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
