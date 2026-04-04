import React, { useState, useCallback } from 'react';
import { Container, RefreshCw, Plus } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ServiceUnavailable, { isProOnlyError } from '../components/ServiceUnavailable';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import { useAwsResource } from '../hooks/useAwsResource';
import { useAwsAction } from '../hooks/useAwsAction';
import { fmtDate } from '../utils/formatters';

const ECS_STATUS_MAP = {
  ACTIVE: 'green', INACTIVE: 'gray', DRAINING: 'yellow',
  RUNNING: 'green', STOPPED: 'red', PENDING: 'yellow',
};

export default function ECSPage({ showNotification }) {
  const [clusterDetails, setClusterDetails] = useState({});
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [tab, setTab] = useState('services');
  const [showCreate, setShowCreate] = useState(false);
  const [proError, setProError] = useState(false);

  const loadClusters = useCallback(async () => {
    const { ECSClient, ListClustersCommand, DescribeClustersCommand } = await import('@aws-sdk/client-ecs');
    const client = new ECSClient(getConfig());
    const list = await client.send(new ListClustersCommand({ maxResults: 100 }));
    const arns = list.clusterArns || [];
    if (arns.length > 0) {
      const desc = await client.send(new DescribeClustersCommand({ clusters: arns }));
      const details = {};
      (desc.clusters || []).forEach(c => { details[c.clusterArn] = c; });
      setClusterDetails(details);
      return desc.clusters || [];
    }
    return [];
  }, []);

  const handleError = useCallback((e) => {
    if (isProOnlyError(e)) { setProError(true); return; }
    showNotification(e.message, 'error');
  }, [showNotification]);

  const { items: clusters, loading, refresh: loadClustersRefresh } = useAwsResource(loadClusters, { onError: handleError });

  const openCluster = async (cluster) => {
    setSelectedCluster(cluster);
    setTab('services');
    setDetailLoading(true);
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
    finally { setDetailLoading(false); }
  };

  const createClusterFn = useCallback(async (name) => {
    const { ECSClient, CreateClusterCommand } = await import('@aws-sdk/client-ecs');
    const client = new ECSClient(getConfig());
    await client.send(new CreateClusterCommand({ clusterName: name }));
  }, []);

  const { execute: createCluster } = useAwsAction(createClusterFn, {
    showNotification,
    onSuccess: () => { setShowCreate(false); loadClustersRefresh(); },
  });

  const getShortName = (arn) => arn?.split('/').pop() || arn || '-';

  const clusterColumns = [
    { key: 'clusterName', label: 'Cluster name', render: (v, row) => <button className="link-btn" onClick={(e) => { e.stopPropagation(); openCluster(row); }}>{v}</button> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={ECS_STATUS_MAP} /> },
    { key: 'runningTasksCount', label: 'Running tasks' },
    { key: 'activeServicesCount', label: 'Services' },
    { key: 'registeredContainerInstancesCount', label: 'Instances' },
  ];

  const serviceColumns = [
    { key: 'serviceName', label: 'Service name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={ECS_STATUS_MAP} /> },
    { key: 'runningCount', label: 'Running / Desired', render: (v, row) => `${row.runningCount} / ${row.desiredCount}` },
    { key: 'launchType', label: 'Launch type', render: (v) => <span className="badge badge-blue">{v || 'FARGATE'}</span> },
    { key: 'taskDefinition', label: 'Task def', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{getShortName(v)}</span> },
    { key: 'createdAt', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  const taskColumns = [
    { key: 'taskArn', label: 'Task ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{getShortName(v)}</span> },
    { key: 'desiredStatus', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={ECS_STATUS_MAP} /> },
    { key: 'lastStatus', label: 'Last status', render: (v) => <StatusBadge status={v} colorMap={ECS_STATUS_MAP} /> },
    { key: 'cpu', label: 'CPU / Memory', render: (v, row) => <span style={{ fontSize: 12 }}>{v || '-'} / {row.memory || '-'}</span> },
    { key: 'taskDefinitionArn', label: 'Task def', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{getShortName(v)}</span> },
    { key: 'startedAt', label: 'Started', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  if (selectedCluster) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Container size={20} /> {selectedCluster.clusterName}</div>
            <div className="page-subtitle">
              <StatusBadge status={selectedCluster.status} colorMap={ECS_STATUS_MAP} />
              {' '}{selectedCluster.runningTasksCount} running · {selectedCluster.pendingTasksCount} pending · {selectedCluster.activeServicesCount} services
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCluster(null)}>← Clusters</button>
            <button className="btn btn-secondary btn-sm" onClick={() => openCluster(selectedCluster)}><RefreshCw size={13} className={detailLoading ? 'spin' : ''} /></button>
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
          <DataTable
            columns={serviceColumns}
            data={services}
            loading={detailLoading}
            rowKey="serviceArn"
            emptyIcon={Container}
            emptyTitle="No services"
            emptyDescription="Deploy services to this cluster."
          />
        )}

        {tab === 'tasks' && (
          <DataTable
            columns={taskColumns}
            data={tasks}
            loading={detailLoading}
            rowKey="taskArn"
            emptyIcon={Container}
            emptyTitle="No tasks"
            emptyDescription="No tasks are currently running in this cluster."
          />
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
          <button className="btn btn-secondary btn-sm" onClick={loadClustersRefresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create cluster</button>
        </div>
      </div>

      <DataTable
        columns={clusterColumns}
        data={clusters}
        loading={loading}
        rowKey="clusterArn"
        emptyIcon={Container}
        emptyTitle="No clusters"
        actions={(row) => (
          <button className="btn btn-secondary btn-sm" onClick={() => openCluster(row)}>Explore</button>
        )}
      />

      <CreateModal
        title="Create ECS Cluster"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(values) => createCluster(values.clusterName)}
        fields={[
          { name: 'clusterName', label: 'Cluster Name', required: true, placeholder: 'my-cluster' },
        ]}
        submitLabel="Create Cluster"
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
    </div>
  );
}
