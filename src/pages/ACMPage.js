import React, { useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Plus, Trash2, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import DetailPanel from '../components/DetailPanel';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const STATUS_COLORS = {
  ISSUED: 'green', PENDING_VALIDATION: 'yellow',
  EXPIRED: 'red', REVOKED: 'red', FAILED: 'red',
};

const CREATE_FIELDS = [
  { name: 'domain', label: 'Domain Name', required: true, placeholder: 'example.com' },
  { name: 'altNames', label: 'Subject Alternative Names (comma-separated)', placeholder: 'www.example.com, api.example.com' },
  { name: 'validation', label: 'Validation Method', type: 'select', options: ['DNS', 'EMAIL'], defaultValue: 'DNS' },
];

export default function ACMPage({ showNotification }) {
  const [showRequest, setShowRequest] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const { confirmDialog, requestConfirm } = useConfirm();

  const loadCerts = useCallback(async () => {
    const { ACMClient, ListCertificatesCommand } = await import('@aws-sdk/client-acm');
    const client = new ACMClient(getConfig());
    const res = await client.send(new ListCertificatesCommand({ MaxItems: 100 }));
    return res.CertificateSummaryList || [];
  }, []);

  const { items: certs, loading, refresh } = useAwsResource(loadCerts, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const requestCert = async (values) => {
    try {
      const { ACMClient, RequestCertificateCommand } = await import('@aws-sdk/client-acm');
      const client = new ACMClient(getConfig());
      const alts = values.altNames.split(',').map(s => s.trim()).filter(Boolean);
      await client.send(new RequestCertificateCommand({
        DomainName: values.domain,
        ValidationMethod: values.validation,
        SubjectAlternativeNames: alts.length > 0 ? [values.domain, ...alts] : undefined,
      }));
      showNotification(`Certificate requested for ${values.domain}`);
      setShowRequest(false);
      refresh();
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
          showNotification('Certificate deleted');
          refresh();
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

  const columns = [
    { key: 'DomainName', label: 'Domain name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'Status', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={STATUS_COLORS} /> },
    { key: 'Type', label: 'Type', render: (v) => <span className="badge badge-gray">{v || 'AMAZON_ISSUED'}</span> },
    { key: 'CertificateArn', label: 'ARN', mono: true, render: (v) => (
      <span style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{v?.slice(-24)}</span>
    )},
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><ShieldCheck size={20} /> ACM — Certificate Manager</div>
          <div className="page-subtitle">{certs.length} certificate{certs.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowRequest(true)}><Plus size={14} /> Request certificate</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={certs}
        loading={loading}
        rowKey="CertificateArn"
        emptyIcon={ShieldCheck}
        emptyTitle="No certificates"
        emptyDescription="Request SSL/TLS certificates for your domains."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => describeCert(row.CertificateArn)}><Eye size={11} /></button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteCert(row.CertificateArn)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Request Certificate"
        open={showRequest}
        onClose={() => setShowRequest(false)}
        onSubmit={requestCert}
        fields={CREATE_FIELDS}
        submitLabel="Request"
      />

      {selectedCert && (
        <DetailPanel title={selectedCert.DomainName} onClose={() => setSelectedCert(null)}>
          <pre className="detail-json">{JSON.stringify(selectedCert, null, 2)}</pre>
        </DetailPanel>
      )}

      {confirmDialog}
    </div>
  );
}
