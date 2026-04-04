import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Plus, Trash2, X, User, Users, Key } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function IAMPage({ showNotification }) {
  const [tab, setTab] = useState('users');
  const { confirmDialog, requestConfirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { IAMClient, ListUsersCommand, ListRolesCommand, ListPoliciesCommand } = await import('@aws-sdk/client-iam');
      const client = new IAMClient(getConfig());
      const [u, r, p] = await Promise.all([
        client.send(new ListUsersCommand({})),
        client.send(new ListRolesCommand({})),
        client.send(new ListPoliciesCommand({ Scope: 'Local' })),
      ]);
      setUsers(u.Users || []);
      setRoles(r.Roles || []);
      setPolicies(p.Policies || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const createUser = async () => {
    try {
      const { IAMClient, CreateUserCommand } = await import('@aws-sdk/client-iam');
      const client = new IAMClient(getConfig());
      await client.send(new CreateUserCommand({ UserName: newName }));
      showNotification(`User "${newName}" created`);
      setShowCreate(false); setNewName(''); load();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteUser = (name) => {
    requestConfirm({
      title: `Delete user "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { IAMClient, DeleteUserCommand } = await import('@aws-sdk/client-iam');
        const client = new IAMClient(getConfig());
        await client.send(new DeleteUserCommand({ UserName: name }));
        showNotification('User deleted'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const deleteRole = (name) => {
    requestConfirm({
      title: `Delete role "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { IAMClient, DeleteRoleCommand } = await import('@aws-sdk/client-iam');
        const client = new IAMClient(getConfig());
        await client.send(new DeleteRoleCommand({ RoleName: name }));
        showNotification('Role deleted'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><ShieldCheck size={20} /> IAM</div>
          <div className="page-subtitle">{users.length} users · {roles.length} roles · {policies.length} policies</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          {tab === 'users' && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create user</button>}
        </div>
      </div>

      <div className="tab-bar">
        {[
          { id: 'users', label: 'Users', icon: User },
          { id: 'roles', label: 'Roles', icon: Users },
          { id: 'policies', label: 'Policies', icon: Key },
        ].map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        ) : tab === 'users' ? (
          users.length === 0 ? (
            <div className="empty-state"><User size={40} /><h3>No users</h3>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create user</button>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>User name</th><th>User ID</th><th>ARN</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.UserId}>
                    <td style={{ fontWeight: 500 }}>{u.UserName}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{u.UserId}</td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--aws-text-muted)', maxWidth: 300 }}>{u.Arn}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(u.CreateDate)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.UserName)}><Trash2 size={11} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : tab === 'roles' ? (
          roles.length === 0 ? (
            <div className="empty-state"><Users size={40} /><h3>No roles</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Role name</th><th>Role ID</th><th>Created</th><th>Description</th><th></th></tr></thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.RoleId}>
                    <td style={{ fontWeight: 500 }}>{r.RoleName}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{r.RoleId}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(r.CreateDate)}</td>
                    <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{r.Description || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(r)}>View</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRole(r.RoleName)}><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          policies.length === 0 ? (
            <div className="empty-state"><Key size={40} /><h3>No local policies</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Policy name</th><th>Policy ID</th><th>Attachments</th><th>Created</th></tr></thead>
              <tbody>
                {policies.map(p => (
                  <tr key={p.PolicyId}>
                    <td style={{ fontWeight: 500 }}>{p.PolicyName}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{p.PolicyId}</td>
                    <td>{p.AttachmentCount || 0}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(p.CreateDate)}</td>
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
              <span className="modal-title">Create IAM User</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="input" style={{ width: '100%' }} value={newName}
                  onChange={e => setNewName(e.target.value)} placeholder="my-user" autoFocus
                  onKeyDown={e => e.key === 'Enter' && createUser()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createUser}>Create User</button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Role: {selectedItem.RoleName}</span>
              <button className="close-btn" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-label" style={{ marginBottom: 8 }}>Trust Policy</div>
              <pre className="detail-json">{JSON.stringify(
                JSON.parse(decodeURIComponent(selectedItem.AssumeRolePolicyDocument || '{}')), null, 2
              )}</pre>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
