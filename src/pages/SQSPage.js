import React, { useState, useEffect, useCallback } from 'react';
import { Layers, RefreshCw, Plus, Trash2, X, Send, Eye, AlertCircle } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { validateQueueName } from '../services/validation';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function SQSPage({ showNotification }) {
  const [queues, setQueues] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [queueAttrs, setQueueAttrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newQueue, setNewQueue] = useState({ name: '', fifo: false });
  const [queueNameError, setQueueNameError] = useState('');
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sendMsg, setSendMsg] = useState('');
  const [showSend, setShowSend] = useState(false);

  const loadQueues = useCallback(async () => {
    setLoading(true);
    try {
      const { SQSClient, ListQueuesCommand, GetQueueAttributesCommand } = await import('@aws-sdk/client-sqs');
      const client = new SQSClient(getConfig());
      const res = await client.send(new ListQueuesCommand({ MaxResults: 100 }));
      const urls = res.QueueUrls || [];
      setQueues(urls);
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
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadQueues(); }, [loadQueues]);

  const createQueue = async () => {
    const check = validateQueueName(newQueue.name, newQueue.fifo);
    if (!check.valid) { setQueueNameError(check.error); return; }
    setQueueNameError('');
    try {
      const { SQSClient, CreateQueueCommand } = await import('@aws-sdk/client-sqs');
      const client = new SQSClient(getConfig());
      const name = newQueue.fifo && !newQueue.name.endsWith('.fifo')
        ? newQueue.name + '.fifo' : newQueue.name;
      const attrs = newQueue.fifo ? { FifoQueue: 'true' } : {};
      await client.send(new CreateQueueCommand({ QueueName: name, Attributes: attrs }));
      showNotification(`Queue "${name}" created`);
      setShowCreate(false);
      setNewQueue({ name: '', fifo: false });
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
          const { SQSClient, DeleteQueueCommand } = await import('@aws-sdk/client-sqs');
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
    setLoading(true);
    try {
      const { SQSClient, ReceiveMessageCommand } = await import('@aws-sdk/client-sqs');
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
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!sendMsg.trim()) return;
    try {
      const { SQSClient, SendMessageCommand } = await import('@aws-sdk/client-sqs');
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
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedQueue(null)}>← Queues</button>
            <button className="btn btn-secondary btn-sm" onClick={() => peekMessages(selectedQueue)}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
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
          {loading ? (
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
                    placeholder='{"key": "value"}' autoFocus />
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

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        ) : queues.length === 0 ? (
          <div className="empty-state"><Layers size={40} /><h3>No queues</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create queue</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Queue name</th><th>Type</th><th>Messages</th><th>URL</th><th></th></tr></thead>
            <tbody>
              {queues.map(url => (
                <tr key={url}>
                  <td><button className="link-btn" onClick={() => peekMessages(url)}>{getName(url)}</button></td>
                  <td><span className="badge badge-blue">{getAttr(url, 'FifoQueue') === 'true' ? 'FIFO' : 'Standard'}</span></td>
                  <td>{getAttr(url, 'ApproximateNumberOfMessages') || '0'}</td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{url.slice(0, 50)}...</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => peekMessages(url)}><Eye size={12} /> Peek</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteQueue(url)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create SQS Queue</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Queue Name</label>
                <input className="input" style={{ width: '100%', borderColor: queueNameError ? 'var(--aws-red)' : undefined }}
                  value={newQueue.name}
                  onChange={e => { setNewQueue({ ...newQueue, name: e.target.value }); if (queueNameError) setQueueNameError(''); }}
                  placeholder="my-queue" autoFocus />
                {queueNameError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, color: 'var(--aws-red)' }}>
                    <AlertCircle size={12} /> {queueNameError}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newQueue.fifo} onChange={e => setNewQueue({ ...newQueue, fifo: e.target.checked })} />
                  <span className="form-label" style={{ margin: 0 }}>FIFO Queue</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createQueue}>Create</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
