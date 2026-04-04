import React, { useState, useEffect, useCallback } from 'react';
import { Container, RefreshCw, Plus, X, ChevronRight } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ServiceUnavailable, { isProOnlyError } from '../components/ServiceUnavailable';

export default function ECSPage({ showNotification }) {
  const [clusters, setClusters] = useState([]);
  const [clusterDetails, setClusterDetails] = useState({});
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [tab, setTab] = useState('services');
  const [showCreate, setShowCreate] = useState(false);
  const [newCluster, setNewCluster] = useState('');
  const [proError, setProError] = useState(false);

  const loadClusters = useCallback(async () => {
    setLoading(true);
    try {
      const { ECSClient, ListClustersCommand, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient(getConfig());
      const list = await client.send(new ListClustersCommand({ maxResults: 100 }));
      const arns = list.clusterArns || [];
      if (arns.length > 0) {
        const desc = await client.send(new DescribeClustersCommand({ clusters: arns }));
        const details = {};
        (desc.clusters || []).forEach(c => { details[c.clusterArn] = c; });
        setClusterDetails(details);
        setClusters(desc.clusters || []);
      } else {
        setClusters([]);
      }
    } catch (e) {
      if (isProOnlyError(e)) { setProError(true); return; }
      showNotification(e.message, 'error');
    } finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadClusters(); }, [loadClusters]);

  const openCluster = async (cluster) => {
    setSelectedCluster(cluster);
    setTab('services');
    setLoading(true);
    try {
      const { ECSClient, ListServicesCommand, DescribeServicesCommand, ListTasksCommand, DescribeTasksCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient(getConfig());
      const [svcList, taskList] = await Promise.all([
        client.send(new ListServicesCommand({ cluster: cluster.clusterArn, maxResults: 100 })),
        client.send(new ListTasksCommand({ cluster: cluster.clusterArn, maxResults: 100 })),
      ]);
      const svcArns = svcList.serviceArns || [];
      const taskArns = taskList.taskArns || [];
      const [svcs, tsks] = await Promise.all([
        svcArns.length > 0 ? client.send(new DescribeServicesCommand({ cluster: cluster.clusterArn, services: svcArns })) : { services: [] },
        taskArns.length > 0 ? client.send(new DescribeTasksCommand({ cluster: cluster.clusterArn, tasks: taskArns })) : { tasks: [] },
      ]);
      setServices(svcs.services || []);
      setTasks(tsks.tasks || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const createCluster = async () => {
    if (!newCluster) return;
    try {
      const { ECSClient, CreateClusterCommand } = await import('@aws-sdk/client-ecs');
      const client = new ECSClient(getConfig());
      await client.send(new CreateClusterCommand({ clusterName: newCluster }));
      showNotification(`Cluster "${newCluster}" created`);
      setShowCreate(false);
      setNewCluster('');
      loadClusters();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const statusBadge = (s) => ({ ACTIVE: 'badge-green', INACTIVE: 'badge-gray', DRAINING: 'badge-yellow', RUNNING: 'badge-green', STOPPED: 'badge-red', PENDING: 'badge-yellow' }[s] || 'badge-gray');
  const getShortName = (arn) => arn?.split('/').pop() || arn || '-';
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  if (selectedCluster) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Container size={20} /> {selectedCluster.clusterName}</div>
            <div className="page-subtitle">
              <span className={`badge ${statusBadge(selectedCluster.status)}`} style={{ marginRight: 8 }}>{selectedCluster.status}</span>
              {selectedCluster.runningTasksCount} running · {selectedCluster.pendingTasksCount} pending · {selectedCluster.activeServicesCount} services
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCluster(null)}>← Clusters</button>
            <button className="btn btn-secondary btn-sm" onClick={() => openCluster(selectedCluster)}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card"><div className="stat-label">Running Tasks</div><div className="stat-value">{selectedCluster.runningTasksCount}</div></div>
          <div className="stat-card"><div className="stat-label">Pending Tasks</div><div className="stat-value">{selectedCluster.pendingTasksCount}</div></div>
          <div className="stat-card"><div className="stat-label">Services</div><div className="stat-value">{selectedCluster.activeServicesCount}</div></div>
          <div className="stat-card"><div className="stat-label">Registered Instances</div><div className="stat-value">{selectedCluster.registeredContainerInstancesCount}</div></div>
        </div>

        <div className="tab-bar">
          {['services', 'tasks'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'services' && (
          <div className="card">
            {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
            : services.length === 0 ? (
              <div className="empty-state"><Container size={40} /><h3>No services</h3><p>Deploy services to this cluster.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Service name</th><th>Status</th><th>Running / Desired</th><th>Launch type</th><th>Task def</th><th>Created</th></tr></thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.serviceArn}>
                      <td style={{ fontWeight: 500 }}>{s.serviceName}</td>
                      <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                      <td>{s.runningCount} / {s.desiredCount}</td>
                      <td><span className="badge badge-blue">{s.launchType || 'FARGATE'}</span></td>
                      <td className="mono" style={{ fontSize: 11 }}>{getShortName(s.taskDefinition)}</td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <div className="card">
            {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
            : tasks.length === 0 ? (
              <div className="empty-state"><Container size={40} /><h3>No tasks</h3><p>No tasks are currently running in this cluster.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Task ID</th><th>Status</th><th>Last status</th><th>CPU / Memory</th><th>Task def</th><th>Started</th></tr></thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.taskArn}>
                      <td className="mono" style={{ fontSize: 11 }}>{getShortName(t.taskArn)}</td>
                      <td><span className={`badge ${statusBadge(t.desiredStatus)}`}>{t.desiredStatus}</span></td>
                      <td><span className={`badge ${statusBadge(t.lastStatus)}`}>{t.lastStatus}</span></td>
                      <td style={{ fontSize: 12 }}>{t.cpu || '-'} / {t.memory || '-'}</td>
                      <td className="mono" style={{ fontSize: 11 }}>{getShortName(t.taskDefinitionArn)}</td>
                      <td style={{ fontSize: 12 }}>{fmtDate(t.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    );
  }

  if (proError) return <ServiceUnavailable serviceName="ECS" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Container size={20} /> ECS Clusters</div>
          <div className="page-subtitle">{clusters.length} cluster{clusters.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadClusters}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create cluster</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : clusters.length === 0 ? (
          <div className="empty-state">
            <Container size={40} /><h3>No clusters</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create cluster</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Cluster name</th><th>Status</th><th>Running tasks</th><th>Services</th><th>Instances</th><th></th></tr></thead>
            <tbody>
              {clusters.map(c => (
                <tr key={c.clusterArn}>
                  <td><button className="link-btn" onClick={() => openCluster(c)}>{c.clusterName}</button></td>
                  <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                  <td>{c.runningTasksCount}</td>
                  <td>{c.activeServicesCount}</td>
                  <td>{c.registeredContainerInstancesCount}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => openCluster(c)}>Explore</button></td>
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
              <span className="modal-title">Create ECS Cluster</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cluster Name</label>
                <input className="input" style={{ width: '100%' }} value={newCluster}
                  onChange={e => setNewCluster(e.target.value)} placeholder="my-cluster" autoFocus
                  onKeyDown={e => e.key === 'Enter' && createCluster()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createCluster}>Create Cluster</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
    </div>
  );
}
