import React, { useState, useCallback, useRef } from 'react';
import { Archive, RefreshCw, Plus, Trash2, FolderOpen, Upload,
         Download, ArrowLeft, File, Folder, CloudUpload } from 'lucide-react';
import { S3Client, ListBucketsCommand, ListObjectsV2Command,
         CreateBucketCommand, DeleteBucketCommand, DeleteObjectCommand,
         PutObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from '../services/awsClients';
import { validateBucketName } from '../services/validation';
import { fmtSize } from '../utils/formatters';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import CreateModal from '../components/CreateModal';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

// ── DragDropOverlay ────────────────────────────────────────────────────────────
function DragDropOverlay({ show, targetLabel }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(13,17,23,0.85)',
      border: '2px dashed var(--aws-orange)',
      borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      backdropFilter: 'blur(2px)',
      pointerEvents: 'none',
    }}>
      <CloudUpload size={48} color="var(--aws-orange)" strokeWidth={1.5} />
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--aws-orange)' }}>
        Drop to upload
      </div>
      {targetLabel && (
        <div style={{ fontSize: 13, color: 'var(--aws-text-muted)' }}>
          into <strong style={{ color: 'var(--aws-text)' }}>{targetLabel}</strong>
        </div>
      )}
    </div>
  );
}

// ── UploadProgress ─────────────────────────────────────────────────────────────
function UploadProgress({ items }) {
  if (!items.length) return null;
  const done = items.filter(i => i.status === 'done').length;
  const failed = items.filter(i => i.status === 'error').length;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      background: 'var(--aws-surface-2)', border: '1px solid var(--aws-border)',
      borderRadius: 10, padding: '14px 18px', minWidth: 280,
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--aws-text)' }}>
        Uploading {items.length} file{items.length !== 1 ? 's' : ''}
        <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--aws-text-muted)' }}>
          {done} done{failed ? `, ${failed} failed` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--aws-text-dim)' }}>
              {item.name}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: item.status === 'done' ? 'var(--aws-green)'
                : item.status === 'error' ? 'var(--aws-red)'
                : 'var(--aws-text-muted)',
              flexShrink: 0, maxWidth: 140, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={item.error || undefined}>
              {item.status === 'done' ? '\u2713' : item.status === 'error' ? `\u2715 ${item.error || 'failed'}` : '\u22EF'}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, height: 3, background: 'var(--aws-border)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2, background: 'var(--aws-orange)',
          transition: 'width 0.3s',
          width: `${items.length ? (done / items.length) * 100 : 0}%`,
        }} />
      </div>
    </div>
  );
}

// ── Main S3Page ────────────────────────────────────────────────────────────────
export default function S3Page({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [objects, setObjects] = useState([]);
  const [prefix, setPrefix] = useState('');
  const [objLoading, setObjLoading] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const dragCounter = useRef(0);
  const containerRef = useRef(null);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadBucketsFn = useCallback(async () => {
    const client = new S3Client(getConfig());
    const res = await client.send(new ListBucketsCommand({}));
    return res.Buckets || [];
  }, []);

  const { items: buckets, loading, refresh: loadBuckets } = useAwsResource(loadBucketsFn, {
    onError: (e) => showNotification(`Failed to load buckets: ${e.message}`, 'error'),
  });

  const loadObjects = useCallback(async (bucket, pfx = '') => {
    setObjLoading(true);
    try {
      const client = new S3Client(getConfig());
      const allFolders = [];
      const allFiles   = [];
      let token = undefined;
      do {
        const res = await client.send(new ListObjectsV2Command({
          Bucket: bucket, Prefix: pfx, Delimiter: '/',
          ContinuationToken: token,
        }));
        (res.CommonPrefixes || []).forEach(p => allFolders.push({ key: p.Prefix, isDir: true }));
        (res.Contents || []).filter(o => o.Key !== pfx).forEach(o => allFiles.push({ ...o, isDir: false }));
        token = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (token && (allFolders.length + allFiles.length) < 5000);
      setObjects([...allFolders, ...allFiles]);
    } catch (e) { showNotification(`Failed to load objects: ${e.message}`, 'error'); }
    finally { setObjLoading(false); }
  }, [showNotification]);

  // ── Upload logic ──────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (files, bucket, pfx) => {
    if (!bucket) return;
    const items = Array.from(files).map(f => ({ name: f.name, status: 'uploading', file: f }));
    setUploadQueue([...items]);
    const client = new S3Client(getConfig());

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const buffer = await item.file.arrayBuffer();
        await client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: (pfx || '') + item.file.name,
          Body: new Uint8Array(buffer),
          ContentType: item.file.type || 'application/octet-stream',
          ContentLength: item.file.size,
        }));
        items[i] = { ...item, status: 'done' };
      } catch (e) {
        items[i] = { ...item, status: 'error', error: e.message };
        showNotification(`Upload failed: ${e.message}`, 'error');
      }
      setUploadQueue([...items]);
    }
    const doneCount = items.filter(i => i.status === 'done').length;
    if (doneCount > 0) {
      showNotification(`${doneCount} of ${items.length} file${items.length !== 1 ? 's' : ''} uploaded`);
    }
    setTimeout(() => setUploadQueue([]), 3000);
    loadObjects(bucket, pfx || '');
  }, [showNotification, loadObjects]);

  // ── Drag and drop handlers ────────────────────────────────────────────────────
  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files') && (selectedBucket)) {
      setIsDragging(true);
    }
  }, [selectedBucket]);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = selectedBucket ? 'copy' : 'none';
  }, [selectedBucket]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (!selectedBucket) {
      showNotification('Open a bucket first to upload files', 'error');
      return;
    }
    const files = e.dataTransfer.files;
    if (files.length) uploadFiles(files, selectedBucket, prefix);
  }, [selectedBucket, prefix, uploadFiles, showNotification]);

  // ── S3 actions ────────────────────────────────────────────────────────────────
  const createBucket = async (values) => {
    const name = values.bucketName;
    const check = validateBucketName(name);
    if (!check.valid) { showNotification(check.error, 'error'); return; }
    try {
      const client = new S3Client(getConfig());
      await client.send(new CreateBucketCommand({ Bucket: name }));
      showNotification(`Bucket "${name}" created`);
      setShowCreate(false);
      loadBuckets();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteBucket = (name) => {
    requestConfirm({
      title: `Delete bucket "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const client = new S3Client(getConfig());
          await client.send(new DeleteBucketCommand({ Bucket: name }));
          showNotification(`Bucket "${name}" deleted`);
          if (selectedBucket === name) setSelectedBucket(null);
          loadBuckets();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const deleteObject = (key) => {
    requestConfirm({
      title: `Delete "${key}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const client = new S3Client(getConfig());
          await client.send(new DeleteObjectCommand({ Bucket: selectedBucket, Key: key }));
          showNotification('Object deleted');
          loadObjects(selectedBucket, prefix);
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const downloadObject = async (key) => {
    const cfg = getConfig();
    window.open(`${cfg.endpoint}/${selectedBucket}/${encodeURIComponent(key)}`, '_blank');
  };

  const openBucket = (name) => { setSelectedBucket(name); setPrefix(''); loadObjects(name, ''); };
  const openFolder = (folderPrefix) => { setPrefix(folderPrefix); loadObjects(selectedBucket, folderPrefix); };

  const goBack = () => {
    if (!prefix) { setSelectedBucket(null); setObjects([]); return; }
    const parts = prefix.split('/').filter(Boolean);
    parts.pop();
    const newPrefix = parts.length ? parts.join('/') + '/' : '';
    setPrefix(newPrefix);
    loadObjects(selectedBucket, newPrefix);
  };

  const filteredObjects = objects.filter(o => {
    const name = o.isDir ? o.key : o.Key;
    return name?.toLowerCase().includes('');
  });

  // ── Object browser ────────────────────────────────────────────────────────────
  if (selectedBucket) {
    const dropLabel = prefix ? `${selectedBucket}/${prefix}` : selectedBucket;
    return (
      <div
        ref={containerRef}
        style={{ position: 'relative', height: '100%' }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <DragDropOverlay show={isDragging} targetLabel={dropLabel} />

        <div className="fade-in">
          <div className="page-header">
            <div>
              <div className="page-title">
                <Archive size={20} />
                {selectedBucket}
                {prefix && <span style={{ color: 'var(--aws-text-muted)', fontSize: 14 }}> / {prefix}</span>}
              </div>
              <div className="page-subtitle">
                {filteredObjects.length} item{filteredObjects.length !== 1 ? 's' : ''}
                {' \u00B7 '}
                <span style={{ color: 'var(--aws-text-muted)', fontSize: 11 }}>
                  Drag & drop files anywhere to upload
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={goBack}>
                <ArrowLeft size={13} /> {prefix ? 'Up' : 'All Buckets'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => loadObjects(selectedBucket, prefix)}>
                <RefreshCw size={13} className={objLoading ? 'spin' : ''} />
              </button>
              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={13} /> Upload files
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => uploadFiles(e.target.files, selectedBucket, prefix)}
                />
              </label>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            padding: '8px 14px', borderRadius: 6,
            background: 'rgba(255,153,0,0.05)', border: '1px dashed rgba(255,153,0,0.2)',
            fontSize: 12, color: 'var(--aws-text-muted)',
          }}>
            <CloudUpload size={14} color="var(--aws-orange)" />
            Drag files from your desktop and drop them here to upload
          </div>

          <div className="card">
            {objLoading ? (
              <div className="loading-center"><RefreshCw size={16} className="spin" /> Loading...</div>
            ) : filteredObjects.length === 0 ? (
              <div className="empty-state">
                <CloudUpload size={48} color="var(--aws-orange)" strokeWidth={1.2} />
                <h3>This folder is empty</h3>
                <p>Drag files here or click Upload files to get started.</p>
                <label className="btn btn-primary" style={{ cursor: 'pointer', marginTop: 8 }}>
                  <Upload size={14} /> Choose files
                  <input type="file" multiple style={{ display: 'none' }}
                    onChange={e => uploadFiles(e.target.files, selectedBucket, prefix)} />
                </label>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Size</th><th>Last Modified</th><th>Storage Class</th><th />
                  </tr>
                </thead>
                <tbody>
                  {filteredObjects.map((obj, i) => {
                    const isDir = obj.isDir;
                    const name = isDir
                      ? obj.key.replace(prefix, '').replace(/\/$/, '')
                      : obj.Key.replace(prefix, '');
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isDir
                              ? <Folder size={14} color="var(--aws-orange)" />
                              : <File size={14} color="var(--aws-text-muted)" />
                            }
                            {isDir ? (
                              <button className="link-btn" onClick={() => openFolder(obj.key)}>{name}/</button>
                            ) : (
                              <span className="mono">{name}</span>
                            )}
                          </div>
                        </td>
                        <td>{isDir ? '-' : fmtSize(obj.Size)}</td>
                        <td style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>
                          {isDir ? '-' : obj.LastModified ? new Date(obj.LastModified).toLocaleString() : '-'}
                        </td>
                        <td>{isDir ? '-' : <span className="badge badge-gray">{obj.StorageClass || 'STANDARD'}</span>}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!isDir && <button className="btn btn-secondary btn-sm" onClick={() => downloadObject(obj.Key)}><Download size={12} /></button>}
                            {!isDir && <button className="btn btn-danger btn-sm" onClick={() => deleteObject(obj.Key)}><Trash2 size={12} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <UploadProgress items={uploadQueue} />
        {confirmDialog}
        <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-family:var(--font-mono);font-size:12px;} .link-btn:hover{text-decoration:underline;}`}</style>
      </div>
    );
  }

  // ── Bucket list (using DataTable) ────────────────────────────────────────────
  const bucketColumns = [
    {
      key: 'Name', label: 'Bucket name',
      render: (val, row) => (
        <button className="link-btn" onClick={() => openBucket(row.Name)}>
          <Archive size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--aws-orange)' }} />
          {row.Name}
        </button>
      ),
    },
    {
      key: 'CreationDate', label: 'Creation date',
      render: (val) => (
        <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>
          {val ? new Date(val).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'Region', label: 'Region',
      render: () => (
        <span className="badge badge-gray">{localStorage.getItem('ls_region') || 'us-east-1'}</span>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Archive size={20} /> Amazon S3</div>
          <div className="page-subtitle">{buckets.length} bucket{buckets.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadBuckets}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create bucket
          </button>
        </div>
      </div>

      <DataTable
        columns={bucketColumns}
        data={buckets}
        loading={loading}
        rowKey="Name"
        searchable
        searchPlaceholder="Search buckets..."
        searchKeys={['Name']}
        emptyIcon={Archive}
        emptyTitle="No buckets"
        emptyDescription="Create your first S3 bucket to get started."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => openBucket(row.Name)}>
              <FolderOpen size={12} /> Browse
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteBucket(row.Name)}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      />

      <CreateModal
        title="Create S3 Bucket"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createBucket}
        submitLabel="Create Bucket"
        fields={[
          {
            name: 'bucketName',
            label: 'Bucket Name',
            placeholder: 'my-bucket',
            required: true,
            helpText: 'Lowercase letters, numbers, and hyphens only. 3\u201363 characters.',
            validate: (val) => {
              const check = validateBucketName(val);
              return check.valid ? null : check.error;
            },
          },
        ]}
      />

      {confirmDialog}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;font-weight:500;} .link-btn:hover{text-decoration:underline;}`}</style>
    </div>
  );
}
