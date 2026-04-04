// ECRPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Package, RefreshCw, Plus, Trash2, X } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function ECRPage({ showNotification }) {
  const [repos, setRepos] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRepo, setNewRepo] = useState('');

  const loadRepos = useCallback(async () => {
    setLoading(true);
    try {
      const { ECRClient, DescribeRepositoriesCommand } = await import('@aws-sdk/client-ecr');
      const client = new ECRClient(getConfig());
      const res = await client.send(new DescribeRepositoriesCommand({ maxResults: 100 }));
      setRepos(res.repositories || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadRepos(); }, [loadRepos]);

  const loadImages = useCallback(async (repoName) => {
    setLoading(true);
    try {
      const { ECRClient, DescribeImagesCommand } = await import('@aws-sdk/client-ecr');
      const client = new ECRClient(getConfig());
      const res = await client.send(new DescribeImagesCommand({ repositoryName: repoName, maxResults: 100 }));
      setImages(res.imageDetails || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  const createRepo = async () => {
    if (!newRepo) return;
    try {
      const { ECRClient, CreateRepositoryCommand } = await import('@aws-sdk/client-ecr');
      const client = new ECRClient(getConfig());
      await client.send(new CreateRepositoryCommand({ repositoryName: newRepo }));
      showNotification(`Repository "${newRepo}" created`);
      setShowCreate(false); setNewRepo(''); loadRepos();
    } catch (e) { showNotification(e.message, 'error'); }
  };

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

  const fmtSize = (b) => b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '-';
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  if (selectedRepo) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Package size={20} /> ECR › {selectedRepo}</div>
            <div className="page-subtitle">{images.length} image{images.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRepo(null); setImages([]); }}>← Repositories</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadImages(selectedRepo)}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14, padding: 14, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>
            📌 Push images with: <span className="mono" style={{ fontSize: 11, color: 'var(--aws-cyan)' }}>
              docker tag my-image:latest localhost:4566/{selectedRepo}:latest && docker push localhost:4566/{selectedRepo}:latest
            </span>
          </div>
        </div>

        <div className="card">
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : images.length === 0 ? (
            <div className="empty-state"><Package size={40} /><h3>No images</h3><p>Push Docker images using the command above.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Tag</th><th>Digest</th><th>Size</th><th>Pushed at</th></tr></thead>
              <tbody>
                {images.map((img, i) => (
                  <tr key={i}>
                    <td>{img.imageTags?.map(t => <span key={t} className="badge badge-blue" style={{ marginRight: 4 }}>{t}</span>) || <span className="badge badge-gray">untagged</span>}</td>
                    <td className="mono" style={{ fontSize: 10 }}>{img.imageDigest?.slice(0, 24)}...</td>
                    <td>{fmtSize(img.imageSizeInBytes)}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(img.imagePushedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : repos.length === 0 ? (
          <div className="empty-state"><Package size={40} /><h3>No repositories</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create repository</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Repository name</th><th>URI</th><th>Image count</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {repos.map(r => (
                <tr key={r.repositoryArn}>
                  <td><button className="link-btn" onClick={() => { setSelectedRepo(r.repositoryName); loadImages(r.repositoryName); }}>{r.repositoryName}</button></td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{r.repositoryUri}</td>
                  <td>{r.imageCount ?? '-'}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRepo(r.repositoryName); loadImages(r.repositoryName); }}>Images</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteRepo(r.repositoryName)}><Trash2 size={11} /></button>
                    </div>
                  </td>
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
              <span className="modal-title">Create ECR Repository</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Repository Name</label>
                <input className="input" style={{ width: '100%' }} value={newRepo}
                  onChange={e => setNewRepo(e.target.value)} placeholder="my-app/backend" autoFocus
                  onKeyDown={e => e.key === 'Enter' && createRepo()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createRepo}>Create</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;font-weight:500;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
