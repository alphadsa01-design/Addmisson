import React, { useEffect, useState } from 'react';
import api from '../api';
import { FileText, ShieldAlert, Monitor, Globe, Clock, Loader2 } from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId?: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  action: string;
  details: string; // JSON String
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/users/logs');
      if (response.data.status === 'success') {
        setLogs(response.data.data.logs);
      }
    } catch (err) {
      setError('Failed to fetch system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-slate-200  rounded-2xl bg-rose-50 ">
        <ShieldAlert className="w-12 h-12 mx-auto text-rose-500 mb-3" />
        <p className="text-sm font-semibold text-rose-600 ">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200  pb-5">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 ">
          System Audit Logs
        </h2>
        <p className="text-xs text-slate-500  font-medium">
          Detailed logs tracking sensitive actions and configurations performed by staff.
        </p>
      </div>

      {/* Log list */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="py-16 text-center border border-slate-200  rounded-2xl bg-slate-50/20">
            <p className="text-sm font-semibold text-slate-500">No system activities logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              let detailsObj = {};
              try {
                detailsObj = JSON.parse(log.details);
              } catch (e) {
                detailsObj = { text: log.details };
              }

              return (
                <div
                  key={log.id}
                  className="p-4 bg-white  border border-slate-200  rounded-2xl space-y-3 transition hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-slate-100  text-slate-600  rounded-xl">
                        <FileText size={16} />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 ">
                          {log.action}
                        </h4>
                        <p className="text-[10px] text-slate-500  font-medium mt-0.5">
                          Triggered By: {log.user?.name || 'System / Auto-run'} ({log.user?.email || 'N/A'})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 self-end sm:self-center font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-slate-600  font-bold hover:underline"
                      >
                        {isExpanded ? 'Hide Payload' : 'View Payload'}
                      </button>
                    </div>
                  </div>

                  {/* Device info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] text-slate-400 border-t border-slate-100  pt-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Globe size={10} /> IP: {log.ipAddress || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-sm">
                      <Monitor size={10} /> Agent: {log.userAgent || 'Unknown'}
                    </span>
                  </div>

                  {/* Payload Details */}
                  {isExpanded && (
                    <div className="mt-3 p-4 bg-slate-50  border border-slate-200  rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Log Payload Metadata
                      </p>
                      <pre className="text-[10px] font-mono text-slate-800  overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(detailsObj, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
