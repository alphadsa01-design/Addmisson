import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Check, X, Shield, PlusCircle, Loader2 } from 'lucide-react';

interface RequestItem {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  requestedRole: 'ADMIN' | 'SUPER_ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  reviewedBy?: {
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

const AdminRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit Request Fields
  const [requestedRole, setRequestedRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [remarks, setRemarks] = useState('');

  // Resolve remarks for each request in a map
  const [resolveRemarks, setResolveRemarks] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      let response;
      if (['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) {
        response = await api.get('/users/requests');
      } else {
        response = await api.get('/auth/my-requests');
      }

      if (response.data.status === 'success') {
        setRequests(response.data.data.requests);
      }
    } catch (err) {
      setError('Failed to fetch admin upgrade requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await api.post('/auth/request-admin', {
        requestedRole,
        remarks,
      });

      if (response.data.status === 'success') {
        setSuccess('Upgrade request submitted successfully.');
        setRemarks('');
        fetchRequests();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const confirm = window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`);
    if (!confirm) return;

    setResolvingId(requestId);
    try {
      const response = await api.post(`/users/requests/${requestId}/resolve`, {
        status,
        remarks: resolveRemarks[requestId] || '',
      });

      if (response.data.status === 'success') {
        alert(`Request has been ${status.toLowerCase()} successfully.`);
        // Clear resolver remarks for that ID
        setResolveRemarks((prev) => {
          const updated = { ...prev };
          delete updated[requestId];
          return updated;
        });
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Resolution failed');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200  pb-5">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 ">
          Role Upgrade Requests
        </h2>
        <p className="text-xs text-slate-500  font-medium">
          Create upgrade petitions or resolve pending staff requests.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50  border border-rose-200  text-rose-600  text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Staff Request Form */}
      {user?.role === 'STAFF' && (
        <div className="p-6 bg-slate-50  border border-slate-200  rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900  flex items-center gap-2">
            <PlusCircle size={18} className="text-slate-600" />
            Submit Upgrade Petition
          </h3>

          {success && (
            <div className="p-4 bg-slate-50  border border-slate-200  text-slate-600  text-xs rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-600  mb-2">
                Requested Role *
              </label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-slate-200  rounded-xl text-xs bg-white  text-slate-700  focus:outline-none"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-600  mb-2">
                  Remarks / Justification *
                </label>
                <input
                  type="text"
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="State the reason for access upgrade (min 5 chars)..."
                  className="w-full px-3.5 py-2.5 border border-slate-200  rounded-xl text-xs bg-white  text-slate-700  focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Registry */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Shield size={14} />
          Requests Log
        </h3>

        {requests.length === 0 ? (
          <div className="py-12 text-center border border-slate-200  rounded-2xl bg-slate-50/20">
            <p className="text-sm font-semibold text-slate-500">No role upgrade requests logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200  rounded-2xl bg-white ">
            <table className="min-w-full divide-y divide-slate-200 ">
              <thead className="bg-slate-50 ">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Requested Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Resolved By
                  </th>
                  {user?.role === 'SUPER_ADMIN' && (
                    <th className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 ">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/40 ">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-900 ">
                        {r.user?.name || 'Self'}
                      </p>
                      <span className="block text-[9px] text-slate-400 mt-1">
                        Current: {r.user?.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700 ">
                      {r.requestedRole}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600  max-w-[200px] truncate">
                      {r.remarks || 'No remarks provided.'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        r.status === 'APPROVED'
                          ? 'bg-slate-50  text-slate-600  border-slate-200'
                          : r.status === 'REJECTED'
                          ? 'bg-rose-50  text-rose-600  border-rose-200'
                          : 'bg-amber-50  text-amber-600  border-amber-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {r.reviewedBy ? (
                        <>
                          <p className="font-semibold">{r.reviewedBy.name}</p>
                          <span className="block text-[9px] mt-0.5">
                            {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ''}
                          </span>
                        </>
                      ) : (
                        '--'
                      )}
                    </td>
                    {user?.role === 'SUPER_ADMIN' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {r.status === 'PENDING' ? (
                          resolvingId === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600 ml-auto" />
                          ) : (
                            <div className="flex flex-col items-end gap-2">
                              <input
                                type="text"
                                value={resolveRemarks[r.id] || ''}
                                onChange={(e) =>
                                  setResolveRemarks({ ...resolveRemarks, [r.id]: e.target.value })
                                }
                                placeholder="Resolver remarks..."
                                className="px-2 py-1 border border-slate-200  rounded-lg text-[10px] bg-slate-50  w-36 focus:outline-none"
                              />
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => handleResolveRequest(r.id, 'APPROVED')}
                                  className="p-1 text-slate-600 hover:bg-slate-50  border border-slate-200  rounded-lg transition"
                                  title="Approve Petition"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleResolveRequest(r.id, 'REJECTED')}
                                  className="p-1 text-rose-600 hover:bg-rose-50  border border-rose-200  rounded-lg transition"
                                  title="Reject Petition"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400">Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
