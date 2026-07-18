import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Printer,
  FileSpreadsheet,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Trade {
  id: string;
  name: string;
  code: string;
}

interface Admission {
  id: string;
  sno?: string | null;
  admissionNumber: string;
  admissionDate?: string | null;
  academicYear: string;
  status: string;
  feeStatus: string;
  createdAt: string;
  student: {
    name: string;
    mobileNumber: string;
    fatherName: string;
    category: string;
    gender: string;
    address: string;
  };
  trade: {
    name: string;
    code: string;
  };
}

const PrintReports: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [totalAdmissions, setTotalAdmissions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(false);

  // Filter States
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [tradeId, setTradeId] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch Metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const tradeRes = await api.get('/admissions/meta/trades');
        setTrades(tradeRes.data.data.trades);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Filtered Admissions List on filter/page change
  const fetchFilteredList = async () => {
    try {
      setFetchingList(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(academicYear && { academicYear }),
        ...(tradeId && { tradeId }),
      });
      const response = await api.get(`/admissions?${params.toString()}`);
      if (response.data.status === 'success') {
        setAdmissions(response.data.data.admissions);
        setTotalAdmissions(response.data.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch filtered list:', err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    fetchFilteredList();
  }, [page, academicYear, tradeId]);

  const getExportParams = () => {
    return new URLSearchParams({
      ...(tradeId && { tradeId }),
      ...(academicYear && { academicYear }),
    });
  };

  const handlePrintPDF = () => {
    const params = getExportParams();
    window.open(`/api/reports/pdf-list?${params.toString()}`, '_blank');
  };

  const handleExportExcel = () => {
    const params = getExportParams();
    window.open(`/api/reports/excel?${params.toString()}`, '_blank');
  };

  const handleResetFilters = () => {
    setTradeId('');
    setAcademicYear('2026-2027');
    setPage(1);
  };

  const totalPages = Math.ceil(totalAdmissions / limit);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Print Admissions Reports
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Apply session and trade filters to preview, print landscape tables, or export Excel spreadsheets.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Printer size={16} />
            Print Report (PDF)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Form Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <SlidersHorizontal size={14} className="text-slate-600" />
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Report Filters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Session */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none transition"
                  placeholder="E.g., 2026-2027"
                />
              </div>

              {/* Course Trade */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Course Trade
                </label>
                <select
                  value={tradeId}
                  onChange={(e) => { setTradeId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none transition"
                >
                  <option value="">All Course Trades</option>
                  {trades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Reset Filters
              </button>
              <div className="text-[10px] text-slate-500 font-bold">
                Matching Records: {totalAdmissions}
              </div>
            </div>
          </div>

          {/* Records Table Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
            {fetchingList && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 border-b border-slate-800">S.No</th>
                    <th className="py-3 px-4 border-b border-slate-800">Admission No</th>
                    <th className="py-3 px-4 border-b border-slate-800">Candidate Name</th>
                    <th className="py-3 px-4 border-b border-slate-800">Father's Name</th>
                    <th className="py-3 px-4 border-b border-slate-800">Gender</th>
                    <th className="py-3 px-4 border-b border-slate-800">Category</th>
                    <th className="py-3 px-4 border-b border-slate-800">Allocated Trade</th>
                    <th className="py-3 px-4 border-b border-slate-800">Mobile No</th>
                    <th className="py-3 px-4 border-b border-slate-800">Address</th>
                    <th className="py-3 px-4 border-b border-slate-800">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {admissions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                        No admission records found matching these filter choices.
                      </td>
                    </tr>
                  ) : (
                    admissions.map((a, index) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition font-medium text-slate-700">
                        <td className="py-3 px-4 font-bold text-slate-900">{a.sno || (page - 1) * limit + index + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{a.admissionNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{a.student.name}</td>
                        <td className="py-3 px-4">{a.student.fatherName}</td>
                        <td className="py-3 px-4">{a.student.gender}</td>
                        <td className="py-3 px-4">{a.student.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{a.trade.name}</td>
                        <td className="py-3 px-4">{a.student.mobileNumber}</td>
                        <td className="py-3 px-4">{a.student.address}</td>
                        <td className="py-3 px-4">
                          {a.admissionDate ? new Date(a.admissionDate).toLocaleDateString() : new Date(a.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between no-print">
                <span className="text-[10px] text-slate-500 font-bold">
                  Showing page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintReports;
