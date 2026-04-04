// ECRPage.js
import React, { useState, useCallback } from 'react';
import { Package, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import CreateModal from '../components/CreateModal';
import { useAwsResource } from '../hooks/useAwsResource';
import { useAwsAction } from '../hooks/useAwsAction';
import { fmtDate, fmtSize } from '../utils/formatters';

export default function ECRPage({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [images, setImages] = useState([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadReposFn = useCallback(async () => {
    const { ECRClient, DescribeRepositoriesCommand } = await import('@aws-sdk/client-ecr');
    const client = new ECRClient(getConfig());
    const res = await client.send(new DescribeRepositoriesCommand({ maxResults: 100 }));
    return res.repositories || [];
  }, []);

  const handleError = useCallback((e) => {
    showNotification(e.message, 'error');
  }, [showNotification]);

  const { items: repos, loading, refresh: loadRepos } = useAwsResource(loadReposFn, { onError: handleError });

  const loadImages = useCallback(async (repoName) => {
    setImgLoading(true);
    try {
      const { ECRClient, DescribeImagesCommand } = await import('@aws-sdk/client-ecr');
      const client = new ECRClient(getConfig());
      const res = await client.send(new DescribeImagesCommand({ repositoryName: repoName, maxResults: 100 }));
      setImages(res.imageDetails || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setImgLoading(false); }
  }, [showNotification]);

  const createRepoFn = useCallback(async (name) => {
    const { ECRClient, CreateRepositoryCommand } = await import('@aws-sdk/client-ecr');
    const client = new ECRClient(getConfig());
    await client.send(new CreateRepositoryCommand({ repositoryName: name }));
  }, []);

  const { execute: createRepo } = useAwsAction(createRepoFn, {
    showNotification,
    onSuccess: () => { setShowCreate(false); loadRepos(); },
  });

  const deleteRepo = (name) => {
    requestConfirm({
      title: `Delete repository "${name}"? This also deletes all images inside.`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { ECRClient, DeleteRepositoryCommand } = await import('@aws-sdk/client-ecr');
        const client = new ECRClient(getConfig());
        await client.send(new DeleteRepositoryCommand({ repositoryName: name, force: true }));
        showNotification('Repository deleted');
        if (selectedRepo === name) setSelectedRepo(null);
        loadRepos();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const repoColumns = [
    { key: 'repositoryName', label: 'Repository name', render: (v, row) => <button className="link-btn" onClick={(e) => { e.stopPropagation(); setSelectedRepo(row.repositoryName); loadImages(row.repositoryName); }}>{v}</button> },
    { key: 'repositoryUri', label: 'URI', mono: true, render: (v) => <span style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{v}</span> },
    { key: 'imageCount', label: 'Image count', render: (v) => v ?? '-' },
    { key: 'createdAt', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  const imageColumns = [
    { key: 'imageTags', label: 'Tag', render: (v) => v?.map(t => <span key={t} className="badge badge-blue" style={{ marginRight: 4 }}>{t}</span>) || <span className="badge badge-gray">untagged</span> },
    { key: 'imageDigest', label: 'Digest', mono: true, render: (v) => <span style={{ fontSize: 10 }}>{v?.slice(0, 24)}...</span> },
    { key: 'imageSizeInBytes', label: 'Size', render: (v) => fmtSize(v) },
    { key: 'imagePushedAt', label: 'Pushed at', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  if (selectedRepo) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Package size={20} /> ECR &rsaquo; {selectedRepo}</div>
            <div className="page-subtitle">{images.length} image{images.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRepo(null); setImages([]); }}>← Repositories</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadImages(selectedRepo)}><RefreshCw size={13} className={imgLoading ? 'spin' : ''} /></button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14, padding: 14, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>
            Push images with: <span className="mono" style={{ fontSize: 11, color: 'var(--aws-cyan)' }}>
              docker tag my-image:latest localhost:4566/{selectedRepo}:latest && docker push localhost:4566/{selectedRepo}:latest
            </span>
          </div>
        </div>

        <DataTable
          columns={imageColumns}
          data={images}
          loading={imgLoading}
          rowKey="imageDigest"
          emptyIcon={Package}
          emptyTitle="No images"
          emptyDescription="Push Docker images using the command above."
        />

        {confirmDialog}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Package size={20} /> ECR — Container Registry</div>
          <div className="page-subtitle">{repos.length} repositor{repos.length !== 1 ? 'ies' : 'y'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadRepos}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create repository</button>
        </div>
      </div>

      <DataTable
        columns={repoColumns}
        data={repos}
        loading={loading}
        rowKey="repositoryArn"
        emptyIcon={Package}
        emptyTitle="No repositories"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRepo(row.repositoryName); loadImages(row.repositoryName); }}>Images</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteRepo(row.repositoryName)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create ECR Repository"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(values) => createRepo(values.repositoryName)}
        fields={[
          { name: 'repositoryName', label: 'Repository Name', required: true, placeholder: 'my-app/backend' },
        ]}
        submitLabel="Create"
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;font-weight:500;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
