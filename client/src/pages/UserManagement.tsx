import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  designation?: string;
  lastLogin?: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.status === 'success') {
        setUsers(response.data.data.users);
      }
    } catch (err) {
      setError('Failed to fetch users list. Only authorized admins have access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const confirm = window.confirm(`Are you sure you want to change this user's role to ${newRole}?`);
    if (!confirm) return;

    setUpdatingId(userId);
    try {
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      if (response.data.status === 'success') {
        alert('Role changed successfully.');
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

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
      <div className="flex items-center justify-between border-b border-slate-200  pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 ">
            User Account Management
          </h2>
          <p className="text-xs text-slate-500  font-medium">
            Manage system roles and view active staff logins.
          </p>
        </div>
      </div>

      {/* Grid of Users */}
      <div className="overflow-x-auto border border-slate-200  rounded-2xl bg-white ">
        <table className="min-w-full divide-y divide-slate-200 ">
          <thead className="bg-slate-50 ">
            <tr>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Staff Member
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Last Log In
              </th>
              {currentUser?.role === 'SUPER_ADMIN' && (
                <th className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Modify Role
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 ">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/40 ">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100  border border-slate-200  flex items-center justify-center text-slate-500  font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 ">
                        {u.name}
                      </p>
                      <span className="block text-[10px] text-slate-500  mt-1">
                        {u.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700 ">
                  {u.designation || 'Staff Member'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                    u.role === 'SUPER_ADMIN'
                      ? 'bg-rose-50  text-rose-600  border-rose-200'
                      : u.role === 'ADMIN'
                      ? 'bg-amber-50  text-amber-600  border-amber-200'
                      : 'bg-slate-50  text-slate-600  border-slate-200'
                  }`}>
                    {u.role === 'SUPER_ADMIN' ? <ShieldCheck size={10} /> : <Shield size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[10px] text-slate-500">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                </td>
                {currentUser?.role === 'SUPER_ADMIN' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    {updatingId === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600 ml-auto" />
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === currentUser.id}
                        className="px-2 py-1 border border-slate-200  rounded-lg text-xs bg-white  text-slate-700  focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50"
                      >
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
