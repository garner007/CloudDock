import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCw, Plus, Trash2, Square } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import { useAwsResource } from '../hooks/useAwsResource';
import { useAwsAction } from '../hooks/useAwsAction';
import { fmtDate } from '../utils/formatters';

const EC2_STATUS_MAP = {
  running: 'green', stopped: 'gray', terminated: 'red',
  pending: 'yellow', stopping: 'yellow', 'shutting-down': 'yellow',
};

const VPC_STATUS_MAP = {
  available: 'green',
};

export default function EC2Page({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [instances, setInstances] = useState([]);
  const [keyPairs, setKeyPairs] = useState([]);
  const [secGroups, setSecGroups] = useState([]);
  const [vpcs, setVpcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('instances');
  const [showCreateKey, setShowCreateKey] = useState(false);

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

  const createKeyPairFn = useCallback(async (name) => {
    const { EC2Client, CreateKeyPairCommand } = await import('@aws-sdk/client-ec2');
    const client = new EC2Client(getConfig());
    await client.send(new CreateKeyPairCommand({ KeyName: name }));
  }, []);

  const { execute: createKeyPair } = useAwsAction(createKeyPairFn, {
    showNotification,
    onSuccess: () => { setShowCreateKey(false); load(); },
  });

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

  const TABS = [
    { id: 'instances', label: `Instances (${instances.length})` },
    { id: 'keypairs', label: `Key Pairs (${keyPairs.length})` },
    { id: 'secgroups', label: `Security Groups (${secGroups.length})` },
    { id: 'vpcs', label: `VPCs (${vpcs.length})` },
  ];

  const instanceColumns = [
    { key: 'Tags', label: 'Name', render: (v) => <span style={{ fontWeight: 500 }}>{getName(v)}</span> },
    { key: 'InstanceId', label: 'Instance ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'InstanceType', label: 'Type', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'State', label: 'State', render: (v) => <StatusBadge status={v?.Name} colorMap={EC2_STATUS_MAP} /> },
    { key: 'PublicIpAddress', label: 'Public IP', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v || '-'}</span> },
    { key: 'ImageId', label: 'AMI', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'LaunchTime', label: 'Launched', render: (v) => <span style={{ fontSize: 11 }}>{fmtDate(v)}</span> },
  ];

  const keyPairColumns = [
    { key: 'KeyName', label: 'Name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'KeyPairId', label: 'Key ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'KeyFingerprint', label: 'Fingerprint', mono: true, render: (v) => <span style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{v?.slice(0, 32)}...</span> },
    { key: 'KeyType', label: 'Type', render: (v) => <span className="badge badge-gray">{v || 'rsa'}</span> },
  ];

  const secGroupColumns = [
    { key: 'GroupName', label: 'Name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'GroupId', label: 'Group ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'VpcId', label: 'VPC ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v || '-'}</span> },
    { key: 'Description', label: 'Description', render: (v) => <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v}</span> },
  ];

  const vpcColumns = [
    { key: 'VpcId', label: 'VPC ID', mono: true, render: (v) => <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span> },
    { key: 'State', label: 'State', render: (v) => <StatusBadge status={v} colorMap={VPC_STATUS_MAP} /> },
    { key: 'CidrBlock', label: 'CIDR', mono: true, render: (v) => <span style={{ fontSize: 12 }}>{v}</span> },
    { key: 'IsDefault', label: 'Default', render: (v) => v ? <span className="badge badge-blue">Default</span> : '-' },
    { key: 'InstanceTenancy', label: 'Tenancy' },
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
        <DataTable
          columns={instanceColumns}
          data={instances}
          loading={loading}
          rowKey="InstanceId"
          emptyIcon={Monitor}
          emptyTitle="No instances"
          emptyDescription="Launch EC2 instances using the AWS CLI or SDK pointed at LocalStack."
          actions={(row) => (
            row.State?.Name !== 'terminated' ? (
              <button className="btn btn-danger btn-sm" onClick={() => terminateInstance(row.InstanceId)}>
                <Square size={11} /> Terminate
              </button>
            ) : null
          )}
        />
      )}

      {tab === 'keypairs' && (
        <>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Key Pairs</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateKey(true)}><Plus size={13} /> Create key pair</button>
            </div>
          </div>
          <DataTable
            columns={keyPairColumns}
            data={keyPairs}
            loading={loading}
            rowKey="KeyPairId"
            emptyIcon={Monitor}
            emptyTitle="No key pairs"
            actions={(row) => (
              <button className="btn btn-danger btn-sm" onClick={() => deleteKeyPair(row.KeyName)}><Trash2 size={11} /></button>
            )}
          />
        </>
      )}

      {tab === 'secgroups' && (
        <DataTable
          columns={secGroupColumns}
          data={secGroups}
          loading={loading}
          rowKey="GroupId"
          emptyIcon={Monitor}
          emptyTitle="No security groups"
        />
      )}

      {tab === 'vpcs' && (
        <DataTable
          columns={vpcColumns}
          data={vpcs}
          loading={loading}
          rowKey="VpcId"
          emptyIcon={Monitor}
          emptyTitle="No VPCs"
        />
      )}

      <CreateModal
        title="Create Key Pair"
        open={showCreateKey}
        onClose={() => setShowCreateKey(false)}
        onSubmit={(values) => createKeyPair(values.keyName)}
        fields={[
          { name: 'keyName', label: 'Key Pair Name', required: true, placeholder: 'my-key-pair' },
        ]}
        submitLabel="Create"
      />

      {confirmDialog}
    </div>
  );
}
