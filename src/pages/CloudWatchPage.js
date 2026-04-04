import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Trash2, X, ChevronRight, Search } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function CloudWatchPage({ showNotification }) {
  const [groups, setGroups] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [streams, setStreams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { CloudWatchLogsClient, DescribeLogGroupsCommand } = await import('@aws-sdk/client-cloudwatch-logs');
      const client = new CloudWatchLogsClient(getConfig());
      const res = await client.send(new DescribeLogGroupsCommand({ limit: 50 }));
      setGroups(res.logGroups || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadStreams = useCallback(async (groupName) => {
    setLoading(true);
    setStreams([]); setEvents([]); setSelectedStream(null);
    try {
      const { CloudWatchLogsClient, DescribeLogStreamsCommand } = await import('@aws-sdk/client-cloudwatch-logs');
      const client = new CloudWatchLogsClient(getConfig());
      const res = await client.send(new DescribeLogStreamsCommand({
        logGroupName: groupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 50,
      }));
      setStreams(res.logStreams || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  const loadEvents = useCallback(async (groupName, streamName) => {
    setLoading(true);
    setEvents([]);
    try {
      const { CloudWatchLogsClient, GetLogEventsCommand } = await import('@aws-sdk/client-cloudwatch-logs');
      const client = new CloudWatchLogsClient(getConfig());
      const res = await client.send(new GetLogEventsCommand({
        logGroupName: groupName,
        logStreamName: streamName,
        limit: 200,
        startFromHead: false,
      }));
      setEvents((res.events || []).reverse());
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  const deleteGroup = (name) => {
    requestConfirm({
      title: `Delete log group "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { CloudWatchLogsClient, DeleteLogGroupCommand } = await import('@aws-sdk/client-cloudwatch-logs');
        const client = new CloudWatchLogsClient(getConfig());
        await client.send(new DeleteLogGroupCommand({ logGroupName: name }));
        showNotification('Log group deleted');
        if (selectedGroup === name) { setSelectedGroup(null); setStreams([]); }
        loadGroups();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const openGroup = (name) => { setSelectedGroup(name); loadStreams(name); };
  const openStream = (name) => { setSelectedStream(name); loadEvents(selectedGroup, name); };

  const fmtTime = (ms) => ms ? new Date(ms).toLocaleString() : '-';
  const fmtBytes = (b) => b ? (b >= 1e9 ? `${(b/1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${(b/1024).toFixed(1)} KB`) : '-';

  const filteredGroups = groups.filter(g => g.logGroupName?.toLowerCase().includes(search.toLowerCase()));
  const filteredStreams = streams.filter(s => s.logStreamName?.toLowerCase().includes(search.toLowerCase()));
  const filteredEvents = events.filter(e => !filter || e.message?.toLowerCase().includes(filter.toLowerCase()));

  // Log event viewer
  if (selectedGroup && selectedStream) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title" style={{ flexWrap: 'wrap', gap: 6 }}>
              <Activity size={20} />
              <span style={{ color: 'var(--aws-text-muted)', fontSize: 14 }}>{selectedGroup.split('/').pop()}</span>
              <ChevronRight size={14} color="var(--aws-text-muted)" />
              <span>{selectedStream}</span>
            </div>
            <div className="page-subtitle">{filteredEvents.length} events</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStream(null)}>← Streams</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadEvents(selectedGroup, selectedStream)}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div className="action-row">
          <div className="search-bar" style={{ width: 320 }}>
            <Search size={13} color="var(--aws-text-muted)" />
            <input placeholder="Filter log events..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-center"><RefreshCw size={16} className="spin" /> Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state"><Activity size={40} /><h3>No events</h3><p>This log stream is empty or no events match your filter.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th style={{ width: 180 }}>Timestamp</th><th>Message</th></tr></thead>
                <tbody>
                  {filteredEvents.map((ev, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--aws-text-muted)', whiteSpace: 'nowrap' }}>
                        {fmtTime(ev.timestamp)}
                      </td>
                      <td>
                        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, color: ev.message?.includes('ERROR') || ev.message?.includes('error') ? 'var(--aws-red)' : ev.message?.includes('WARN') ? 'var(--aws-yellow)' : 'var(--aws-text)' }}>
                          {ev.message}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Stream list
  if (selectedGroup) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Activity size={20} /> {selectedGroup}</div>
            <div className="page-subtitle">{streams.length} log streams</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGroup(null)}>← Log Groups</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadStreams(selectedGroup)}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div className="action-row">
          <div className="search-bar">
            <Search size={13} color="var(--aws-text-muted)" />
            <input placeholder="Search streams..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          ) : filteredStreams.length === 0 ? (
            <div className="empty-state"><Activity size={40} /><h3>No streams</h3><p>This log group has no streams yet.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Stream name</th><th>Last event</th><th>Created</th></tr></thead>
              <tbody>
                {filteredStreams.map(s => (
                  <tr key={s.logStreamName}>
                    <td>
                      <button className="link-btn" onClick={() => openStream(s.logStreamName)}>{s.logStreamName}</button>
                    </td>
                    <td style={{ fontSize: 12 }}>{fmtTime(s.lastEventTimestamp)}</td>
                    <td style={{ fontSize: 12 }}>{fmtTime(s.creationTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
            {confirmDialog}
</div>
    );
  }

  // Group list
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Activity size={20} /> CloudWatch Logs</div>
          <div className="page-subtitle">{groups.length} log group{groups.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="search-bar">
            <Search size={13} color="var(--aws-text-muted)" />
            <input placeholder="Search log groups..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadGroups}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        ) : filteredGroups.length === 0 ? (
          <div className="empty-state"><Activity size={40} /><h3>No log groups</h3><p>Log groups appear here when Lambda functions, ECS tasks, or other services write logs.</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Log group name</th><th>Stored bytes</th><th>Retention</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {filteredGroups.map(g => (
                <tr key={g.logGroupName}>
                  <td><button className="link-btn" onClick={() => openGroup(g.logGroupName)}>{g.logGroupName}</button></td>
                  <td>{fmtBytes(g.storedBytes)}</td>
                  <td>{g.retentionInDays ? `${g.retentionInDays} days` : <span style={{ color: 'var(--aws-text-muted)' }}>Never expire</span>}</td>
                  <td style={{ fontSize: 12 }}>{fmtTime(g.creationTime)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openGroup(g.logGroupName)}>Streams</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteGroup(g.logGroupName)}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
