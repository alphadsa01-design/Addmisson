import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

import {
  Search,
  PlusCircle,
  Printer,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Admission {
  id: string;
  sno?: string | null;
  admissionNumber: string;
  admissionDate?: string | null;
  academicYear: string;
  status: 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED';
  feeStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  createdAt: string;
  student: {
    name: string;
    mobileNumber: string;
    fatherName: string;
    category: string;
    gender: string;
    dateOfBirth?: string | null;
    religion?: string | null;
    motherName?: string | null;
    address: string;
    alternateMobile?: string | null;
    bloodGroup?: string | null;
    nationality?: string | null;
  };
  institute: {
    name: string;
    code: string;
  };
  trade: {
    name: string;
    code: string;
  };
  documentVerification?: {
    tenthMarksheetNumber?: string | null;
    tenthMarksheetVerified: boolean;
    aadhaarNumber?: string | null;
    aadhaarVerified: boolean;
  } | null;
}

const Admissions: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [tradeId, setTradeId] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  // Dropdown options
  const [trades, setTrades] = useState<{ id: string; name: string; code: string }[]>([]);

  // Table Data State
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdmissions, setTotalAdmissions] = useState(0);

  // Selected Admission for Details Modal
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  const fetchDropdowns = async () => {
    try {
      const tradeRes = await api.get('/admissions/meta/trades');
      setTrades(tradeRes.data.data.trades);
    } catch (err) {
      console.error('Failed to load dropdown filters', err);
    }
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && { status }),
        ...(feeStatus && { feeStatus }),
        ...(tradeId && { tradeId }),
        ...(academicYear && { academicYear }),
      });

      const response = await api.get(`/admissions?${params.toString()}`);
      if (response.data.status === 'success') {
        setAdmissions(response.data.data.admissions);
        setTotalPages(response.data.pagination.totalPages);
        setTotalAdmissions(response.data.pagination.total);
      }
    } catch (err) {
      setError('Failed to fetch admissions list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [page, status, feeStatus, tradeId, academicYear]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAdmissions();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete the admission register file for ${name}?`);
    if (!confirm) return;

    try {
      const response = await api.delete(`/admissions/${id}`);
      if (response.data.status === 'success') {
        alert('Admission record deleted successfully.');
        fetchAdmissions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete operation failed');
    }
  };

  const handlePrintReceipt = (admissionId: string) => {
    window.open(`/api/reports/pdf/${admissionId}`, '_blank');
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setFeeStatus('');
    setTradeId('');
    setAcademicYear('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200  pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 ">
            Admission Registers File Index
          </h2>
          <p className="text-xs text-slate-500  font-medium">
            Search, filter, edit, print receipts, and manage student admission registries.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admissions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-slate-600/10"
          >
            <PlusCircle size={16} />
            Record Admission
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50  border border-rose-200  text-rose-600  text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <div className="p-4 bg-slate-50  border border-slate-200  rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, admission number, father, mobile..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200  rounded-xl text-xs bg-white  focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
          </div>



          <div>
            <select
              value={tradeId}
              onChange={(e) => {
                setTradeId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200  rounded-xl text-xs bg-white  focus:outline-none"
            >
              <option value="">All Trades</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 bg-white  border border-slate-200  text-slate-500 rounded-xl text-xs hover:bg-slate-50  transition"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : admissions.length === 0 ? (
        <div className="py-16 text-center border border-slate-200  rounded-2xl bg-slate-50/20">
          <p className="text-sm font-semibold text-slate-500">No matching ITI admission registers found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200  rounded-2xl bg-white ">
            <table className="min-w-full divide-y divide-slate-200 ">
              <thead className="bg-slate-50 ">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Admission No
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Allocated Trade
                  </th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 ">
                {admissions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/40 ">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600 ">
                      {a.sno || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900 ">
                      {a.admissionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-900 ">
                        {a.student.name}
                      </p>
                      <span className="block text-[10px] text-slate-500  mt-1">
                        Father: {a.student.fatherName} • Ph: {a.student.mobileNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-800  truncate max-w-[150px]">
                        {a.trade.name}
                      </p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAdmission(a)}
                          className="p-1.5 text-slate-500 hover:text-slate-900  hover:bg-slate-100  rounded-lg transition"
                          title="View Registration File"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(a.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900  hover:bg-slate-100  rounded-lg transition"
                          title="Download/Print Acknowledgement Slip"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/admissions/edit/${a.id}`)}
                          className="p-1.5 text-slate-500 hover:bg-slate-50  rounded-lg transition"
                          title="Edit Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.student.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50  rounded-lg transition"
                          title="Delete Registry File"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-semibold text-slate-500">
              Showing {admissions.length} of {totalAdmissions} admission registries
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200  rounded-lg text-slate-500 hover:bg-slate-100  disabled:opacity-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3.5 py-1.5 bg-slate-50  border border-slate-200  rounded-lg text-xs font-bold text-slate-600 ">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200  rounded-lg text-slate-500 hover:bg-slate-100  disabled:opacity-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white  border border-slate-200  rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200  flex justify-between items-center bg-slate-900 text-white relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-white to-slate-600"></div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">ITI CANDIDATE PROFILE ARCHIVE</h3>
                <p className="text-[10px] text-slate-400 font-medium">Internal registry file details</p>
              </div>
              <button
                onClick={() => setSelectedAdmission(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 ">
              {/* Primary Info Banner */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50  border border-slate-200  p-4 rounded-xl">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">S.No</span>
                  <span className="text-xs font-extrabold text-slate-900 ">{selectedAdmission.sno || '-'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admission No</span>
                  <span className="text-xs font-extrabold text-slate-900 ">{selectedAdmission.admissionNumber}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Session</span>
                  <span className="text-xs font-extrabold text-slate-900 ">{selectedAdmission.academicYear}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date of Admission</span>
                  <span className="text-xs font-extrabold text-slate-900 ">
                    {selectedAdmission.admissionDate ? new Date(selectedAdmission.admissionDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              {/* Candidate Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100  pb-1.5">
                  Candidate Profile Details
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block">Candidate Name:</span>
                    <span className="font-semibold text-slate-900 ">{selectedAdmission.student.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Father's Name:</span>
                    <span className="font-semibold text-slate-900 ">{selectedAdmission.student.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender:</span>
                    <span className="font-semibold text-slate-900 ">{selectedAdmission.student.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Category:</span>
                    <span className="font-semibold text-slate-900 ">{selectedAdmission.student.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mobile No:</span>
                    <span className="font-semibold text-slate-900 ">{selectedAdmission.student.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Residential Address:</span>
                    <span className="font-semibold text-slate-900 ">{selectedAdmission.student.address}</span>
                  </div>
                </div>
              </div>

              {/* Allocation Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100  pb-1.5">
                  Course Allocation
                </h4>
                <div className="grid grid-cols-1 gap-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Allocated Trade:</span>
                    <span className="font-semibold text-slate-900 ">
                      {selectedAdmission.trade.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200  bg-slate-50  flex justify-end gap-2">
              <button
                onClick={() => handlePrintReceipt(selectedAdmission.id)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                <Printer size={14} />
                Print Acknowledgement
              </button>
              <button
                onClick={() => setSelectedAdmission(null)}
                className="px-4 py-2 bg-white  border border-slate-200  text-slate-600  font-bold rounded-xl text-xs hover:bg-slate-100  transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;
