import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCw, Plus, Trash2, X, Play, Square } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const STATUS_COLOR = {
  running: 'badge-green', stopped: 'badge-gray', terminated: 'badge-red',
  pending: 'badge-yellow', stopping: 'badge-yellow', 'shutting-down': 'badge-yellow',
};

export default function EC2Page({ showNotification }) {
  const [instances, setInstances] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [keyPairs, setKeyPairs] = useState([]);
  const [secGroups, setSecGroups] = useState([]);
  const [vpcs, setVpcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('instances');
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { EC2Client, DescribeInstancesCommand, DescribeKeyPairsCommand,
              DescribeSecurityGroupsCommand, DescribeVpcsCommand } = await import('@aws-sdk/client-ec2');
      const client = new EC2Client(getConfig());
      const [inst, keys, sgs, vpcsRes] = await Promise.all([
        client.send(new DescribeInstancesCommand({})),
        client.send(new DescribeKeyPairsCommand({})),
        client.send(new DescribeSecurityGroupsCommand({})),
        client.send(new DescribeVpcsCommand({})),
      ]);
      const allInstances = (inst.Reservations || []).flatMap(r => r.Instances || []);
      setInstances(allInstances);
      setKeyPairs(keys.KeyPairs || []);
      setSecGroups(sgs.SecurityGroups || []);
      setVpcs(vpcsRes.Vpcs || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const createKeyPair = async () => {
    if (!newKeyName) return;
    try {
      const { EC2Client, CreateKeyPairCommand } = await import('@aws-sdk/client-ec2');
      const client = new EC2Client(getConfig());
      const res = await client.send(new CreateKeyPairCommand({ KeyName: newKeyName }));
      showNotification(`Key pair "${newKeyName}" created`);
      // In a real app you'd save res.KeyMaterial — the private key
      setShowCreateKey(false); setNewKeyName(''); load();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteKeyPair = (name) => {
    requestConfirm({
      title: `Delete key pair "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { EC2Client, DeleteKeyPairCommand } = await import('@aws-sdk/client-ec2');
        const client = new EC2Client(getConfig());
        await client.send(new DeleteKeyPairCommand({ KeyName: name }));
        showNotification('Key pair deleted'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const terminateInstance = (id) => {
    requestConfirm({
      title: `Terminate instance ${id}?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { EC2Client, TerminateInstancesCommand } = await import('@aws-sdk/client-ec2');
        const client = new EC2Client(getConfig());
        await client.send(new TerminateInstancesCommand({ InstanceIds: [id] }));
        showNotification('Instance terminated'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const getName = (tags) => tags?.find(t => t.Key === 'Name')?.Value || '-';
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  const TABS = [
    { id: 'instances', label: `Instances (${instances.length})` },
    { id: 'keypairs', label: `Key Pairs (${keyPairs.length})` },
    { id: 'secgroups', label: `Security Groups (${secGroups.length})` },
    { id: 'vpcs', label: `VPCs (${vpcs.length})` },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Monitor size={20} /> EC2</div>
          <div className="page-subtitle">{instances.length} instance{instances.length !== 1 ? 's' : ''} · {vpcs.length} VPC{vpcs.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(t => <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === 'instances' && (
        <div className="card">
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : instances.length === 0 ? (
            <div className="empty-state"><Monitor size={40} /><h3>No instances</h3><p>Launch EC2 instances using the AWS CLI or SDK pointed at LocalStack.</p>
              <pre className="detail-json" style={{ fontSize: 11, marginTop: 8 }}>
{`aws ec2 run-instances --endpoint-url http://localhost:4566 \\
  --image-id ami-12345678 --instance-type t2.micro \\
  --region us-east-1`}
              </pre>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Instance ID</th><th>Type</th><th>State</th><th>Public IP</th><th>AMI</th><th>Launched</th><th></th></tr></thead>
              <tbody>
                {instances.map(i => (
                  <tr key={i.InstanceId}>
                    <td style={{ fontWeight: 500 }}>{getName(i.Tags)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{i.InstanceId}</td>
                    <td><span className="badge badge-gray">{i.InstanceType}</span></td>
                    <td><span className={`badge ${STATUS_COLOR[i.State?.Name] || 'badge-gray'}`}>{i.State?.Name}</span></td>
                    <td className="mono" style={{ fontSize: 11 }}>{i.PublicIpAddress || '-'}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{i.ImageId}</td>
                    <td style={{ fontSize: 11 }}>{fmtDate(i.LaunchTime)}</td>
                    <td>
                      {i.State?.Name !== 'terminated' && (
                        <button className="btn btn-danger btn-sm" onClick={() => terminateInstance(i.InstanceId)}>
                          <Square size={11} /> Terminate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'keypairs' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Key Pairs</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateKey(true)}><Plus size={13} /> Create key pair</button>
          </div>
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : keyPairs.length === 0 ? (
            <div className="empty-state"><Monitor size={30} /><h3>No key pairs</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Key ID</th><th>Fingerprint</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {keyPairs.map(k => (
                  <tr key={k.KeyPairId}>
                    <td style={{ fontWeight: 500 }}>{k.KeyName}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{k.KeyPairId}</td>
                    <td className="mono" style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{k.KeyFingerprint?.slice(0, 32)}...</td>
                    <td><span className="badge badge-gray">{k.KeyType || 'rsa'}</span></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteKeyPair(k.KeyName)}><Trash2 size={11} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'secgroups' && (
        <div className="card">
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : secGroups.length === 0 ? (
            <div className="empty-state"><Monitor size={30} /><h3>No security groups</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Group ID</th><th>VPC ID</th><th>Description</th></tr></thead>
              <tbody>
                {secGroups.map(sg => (
                  <tr key={sg.GroupId}>
                    <td style={{ fontWeight: 500 }}>{sg.GroupName}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{sg.GroupId}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{sg.VpcId || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{sg.Description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'vpcs' && (
        <div className="card">
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : vpcs.length === 0 ? (
            <div className="empty-state"><Monitor size={30} /><h3>No VPCs</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>VPC ID</th><th>State</th><th>CIDR</th><th>Default</th><th>Tenancy</th></tr></thead>
              <tbody>
                {vpcs.map(v => (
                  <tr key={v.VpcId}>
                    <td className="mono" style={{ fontWeight: 500, fontSize: 12 }}>{v.VpcId}</td>
                    <td><span className={`badge ${v.State === 'available' ? 'badge-green' : 'badge-yellow'}`}>{v.State}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{v.CidrBlock}</td>
                    <td>{v.IsDefault ? <span className="badge badge-blue">Default</span> : '-'}</td>
                    <td>{v.InstanceTenancy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreateKey && (
        <div className="modal-overlay" onClick={() => setShowCreateKey(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Key Pair</span>
              <button className="close-btn" onClick={() => setShowCreateKey(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Key Pair Name</label>
                <input className="input" style={{ width: '100%' }} value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)} placeholder="my-key-pair" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateKey(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createKeyPair}>Create</button>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
