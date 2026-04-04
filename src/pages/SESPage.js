import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Plus, Trash2, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';

const SES_STATUS_MAP = {
  Success: 'green',
  Pending: 'yellow',
};

export default function SESPage({ showNotification }) {
  const [identities, setIdentities] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [verificationAttrs, setVerificationAttrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSend, setShowSend] = useState(false);
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

  const verifyIdentity = async (values) => {
    if (!values.email) return;
    try {
      const { SESClient, VerifyEmailIdentityCommand } = await import('@aws-sdk/client-ses');
      const client = new SESClient(getConfig());
      await client.send(new VerifyEmailIdentityCommand({ EmailAddress: values.email }));
      showNotification(`Identity "${values.email}" verification initiated`);
      setShowAdd(false);
      load();
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

  // Build table data — identities are strings, enrich with verification attrs
  const tableData = identities.map(id => {
    const attr = verificationAttrs[id] || {};
    return { id, VerificationStatus: attr.VerificationStatus || 'Unknown', VerificationToken: attr.VerificationToken };
  });

  const identityColumns = [
    { key: 'id', label: 'Email / Domain', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'VerificationStatus', label: 'Verification Status', render: (v) => <StatusBadge status={v} colorMap={SES_STATUS_MAP} /> },
    { key: 'VerificationToken', label: 'Token', mono: true, render: (v) => <span style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{v?.slice(0, 20) || '-'}</span> },
  ];

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
          <strong style={{ color: 'var(--aws-text)' }}>LocalStack SES tip:</strong> In LocalStack, all emails are captured locally — nothing is actually sent.
          You can view sent emails at <span className="mono" style={{ fontSize: 11, color: 'var(--aws-cyan)' }}>
            {(localStorage.getItem('ls_endpoint') || 'http://localhost:4566')}/_aws/ses
          </span>
        </div>
      </div>

      <DataTable
        columns={identityColumns}
        data={tableData}
        loading={loading}
        rowKey="id"
        emptyIcon={Mail}
        emptyTitle="No verified identities"
        emptyDescription="Add email addresses to send from via SES."
        actions={(row) => (
          <button className="btn btn-danger btn-sm" onClick={() => deleteIdentity(row.id)}><Trash2 size={11} /></button>
        )}
      />

      <CreateModal
        title="Verify Email Identity"
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={verifyIdentity}
        fields={[
          {
            name: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'sender@example.com',
            helpText: 'In LocalStack, identities are auto-verified. No real verification email is sent.',
          },
        ]}
        submitLabel="Verify"
      />

      {showSend && (
        <div className="modal-overlay" onClick={() => setShowSend(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Send Test Email</span>
              <button className="close-btn" onClick={() => setShowSend(false)}><span style={{ fontSize: 16 }}>&times;</span></button>
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
