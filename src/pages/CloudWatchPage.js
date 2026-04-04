import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Trash2, ChevronRight, Search } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import { fmtDate, fmtSize } from '../utils/formatters';

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

  const filteredGroups = groups.filter(g => g.logGroupName?.toLowerCase().includes(search.toLowerCase()));
  const filteredStreams = streams.filter(s => s.logStreamName?.toLowerCase().includes(search.toLowerCase()));
  const filteredEvents = events.filter(e => !filter || e.message?.toLowerCase().includes(filter.toLowerCase()));

  // Log event viewer (complex nested view — keep custom)
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
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStream(null)}>&#8592; Streams</button>
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
                        {fmtDate(ev.timestamp)}
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

  // Stream list (nested sub-view — keep custom navigation, migrate table)
  if (selectedGroup) {
    const streamColumns = [
      { key: 'logStreamName', label: 'Stream name', render: (v) => <button className="link-btn" onClick={() => openStream(v)}>{v}</button> },
      { key: 'lastEventTimestamp', label: 'Last event', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
      { key: 'creationTime', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    ];

    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Activity size={20} /> {selectedGroup}</div>
            <div className="page-subtitle">{streams.length} log streams</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGroup(null)}>&#8592; Log Groups</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadStreams(selectedGroup)}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <DataTable
          columns={streamColumns}
          data={filteredStreams}
          loading={loading}
          rowKey="logStreamName"
          searchable
          searchPlaceholder="Search streams..."
          searchKeys={['logStreamName']}
          emptyIcon={Activity}
          emptyTitle="No streams"
          emptyDescription="This log group has no streams yet."
        />

        <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
        {confirmDialog}
      </div>
    );
  }

  // Group list (outer table — migrate)
  const groupColumns = [
    { key: 'logGroupName', label: 'Log group name', render: (v) => <button className="link-btn" onClick={() => openGroup(v)}>{v}</button> },
    { key: 'storedBytes', label: 'Stored bytes', render: (v) => fmtSize(v) },
    { key: 'retentionInDays', label: 'Retention', render: (v) => v ? `${v} days` : <span style={{ color: 'var(--aws-text-muted)' }}>Never expire</span> },
    { key: 'creationTime', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

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

      <DataTable
        columns={groupColumns}
        data={filteredGroups}
        loading={loading}
        rowKey="logGroupName"
        emptyIcon={Activity}
        emptyTitle="No log groups"
        emptyDescription="Log groups appear here when Lambda functions, ECS tasks, or other services write logs."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => openGroup(row.logGroupName)}>Streams</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteGroup(row.logGroupName)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
