import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, RefreshCw, Plus, Trash2, X, ChevronRight,
  Search, Key, UserCheck, UserX, Shield, Edit3,
  CheckCircle, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ServiceUnavailable, { isProOnlyError } from '../components/ServiceUnavailable';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import CopyButton from '../components/CopyButton';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import { useAwsResource } from '../hooks/useAwsResource';
import { useAwsAction } from '../hooks/useAwsAction';
import { fmtDate } from '../utils/formatters';

const getAttr = (user, name) => user.Attributes?.find(a => a.Name === name)?.Value || '';

const USER_STATUS_MAP = {
  CONFIRMED: 'green',
  FORCE_CHANGE_PASSWORD: 'yellow',
  RESET_REQUIRED: 'yellow',
  UNCONFIRMED: 'gray',
  ARCHIVED: 'red',
  COMPROMISED: 'red',
};

function UserDetailPanel({ user, poolId, onClose, onRefresh, showNotification }) {
  const [tab, setTab]               = useState('attributes');
  const [userGroups, setUserGroups] = useState([]);
  const [allGroups, setAllGroups]   = useState([]);
  const [editing, setEditing]       = useState(false);
  const [attrs, setAttrs]           = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [showPwReset, setShowPwReset] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [saving, setSaving]         = useState(false);
  const { confirmDialog, requestConfirm } = useConfirm();

  const loadUserGroups = useCallback(async () => {
    try {
      const { CognitoIdentityProviderClient, AdminListGroupsForUserCommand, ListGroupsCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      const [ugRes, agRes] = await Promise.all([
        client.send(new AdminListGroupsForUserCommand({ UserPoolId: poolId, Username: user.Username, Limit: 60 })),
        client.send(new ListGroupsCommand({ UserPoolId: poolId, Limit: 60 })),
      ]);
      setUserGroups(ugRes.Groups || []);
      setAllGroups(agRes.Groups || []);
    } catch {}
  }, [poolId, user.Username]);

  useEffect(() => {
    loadUserGroups();
    setAttrs((user.Attributes || []).map(a => ({ ...a })));
  }, [user, loadUserGroups]);

  const saveAttributes = async () => {
    setSaving(true);
    try {
      const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      await client.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: poolId, Username: user.Username,
        UserAttributes: attrs.filter(a => a.Name !== 'sub'),
      }));
      showNotification('Attributes updated');
      setEditing(false); onRefresh();
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const toggleEnabled = () => {
    const action = user.Enabled ? 'disable' : 'enable';
    requestConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} "${user.Username}"?`,
      message: user.Enabled ? 'User will not be able to sign in.' : 'User will be able to sign in again.',
      confirmLabel: user.Enabled ? 'Disable' : 'Enable',
      danger: user.Enabled,
      onConfirm: async () => {
        try {
          const { CognitoIdentityProviderClient, AdminEnableUserCommand, AdminDisableUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
          const client = new CognitoIdentityProviderClient(getConfig());
          const Cmd = user.Enabled ? AdminDisableUserCommand : AdminEnableUserCommand;
          await client.send(new Cmd({ UserPoolId: poolId, Username: user.Username }));
          showNotification(`User ${action}d`); onRefresh();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const resetPassword = async () => {
    if (!newPassword) return;
    try {
      const { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      await client.send(new AdminSetUserPasswordCommand({
        UserPoolId: poolId, Username: user.Username,
        Password: newPassword, Permanent: true,
      }));
      showNotification('Password updated');
      setShowPwReset(false); setNewPassword(''); onRefresh();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const confirmUser = async () => {
    try {
      const { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      await client.send(new AdminConfirmSignUpCommand({ UserPoolId: poolId, Username: user.Username }));
      showNotification('User confirmed'); onRefresh();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const addToGroup = async (groupName) => {
    try {
      const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      await client.send(new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: user.Username, GroupName: groupName }));
      showNotification(`Added to "${groupName}"`);
      setAddingGroup(false); loadUserGroups();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const removeFromGroup = (groupName) => {
    requestConfirm({
      title: `Remove from "${groupName}"?`,
      message: `${user.Username} will lose permissions from this group.`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          const { CognitoIdentityProviderClient, AdminRemoveUserFromGroupCommand } = await import('@aws-sdk/client-cognito-identity-provider');
          const client = new CognitoIdentityProviderClient(getConfig());
          await client.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: poolId, Username: user.Username, GroupName: groupName }));
          showNotification(`Removed from "${groupName}"`); loadUserGroups();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const availableGroups = allGroups.filter(g => !userGroups.find(ug => ug.GroupName === g.GroupName));

  return (
    <div className="detail-panel-overlay">
      <div className="detail-panel-backdrop" onClick={onClose} />
      <div className="detail-panel">
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--aws-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          background: 'var(--aws-surface-3)', flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: 'var(--aws-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'var(--aws-text)', flexShrink: 0,
              }}>
                {user.Username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--aws-text)' }}>{user.Username}</div>
                <div style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{getAttr(user, 'email') || 'No email set'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={user.UserStatus} colorMap={USER_STATUS_MAP} />
              <span className={`badge ${user.Enabled ? 'badge-green' : 'badge-red'}`}>{user.Enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Quick actions */}
        <div style={{
          padding: '10px 24px', borderBottom: '1px solid var(--aws-border)',
          display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, background: 'var(--aws-surface-3)',
        }}>
          <button className={`btn btn-sm ${user.Enabled ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleEnabled} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {user.Enabled ? <><UserX size={12} /> Disable</> : <><UserCheck size={12} /> Enable</>}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPwReset(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Key size={12} /> Reset Password
          </button>
          {user.UserStatus === 'UNCONFIRMED' && (
            <button className="btn btn-secondary btn-sm" onClick={confirmUser}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={12} /> Confirm User
            </button>
          )}
        </div>

        {/* Password reset inline */}
        {showPwReset && (
          <div style={{
            padding: '12px 24px', background: 'rgba(255,153,0,0.05)',
            borderBottom: '1px solid var(--aws-border)', flexShrink: 0,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--aws-text)', marginBottom: 8 }}>Set New Password</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="password" style={{ flex: 1 }}
                placeholder="New permanent password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && resetPassword()} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={resetPassword}>Set</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowPwReset(false); setNewPassword(''); }}>Cancel</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--aws-text-muted)', marginTop: 6 }}>
              Sets a permanent password and confirms the user.
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tab-bar" style={{ flexShrink: 0, padding: '0 24px' }}>
          {['attributes', 'groups', 'security'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

          {tab === 'attributes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--aws-text)' }}>User Attributes</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editing ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setAttrs(user.Attributes?.map(a => ({...a})) || []); }}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={saveAttributes} disabled={saving}>
                        {saving ? <RefreshCw size={12} className="spin" /> : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {attrs.map((attr, i) => (
                  <div key={attr.Name + i} className="kv-grid"
                    style={{ background: i % 2 === 0 ? 'var(--aws-surface-3)' : 'transparent' }}>
                    <span className="kv-label">{attr.Name}</span>
                    {editing && attr.Name !== 'sub' ? (
                      <input className="input" style={{ fontSize: 12, padding: '4px 8px' }}
                        value={attr.Value}
                        onChange={e => {
                          const updated = [...attrs];
                          updated[i] = { ...attr, Value: e.target.value };
                          setAttrs(updated);
                        }} />
                    ) : (
                      <div className="kv-value" style={{ fontFamily: attr.Name === 'sub' ? 'var(--font-mono)' : undefined }}>
                        {attr.Value || '\u2014'}
                        {attr.Value && <CopyButton value={attr.Value} size={11} />}
                      </div>
                    )}
                  </div>
                ))}
                {editing && (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, alignSelf: 'flex-start' }}
                    onClick={() => setAttrs([...attrs, { Name: 'custom:', Value: '' }])}>
                    <Plus size={11} /> Add attribute
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'groups' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--aws-text)' }}>Group Membership ({userGroups.length})</span>
                {availableGroups.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setAddingGroup(v => !v)}>
                    <Plus size={11} /> Add to group
                  </button>
                )}
              </div>
              {addingGroup && (
                <div style={{ marginBottom: 14, padding: 14, borderRadius: 8, background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Select a group:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {availableGroups.map(g => (
                      <button key={g.GroupName} className="btn btn-secondary btn-sm" onClick={() => addToGroup(g.GroupName)}>{g.GroupName}</button>
                    ))}
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setAddingGroup(false)}>Cancel</button>
                </div>
              )}
              {userGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--aws-text-muted)', fontSize: 13 }}>Not in any groups</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userGroups.map(g => (
                    <div key={g.GroupName} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 8, background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{g.GroupName}</div>
                        {g.Description && <div style={{ fontSize: 11, color: 'var(--aws-text-muted)', marginTop: 2 }}>{g.Description}</div>}
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeFromGroup(g.GroupName)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Username', user.Username],
                ['User Sub (ID)', getAttr(user, 'sub')],
                ['Status', user.UserStatus],
                ['Account', user.Enabled ? 'Enabled' : 'Disabled'],
                ['Created', fmtDate(user.UserCreateDate)],
                ['Last Modified', fmtDate(user.UserLastModifiedDate)],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16,
                  padding: '8px 12px', borderRadius: 5, background: 'var(--aws-surface-3)', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--aws-text-muted)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, wordBreak: 'break-all', fontFamily: label === 'User Sub (ID)' ? 'var(--font-mono)' : undefined }}>{value || '\u2014'}</span>
                    {value && <CopyButton value={value} size={11} />}
                  </div>
                </div>
              ))}
              {user.UserStatus === 'FORCE_CHANGE_PASSWORD' && (
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(246,201,14,0.08)', border: '1px solid rgba(246,201,14,0.25)', display: 'flex', gap: 10 }}>
                  <AlertTriangle size={16} color="var(--aws-yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--aws-yellow)', marginBottom: 4 }}>Password change required</div>
                    <div style={{ fontSize: 12, color: 'var(--aws-text-muted)', lineHeight: 1.6 }}>
                      User must change their temporary password on first sign-in. Use "Reset Password" to set a permanent password.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {confirmDialog}
      </div>
    </div>
  );
}

export default function CognitoPage({ showNotification, setPageTrail }) {
  const [proError, setProError]     = useState(false);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [users, setUsers]           = useState([]);
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tab, setTab]               = useState('users');
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser]       = useState({ username: '', email: '', password: 'Temp@1234!' });
  const [search, setSearch]         = useState('');

  const loadPoolsFn = useCallback(async () => {
    const { CognitoIdentityProviderClient, ListUserPoolsCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    const client = new CognitoIdentityProviderClient(getConfig());
    const res = await client.send(new ListUserPoolsCommand({ MaxResults: 60 }));
    return res.UserPools || [];
  }, []);

  const handlePoolError = useCallback((e) => {
    if (isProOnlyError(e)) { setProError(true); return; }
    showNotification(e.message, 'error');
  }, [showNotification]);

  const { items: pools, loading: poolsLoading, refresh: loadPools } = useAwsResource(loadPoolsFn, { onError: handlePoolError });

  const loadUsers = useCallback(async (poolId) => {
    setLoading(true);
    try {
      const { CognitoIdentityProviderClient, ListUsersCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      const res = await client.send(new ListUsersCommand({ UserPoolId: poolId, Limit: 60 }));
      setUsers(res.Users || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  const loadGroups = useCallback(async (poolId) => {
    try {
      const { CognitoIdentityProviderClient, ListGroupsCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      const res = await client.send(new ListGroupsCommand({ UserPoolId: poolId, Limit: 60 }));
      setGroups(res.Groups || []);
    } catch {}
  }, []);

  const openPool = (pool) => {
    setSelectedPool(pool); setSelectedUser(null);
    setTab('users'); setSearch('');
    loadUsers(pool.Id); loadGroups(pool.Id);
    setPageTrail?.([{
      label: pool.Name,
      onNavigateToService: () => { setSelectedPool(null); setSelectedUser(null); setPageTrail?.([]); },
    }]);
  };

  const openUser = (user) => {
    setSelectedUser(user);
    setPageTrail?.([
      {
        label: selectedPool?.Name || 'Pool',
        onClick: () => { setSelectedUser(null); setPageTrail?.([{ label: selectedPool?.Name, onNavigateToService: () => { setSelectedPool(null); setPageTrail?.([]); } }]); },
        onNavigateToService: () => { setSelectedPool(null); setSelectedUser(null); setPageTrail?.([]); },
      },
      {
        label: getAttr(user, 'email') || user.Username,
      },
    ]);
  };

  const createPoolFn = useCallback(async (name) => {
    const { CognitoIdentityProviderClient, CreateUserPoolCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    const client = new CognitoIdentityProviderClient(getConfig());
    await client.send(new CreateUserPoolCommand({ PoolName: name }));
  }, []);

  const { execute: createPool } = useAwsAction(createPoolFn, {
    showNotification,
    onSuccess: () => { setShowCreatePool(false); loadPools(); },
  });

  const createUser = async () => {
    if (!newUser.username) return;
    try {
      const { CognitoIdentityProviderClient, AdminCreateUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient(getConfig());
      const attrs = newUser.email ? [{ Name: 'email', Value: newUser.email }, { Name: 'email_verified', Value: 'true' }] : [];
      await client.send(new AdminCreateUserCommand({
        UserPoolId: selectedPool.Id, Username: newUser.username,
        TemporaryPassword: newUser.password, UserAttributes: attrs, MessageAction: 'SUPPRESS',
      }));
      showNotification(`User "${newUser.username}" created`);
      setShowCreateUser(false); setNewUser({ username: '', email: '', password: 'Temp@1234!' }); loadUsers(selectedPool.Id);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteUser = (username) => {
    requestConfirm({
      title: `Delete user "${username}"?`, message: 'This action cannot be undone.', confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const { CognitoIdentityProviderClient, AdminDeleteUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
          const client = new CognitoIdentityProviderClient(getConfig());
          await client.send(new AdminDeleteUserCommand({ UserPoolId: selectedPool.Id, Username: username }));
          showNotification('User deleted');
          if (selectedUser?.Username === username) setSelectedUser(null);
          loadUsers(selectedPool.Id);
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const deletePool = (id, name) => {
    requestConfirm({
      title: `Delete pool "${name}"?`, message: 'This action cannot be undone.', confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const { CognitoIdentityProviderClient, DeleteUserPoolCommand } = await import('@aws-sdk/client-cognito-identity-provider');
          const client = new CognitoIdentityProviderClient(getConfig());
          await client.send(new DeleteUserPoolCommand({ UserPoolId: id }));
          showNotification('Pool deleted');
          if (selectedPool?.Id === id) setSelectedPool(null); loadPools();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const filteredUsers = users.filter(u =>
    u.Username?.toLowerCase().includes(search.toLowerCase()) ||
    getAttr(u, 'email').toLowerCase().includes(search.toLowerCase())
  );

  const userColumns = [
    { key: 'Username', label: 'Username', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--aws-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {v.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontWeight: 500, color: 'var(--aws-cyan)' }}>{v}</span>
        <ChevronRight size={12} color="var(--aws-text-muted)" />
      </div>
    )},
    { key: '_email', label: 'Email', render: (v, row) => <span style={{ fontSize: 12 }}>{getAttr(row, 'email') || '\u2014'}</span> },
    { key: 'UserStatus', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={USER_STATUS_MAP} /> },
    { key: 'Enabled', label: 'Enabled', render: (v) => <span className={`badge ${v ? 'badge-green' : 'badge-red'}`}>{v ? 'Enabled' : 'Disabled'}</span> },
    { key: 'UserCreateDate', label: 'Created', render: (v) => <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{fmtDate(v)}</span> },
  ];

  const groupColumns = [
    { key: 'GroupName', label: 'Group name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'Description', label: 'Description', render: (v) => <span style={{ color: 'var(--aws-text-muted)', fontSize: 12 }}>{v || '\u2014'}</span> },
    { key: 'Precedence', label: 'Precedence', render: (v) => v ?? '\u2014' },
    { key: 'CreationDate', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  const poolColumns = [
    { key: 'Name', label: 'Pool name', render: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: 'var(--aws-cyan)' }}>{v} <ChevronRight size={13} color="var(--aws-text-muted)" /></div>
    )},
    { key: 'Id', label: 'Pool ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'CreationDate', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  if (selectedPool) {
    return (
      <div className="fade-in" style={{ position: 'relative' }}>
        <div className="page-header">
          <div>
            <div className="page-title"><Users size={20} /> {selectedPool.Name}</div>
            <div className="page-subtitle">{users.length} user{users.length !== 1 ? 's' : ''} · {groups.length} group{groups.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedPool(null); setPageTrail?.([]); }}><ArrowLeft size={13} /> Pools</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { loadUsers(selectedPool.Id); loadGroups(selectedPool.Id); }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
            {tab === 'users' && <button className="btn btn-primary" onClick={() => setShowCreateUser(true)}><Plus size={14} /> Create user</button>}
          </div>
        </div>

        <div className="tab-bar">
          {[['users', `Users (${users.length})`], ['groups', `Groups (${groups.length})`], ['details', 'Pool Details']].map(([id, label]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', maxWidth: 300 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--aws-text-muted)' }} />
                <input className="input" style={{ paddingLeft: 30, width: '100%' }} placeholder="Search users..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>Click a row to view details</span>
            </div>
            <DataTable
              columns={userColumns}
              data={filteredUsers}
              loading={loading}
              rowKey="Username"
              onRowClick={(row) => openUser(row)}
              emptyIcon={Users}
              emptyTitle="No users"
              actions={(row) => (
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(row.Username)}><Trash2 size={11} /></button>
              )}
            />
          </>
        )}

        {tab === 'groups' && (
          <DataTable
            columns={groupColumns}
            data={groups}
            loading={false}
            rowKey="GroupName"
            emptyIcon={Shield}
            emptyTitle="No groups"
          />
        )}

        {tab === 'details' && (
          <div className="card">
            <div style={{ padding: 20 }}>
              {[['Pool Name', selectedPool.Name], ['Pool ID', selectedPool.Id], ['Created', fmtDate(selectedPool.CreationDate)]].map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: '10px 0', borderBottom: '1px solid var(--aws-border)', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--aws-text-muted)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontFamily: label === 'Pool ID' ? 'var(--font-mono)' : undefined }}>{value}</span>
                    {label === 'Pool ID' && <CopyButton value={value} size={12} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCreateUser && (
          <div className="modal-overlay" onClick={() => setShowCreateUser(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Create User</span>
                <button className="close-btn" onClick={() => setShowCreateUser(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                {[['Username', 'username', 'johndoe', 'text'], ['Email (optional)', 'email', 'john@example.com', 'email'], ['Temporary Password', 'password', '', 'password']].map(([label, key, ph, type]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="input" style={{ width: '100%' }} type={type} value={newUser[key]}
                      onChange={e => setNewUser({ ...newUser, [key]: e.target.value })} placeholder={ph} autoFocus={key === 'username'} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreateUser(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createUser}>Create User</button>
              </div>
            </div>
          </div>
        )}

        {selectedUser && (
          <UserDetailPanel
            user={selectedUser}
            poolId={selectedPool.Id}
            onClose={() => {
              setSelectedUser(null);
              setPageTrail?.([{
                label: selectedPool.Name,
                onNavigateToService: () => { setSelectedPool(null); setPageTrail?.([]); },
              }]);
            }}
            onRefresh={() => loadUsers(selectedPool.Id)}
            showNotification={showNotification}
          />
        )}

        {confirmDialog}
        <style>{`.hover-row:hover { background: rgba(255,255,255,0.03); }`}</style>
      </div>
    );
  }

  if (proError) return <ServiceUnavailable serviceName="Cognito" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Users size={20} /> Cognito User Pools</div>
          <div className="page-subtitle">{pools.length} pool{pools.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadPools}><RefreshCw size={13} className={poolsLoading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreatePool(true)}><Plus size={14} /> Create pool</button>
        </div>
      </div>

      <DataTable
        columns={poolColumns}
        data={pools}
        loading={poolsLoading}
        rowKey="Id"
        onRowClick={(row) => openPool(row)}
        emptyIcon={Users}
        emptyTitle="No user pools"
        actions={(row) => (
          <button className="btn btn-danger btn-sm" onClick={() => deletePool(row.Id, row.Name)}><Trash2 size={11} /></button>
        )}
      />

      <CreateModal
        title="Create User Pool"
        open={showCreatePool}
        onClose={() => setShowCreatePool(false)}
        onSubmit={(values) => createPool(values.poolName)}
        fields={[
          { name: 'poolName', label: 'Pool Name', required: true, placeholder: 'my-user-pool' },
        ]}
        submitLabel="Create"
      />

      {confirmDialog}
      <style>{`.hover-row:hover { background: rgba(255,255,255,0.03); }`}</style>
    </div>
  );
}
