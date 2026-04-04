import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Plus, Trash2, X, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function SESPage({ showNotification }) {
  const [identities, setIdentities] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [verificationAttrs, setVerificationAttrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [newIdentity, setNewIdentity] = useState('');
  const [email, setEmail] = useState({ to: '', from: '', subject: '', body: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { SESClient, ListIdentitiesCommand, GetIdentityVerificationAttributesCommand } = await import('@aws-sdk/client-ses');
      const client = new SESClient(getConfig());
      const res = await client.send(new ListIdentitiesCommand({ IdentityType: 'EmailAddress', MaxItems: 100 }));
      const ids = res.Identities || [];
      setIdentities(ids);
      if (ids.length > 0) {
        const attrs = await client.send(new GetIdentityVerificationAttributesCommand({ Identities: ids }));
        setVerificationAttrs(attrs.VerificationAttributes || {});
      }
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const verifyIdentity = async () => {
    if (!newIdentity) return;
    try {
      const { SESClient, VerifyEmailIdentityCommand } = await import('@aws-sdk/client-ses');
      const client = new SESClient(getConfig());
      await client.send(new VerifyEmailIdentityCommand({ EmailAddress: newIdentity }));
      showNotification(`Identity "${newIdentity}" verification initiated`);
      setShowAdd(false); setNewIdentity(''); load();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteIdentity = (identity) => {
    requestConfirm({
      title: `Remove identity "${identity}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { SESClient, DeleteIdentityCommand } = await import('@aws-sdk/client-ses');
        const client = new SESClient(getConfig());
        await client.send(new DeleteIdentityCommand({ Identity: identity }));
        showNotification('Identity removed'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const sendEmail = async () => {
    try {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const client = new SESClient(getConfig());
      await client.send(new SendEmailCommand({
        Source: email.from,
        Destination: { ToAddresses: [email.to] },
        Message: {
          Subject: { Data: email.subject },
          Body: { Text: { Data: email.body } },
        },
      }));
      showNotification('Email sent via SES');
      setShowSend(false);
      setEmail({ to: '', from: '', subject: '', body: '' });
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const statusColor = (s) => s === 'Success' ? 'badge-green' : s === 'Pending' ? 'badge-yellow' : 'badge-gray';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Mail size={20} /> SES — Simple Email Service</div>
          <div className="page-subtitle">{identities.length} verified identit{identities.length !== 1 ? 'ies' : 'y'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-secondary" onClick={() => setShowSend(true)}><Send size={13} /> Send test email</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Verify identity</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: 14, background: 'rgba(255,153,0,0.06)', border: '1px solid rgba(255,153,0,0.2)' }}>
        <div style={{ fontSize: 12, color: 'var(--aws-text-muted)', lineHeight: 1.6 }}>
          💡 <strong style={{ color: 'var(--aws-text)' }}>LocalStack SES tip:</strong> In LocalStack, all emails are captured locally — nothing is actually sent. 
          You can view sent emails at <span className="mono" style={{ fontSize: 11, color: 'var(--aws-cyan)' }}>
            {(localStorage.getItem('ls_endpoint') || 'http://localhost:4566')}/_aws/ses
          </span>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : identities.length === 0 ? (
          <div className="empty-state">
            <Mail size={40} /><h3>No verified identities</h3>
            <p>Add email addresses to send from via SES.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Verify identity</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Email / Domain</th><th>Verification Status</th><th>Token</th><th></th></tr></thead>
            <tbody>
              {identities.map(id => {
                const attr = verificationAttrs[id] || {};
                return (
                  <tr key={id}>
                    <td style={{ fontWeight: 500 }}>{id}</td>
                    <td><span className={`badge ${statusColor(attr.VerificationStatus)}`}>{attr.VerificationStatus || 'Unknown'}</span></td>
                    <td className="mono" style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{attr.VerificationToken?.slice(0, 20) || '-'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteIdentity(id)}><Trash2 size={11} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Verify Email Identity</span>
              <button className="close-btn" onClick={() => setShowAdd(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="input" style={{ width: '100%' }} value={newIdentity}
                  onChange={e => setNewIdentity(e.target.value)} placeholder="sender@example.com" autoFocus
                  onKeyDown={e => e.key === 'Enter' && verifyIdentity()} />
                <div style={{ fontSize: 11, color: 'var(--aws-text-muted)', marginTop: 6 }}>
                  In LocalStack, identities are auto-verified. No real verification email is sent.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={verifyIdentity}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {showSend && (
        <div className="modal-overlay" onClick={() => setShowSend(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Send Test Email</span>
              <button className="close-btn" onClick={() => setShowSend(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {[['From', 'from', 'sender@example.com'], ['To', 'to', 'recipient@example.com'], ['Subject', 'subject', 'Test from LocalStack']].map(([label, key, ph]) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="input" style={{ width: '100%' }} value={email[key]}
                    onChange={e => setEmail({ ...email, [key]: e.target.value })} placeholder={ph} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Body</label>
                <textarea className="input" style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
                  value={email.body} onChange={e => setEmail({ ...email, body: e.target.value })}
                  placeholder="Email body text..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSend(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendEmail}><Send size={13} /> Send</button>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
