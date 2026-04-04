import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Plus, Trash2, X, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function ACMPage({ showNotification }) {
  const [certs, setCerts] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [newCert, setNewCert] = useState({ domain: '', altNames: '', validation: 'DNS' });
  const [selectedCert, setSelectedCert] = useState(null);

  const loadCerts = useCallback(async () => {
    setLoading(true);
    try {
      const { ACMClient, ListCertificatesCommand, DescribeCertificateCommand } = await import('@aws-sdk/client-acm');
      const client = new ACMClient(getConfig());
      const res = await client.send(new ListCertificatesCommand({ MaxItems: 100 }));
      const summaries = res.CertificateSummaryList || [];
      setCerts(summaries);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadCerts(); }, [loadCerts]);

  const requestCert = async () => {
    if (!newCert.domain) return;
    try {
      const { ACMClient, RequestCertificateCommand } = await import('@aws-sdk/client-acm');
      const client = new ACMClient(getConfig());
      const alts = newCert.altNames.split(',').map(s => s.trim()).filter(Boolean);
      await client.send(new RequestCertificateCommand({
        DomainName: newCert.domain,
        ValidationMethod: newCert.validation,
        SubjectAlternativeNames: alts.length > 0 ? [newCert.domain, ...alts] : undefined,
      }));
      showNotification(`Certificate requested for ${newCert.domain}`);
      setShowRequest(false);
      setNewCert({ domain: '', altNames: '', validation: 'DNS' });
      loadCerts();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteCert = (arn) => {
    requestConfirm({
      title: 'Delete this certificate?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { ACMClient, DeleteCertificateCommand } = await import('@aws-sdk/client-acm');
        const client = new ACMClient(getConfig());
        await client.send(new DeleteCertificateCommand({ CertificateArn: arn }));
        showNotification('Certificate deleted'); loadCerts();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const describeCert = async (arn) => {
    try {
      const { ACMClient, DescribeCertificateCommand } = await import('@aws-sdk/client-acm');
      const client = new ACMClient(getConfig());
      const res = await client.send(new DescribeCertificateCommand({ CertificateArn: arn }));
      setSelectedCert(res.Certificate);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const statusColor = (s) => ({
    ISSUED: 'badge-green', PENDING_VALIDATION: 'badge-yellow',
    EXPIRED: 'badge-red', REVOKED: 'badge-red', FAILED: 'badge-red',
  }[s] || 'badge-gray');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><ShieldCheck size={20} /> ACM — Certificate Manager</div>
          <div className="page-subtitle">{certs.length} certificate{certs.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadCerts}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowRequest(true)}><Plus size={14} /> Request certificate</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : certs.length === 0 ? (
          <div className="empty-state"><ShieldCheck size={40} /><h3>No certificates</h3>
            <p>Request SSL/TLS certificates for your domains.</p>
            <button className="btn btn-primary" onClick={() => setShowRequest(true)}><Plus size={14} /> Request certificate</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Domain name</th><th>Status</th><th>Type</th><th>ARN</th><th></th></tr></thead>
            <tbody>
              {certs.map(c => (
                <tr key={c.CertificateArn}>
                  <td style={{ fontWeight: 500 }}>{c.DomainName}</td>
                  <td><span className={`badge ${statusColor(c.Status)}`}>{c.Status}</span></td>
                  <td><span className="badge badge-gray">{c.Type || 'AMAZON_ISSUED'}</span></td>
                  <td className="mono" style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{c.CertificateArn?.slice(-24)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => describeCert(c.CertificateArn)}><Eye size={11} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCert(c.CertificateArn)}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRequest && (
        <div className="modal-overlay" onClick={() => setShowRequest(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Request Certificate</span>
              <button className="close-btn" onClick={() => setShowRequest(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Domain Name</label>
                <input className="input" style={{ width: '100%' }} value={newCert.domain}
                  onChange={e => setNewCert({ ...newCert, domain: e.target.value })} placeholder="example.com" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Alternative Names (comma-separated)</label>
                <input className="input" style={{ width: '100%' }} value={newCert.altNames}
                  onChange={e => setNewCert({ ...newCert, altNames: e.target.value })} placeholder="www.example.com, api.example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Validation Method</label>
                <select className="input" style={{ width: '100%' }} value={newCert.validation}
                  onChange={e => setNewCert({ ...newCert, validation: e.target.value })}>
                  <option value="DNS">DNS</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRequest(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={requestCert}>Request</button>
            </div>
          </div>
        </div>
      )}

      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selectedCert.DomainName}</span>
              <button className="close-btn" onClick={() => setSelectedCert(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <pre className="detail-json">{JSON.stringify(selectedCert, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
