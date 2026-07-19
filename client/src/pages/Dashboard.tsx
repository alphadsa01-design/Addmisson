import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  AlertCircle,
  Clock,
  ArrowRight,
  School,
  UserCheck,
  Plus,
} from 'lucide-react';

interface StatsData {
  total: number;
  byStatus: {
    PENDING: number;
    VERIFIED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  byFee: {
    PAID: number;
    UNPAID: number;
    PARTIAL: number;
  };
  tradeStats: {
    tradeName: string;
    tradeCode: string;
    count: number;
  }[];
  districtStats: {
    district: string;
    count: number;
  }[];
}

interface AdmissionItem {
  id: string;
  admissionNumber: string;
  createdAt: string;
  status: string;
  student: {
    name: string;
  };
  trade: {
    name: string;
    code: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<AdmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, admissionsRes] = await Promise.all([
        api.get('/admissions/stats'),
        api.get('/admissions?page=1&limit=5'),
      ]);

      if (statsRes.data.status === 'success') {
        setStats(statsRes.data.data);
      }
      if (admissionsRes.data.status === 'success') {
        setRecentAdmissions(admissionsRes.data.data.admissions);
      }
    } catch (err) {
      setError('Failed to fetch registry dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-slate-900">
      {/* Professional Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 sm:pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-widest leading-none">
            Desk Console
          </span>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 mt-2">
            Admission Desk Dashboard
          </h2>
          <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            Welcome back, <span className="font-extrabold text-slate-900">{user?.name}</span>. Currently managing active student registries for the current session.
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => navigate('/admissions/new')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs"
          >
            <Plus size={14} />
            Record Admission
          </button>
          <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600 font-semibold shadow-2xs">
            <Clock size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Corporate Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Registers Card */}
        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 hover:border-slate-300 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Registers</span>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
              <Users size={16} className="text-slate-700" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stats?.total || 0}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Student entries registered</p>
          </div>
        </div>

        {/* Selected Institute Card */}
        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 hover:border-slate-300 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active College</span>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
              <School size={16} className="text-slate-700" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">ITI Punhana</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">District: Mewat • Haryana</p>
          </div>
        </div>

        {/* System Operator Card */}
        <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 hover:border-slate-300 transition sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator Session</span>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
              <UserCheck size={16} className="text-slate-700" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-850 truncate">{user?.name}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Role: Operator</p>
          </div>
        </div>
      </div>

      {/* Recent Admissions Registry Table (Clean) */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Registry Entries</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Latest admissions added to the system database</p>
          </div>
          <button
            onClick={() => navigate('/admissions')}
            className="text-[10px] text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 hover:bg-slate-50 transition"
          >
            See All Registers <ArrowRight size={12} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentAdmissions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 font-medium">No recent entries recorded in the database.</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-150">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-3 text-left text-[9px] font-bold uppercase tracking-wider">Admission No</th>
                  <th className="py-3 text-left text-[9px] font-bold uppercase tracking-wider">Candidate Name</th>
                  <th className="py-3 text-left text-[9px] font-bold uppercase tracking-wider">Allocated Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAdmissions.map((a) => (
                  <tr key={a.id} className="text-xs hover:bg-slate-50/40 transition">
                    <td className="py-3.5 font-bold text-slate-900">{a.admissionNumber}</td>
                    <td className="py-3.5 font-semibold text-slate-700">{a.student.name}</td>
                    <td className="py-3.5 text-slate-500">{a.trade.name} ({a.trade.code})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
