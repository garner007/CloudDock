import React, { useState, useEffect, useCallback } from 'react';
import { Zap, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ServiceUnavailable, { isProOnlyError } from '../components/ServiceUnavailable';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import { useAwsResource } from '../hooks/useAwsResource';
import { useAwsAction } from '../hooks/useAwsAction';

const ELASTICACHE_STATUS_MAP = {
  available: 'green', creating: 'yellow', deleting: 'red', modifying: 'yellow',
};

export default function ElastiCachePage({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [clusters, setClusters] = useState([]);
  const [repGroups, setRepGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('clusters');
  const [showCreate, setShowCreate] = useState(false);
  const [proError, setProError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ElastiCacheClient, DescribeCacheClustersCommand, DescribeReplicationGroupsCommand } = await import('@aws-sdk/client-elasticache');
      const client = new ElastiCacheClient(getConfig());
      const [c, r] = await Promise.all([
        client.send(new DescribeCacheClustersCommand({ ShowCacheNodeInfo: true })),
        client.send(new DescribeReplicationGroupsCommand({})),
      ]);
      setClusters(c.CacheClusters || []);
      setRepGroups(r.ReplicationGroups || []);
    } catch (e) {
      if (isProOnlyError(e)) { setProError(true); return; }
      showNotification(e.message, 'error');
    } finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const createClusterFn = useCallback(async (values) => {
    const { ElastiCacheClient, CreateCacheClusterCommand } = await import('@aws-sdk/client-elasticache');
    const client = new ElastiCacheClient(getConfig());
    await client.send(new CreateCacheClusterCommand({
      CacheClusterId: values.id,
      Engine: values.engine,
      CacheNodeType: values.nodeType,
      NumCacheNodes: parseInt(values.numNodes) || 1,
    }));
  }, []);

  const { execute: createCluster } = useAwsAction(createClusterFn, {
    showNotification,
    onSuccess: () => { setShowCreate(false); load(); },
  });

  const deleteCluster = (id) => {
    requestConfirm({
      title: `Delete cluster "${id}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { ElastiCacheClient, DeleteCacheClusterCommand } = await import('@aws-sdk/client-elasticache');
        const client = new ElastiCacheClient(getConfig());
        await client.send(new DeleteCacheClusterCommand({ CacheClusterId: id }));
        showNotification('Cluster deletion initiated');
        load();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const engineBadge = (e) => e?.toLowerCase() === 'redis' ? 'badge-red' : 'badge-blue';

  const clusterColumns = [
    { key: 'CacheClusterId', label: 'Cluster ID', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'Engine', label: 'Engine', render: (v, row) => <span className={`badge ${engineBadge(v)}`}>{v} {row.EngineVersion}</span> },
    { key: 'CacheClusterStatus', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={ELASTICACHE_STATUS_MAP} /> },
    { key: 'CacheNodeType', label: 'Node type', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'NumCacheNodes', label: 'Nodes' },
    { key: 'ConfigurationEndpoint', label: 'Endpoint', render: (v, row) => {
      const ep = v ? `${v.Address}:${v.Port}` :
        row.CacheNodes?.[0]?.Endpoint ? `${row.CacheNodes[0].Endpoint.Address}:${row.CacheNodes[0].Endpoint.Port}` : '-';
      return <span className="mono" style={{ fontSize: 11, color: 'var(--aws-cyan)' }}>{ep}</span>;
    }},
  ];

  const repGroupColumns = [
    { key: 'ReplicationGroupId', label: 'Group ID', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'Description', label: 'Description', render: (v) => <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v}</span> },
    { key: 'Status', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={ELASTICACHE_STATUS_MAP} /> },
    { key: 'ClusterEnabled', label: 'Cluster mode', render: (v) => <span className={`badge ${v ? 'badge-green' : 'badge-gray'}`}>{v ? 'Enabled' : 'Disabled'}</span> },
    { key: 'MemberClusters', label: 'Members', render: (v) => v?.length || 0 },
  ];

  if (proError) return <ServiceUnavailable serviceName="ElastiCache" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Zap size={20} /> ElastiCache</div>
          <div className="page-subtitle">{clusters.length} clusters · {repGroups.length} replication groups</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create cluster</button>
        </div>
      </div>

      <div className="tab-bar">
        {['clusters', 'replication groups'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'clusters' && (
        <DataTable
          columns={clusterColumns}
          data={clusters}
          loading={loading}
          rowKey="CacheClusterId"
          emptyIcon={Zap}
          emptyTitle="No clusters"
          actions={(row) => (
            <button className="btn btn-danger btn-sm" onClick={() => deleteCluster(row.CacheClusterId)}><Trash2 size={11} /></button>
          )}
        />
      )}

      {tab === 'replication groups' && (
        <DataTable
          columns={repGroupColumns}
          data={repGroups}
          loading={loading}
          rowKey="ReplicationGroupId"
          emptyIcon={Zap}
          emptyTitle="No replication groups"
        />
      )}

      <CreateModal
        title="Create Cache Cluster"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(values) => createCluster(values)}
        fields={[
          { name: 'id', label: 'Cluster ID', required: true, placeholder: 'my-redis-cluster' },
          { name: 'engine', label: 'Engine', type: 'select', options: ['redis', 'memcached'], defaultValue: 'redis' },
          { name: 'nodeType', label: 'Node Type', type: 'select', options: ['cache.t2.micro','cache.t3.micro','cache.t3.small','cache.t3.medium','cache.m5.large','cache.r5.large'], defaultValue: 'cache.t3.micro' },
          { name: 'numNodes', label: 'Number of Nodes', type: 'number', defaultValue: '1' },
        ]}
        submitLabel="Create Cluster"
      />

      {confirmDialog}
    </div>
  );
}
