import React, { useState, useEffect, useCallback } from 'react';
import { Zap, RefreshCw, Plus, Trash2, X } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ServiceUnavailable, { isProOnlyError } from '../components/ServiceUnavailable';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function ElastiCachePage({ showNotification }) {
  const [clusters, setClusters] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [repGroups, setRepGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('clusters');
  const [showCreate, setShowCreate] = useState(false);
  const [newCluster, setNewCluster] = useState({ id: '', engine: 'redis', nodeType: 'cache.t3.micro', numNodes: 1 });
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

  const createCluster = async () => {
    if (!newCluster.id) return;
    try {
      const { ElastiCacheClient, CreateCacheClusterCommand } = await import('@aws-sdk/client-elasticache');
      const client = new ElastiCacheClient(getConfig());
      await client.send(new CreateCacheClusterCommand({
        CacheClusterId: newCluster.id,
        Engine: newCluster.engine,
        CacheNodeType: newCluster.nodeType,
        NumCacheNodes: newCluster.numNodes,
      }));
      showNotification(`Cluster "${newCluster.id}" creation initiated`);
      setShowCreate(false);
      setNewCluster({ id: '', engine: 'redis', nodeType: 'cache.t3.micro', numNodes: 1 });
      load();
    } catch (e) { showNotification(e.message, 'error'); }
  };

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

  const statusBadge = (s) => {
    const map = { available: 'badge-green', creating: 'badge-yellow', deleting: 'badge-red', modifying: 'badge-yellow' };
    return map[s?.toLowerCase()] || 'badge-gray';
  };

  const engineBadge = (e) => e?.toLowerCase() === 'redis' ? 'badge-red' : 'badge-blue';
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

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

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : tab === 'clusters' ? (
          clusters.length === 0 ? (
            <div className="empty-state">
              <Zap size={40} /><h3>No clusters</h3>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create cluster</button>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Cluster ID</th><th>Engine</th><th>Status</th><th>Node type</th><th>Nodes</th><th>Endpoint</th><th></th></tr></thead>
              <tbody>
                {clusters.map(c => (
                  <tr key={c.CacheClusterId}>
                    <td style={{ fontWeight: 500 }}>{c.CacheClusterId}</td>
                    <td><span className={`badge ${engineBadge(c.Engine)}`}>{c.Engine} {c.EngineVersion}</span></td>
                    <td><span className={`badge ${statusBadge(c.CacheClusterStatus)}`}>{c.CacheClusterStatus}</span></td>
                    <td className="mono" style={{ fontSize: 11 }}>{c.CacheNodeType}</td>
                    <td>{c.NumCacheNodes}</td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--aws-cyan)' }}>
                      {c.ConfigurationEndpoint ? `${c.ConfigurationEndpoint.Address}:${c.ConfigurationEndpoint.Port}` :
                       c.CacheNodes?.[0]?.Endpoint ? `${c.CacheNodes[0].Endpoint.Address}:${c.CacheNodes[0].Endpoint.Port}` : '-'}
                    </td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteCluster(c.CacheClusterId)}><Trash2 size={11} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          repGroups.length === 0 ? (
            <div className="empty-state"><Zap size={40} /><h3>No replication groups</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Group ID</th><th>Description</th><th>Status</th><th>Cluster mode</th><th>Members</th></tr></thead>
              <tbody>
                {repGroups.map(r => (
                  <tr key={r.ReplicationGroupId}>
                    <td style={{ fontWeight: 500 }}>{r.ReplicationGroupId}</td>
                    <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{r.Description}</td>
                    <td><span className={`badge ${statusBadge(r.Status)}`}>{r.Status}</span></td>
                    <td><span className={`badge ${r.ClusterEnabled ? 'badge-green' : 'badge-gray'}`}>{r.ClusterEnabled ? 'Enabled' : 'Disabled'}</span></td>
                    <td>{r.MemberClusters?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Cache Cluster</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cluster ID</label>
                <input className="input" style={{ width: '100%' }} value={newCluster.id}
                  onChange={e => setNewCluster({ ...newCluster, id: e.target.value })} placeholder="my-redis-cluster" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Engine</label>
                <select className="input" style={{ width: '100%' }} value={newCluster.engine}
                  onChange={e => setNewCluster({ ...newCluster, engine: e.target.value })}>
                  <option value="redis">Redis</option>
                  <option value="memcached">Memcached</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Node Type</label>
                <select className="input" style={{ width: '100%' }} value={newCluster.nodeType}
                  onChange={e => setNewCluster({ ...newCluster, nodeType: e.target.value })}>
                  {['cache.t2.micro','cache.t3.micro','cache.t3.small','cache.t3.medium','cache.m5.large','cache.r5.large'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Number of Nodes</label>
                <input className="input" style={{ width: '100%' }} type="number" min={1} max={20} value={newCluster.numNodes}
                  onChange={e => setNewCluster({ ...newCluster, numNodes: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createCluster}>Create Cluster</button>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
