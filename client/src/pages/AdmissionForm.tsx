import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api';
import { Save, ArrowLeft, Loader2, ClipboardCheck, ShieldAlert } from 'lucide-react';

const formSchema = z.object({
  sno: z.string().optional().nullable().or(z.literal('')),
  admissionNumber: z.string().optional().nullable().or(z.literal('')),
  name: z.string().min(2, 'Student name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
  gender: z.string().min(1, 'Gender selection is required'),
  category: z.string().min(1, 'Category selection is required'),
  tradeId: z.string().uuid('Please select a course trade'),
  address: z.string().min(5, 'Address is too short'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  admissionDate: z.string().min(1, 'Date of admission is required'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g., 2026-2027)'),
  
  // Backwards compatibility / hidden fields
  instituteId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const AdmissionForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [institutes, setInstitutes] = useState<{ id: string; name: string; code: string }[]>([]);
  const [trades, setTrades] = useState<{ id: string; name: string; code: string; durationYears: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sno: '',
      admissionNumber: '',
      name: '',
      fatherName: '',
      gender: '',
      category: '',
      tradeId: '',
      address: '',
      mobileNumber: '',
      admissionDate: new Date().toISOString().split('T')[0],
      academicYear: '2026-2027',
    },
  });

  // Fetch meta-options (institutes & trades)
  const fetchMetadata = async () => {
    try {
      const [instRes, tradeRes, statsRes] = await Promise.all([
        api.get('/admissions/meta/institutes').catch(() => ({ data: { status: 'success', data: { institutes: [] } } })),
        api.get('/admissions/meta/trades').catch(() => ({ data: { status: 'success', data: { trades: [] } } })),
        api.get('/admissions/stats').catch(() => ({ data: { status: 'success', data: { total: 0 } } })),
      ]);

      const fetchedInsts = instRes.data?.data?.institutes || [];
      const fetchedTrades = tradeRes.data?.data?.trades || [];

      if (fetchedInsts.length > 0) setInstitutes(fetchedInsts);
      if (fetchedTrades.length > 0) setTrades(fetchedTrades);

      if (!isEdit && statsRes.data?.status === 'success' && statsRes.data?.data?.total !== undefined) {
        const nextSno = String(statsRes.data.data.total + 1);
        setValue('sno', nextSno);
      }
    } catch (err) {
      console.error('Metadata fetching failed', err);
    }
  };

  useEffect(() => {
    const punhana = institutes.find(i => i.name.toLowerCase().includes('punhana'));
    if (punhana) {
      setValue('instituteId', punhana.id);
    } else if (institutes.length > 0) {
      setValue('instituteId', institutes[0].id);
    }
  }, [institutes, setValue]);

  // Fetch admission to edit
  const fetchAdmissionToEdit = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/admissions/${id}`);
      if (response.data.status === 'success') {
        const a = response.data.data.admission;
        reset({
          sno: a.sno || '',
          admissionNumber: a.admissionNumber,
          name: a.student.name,
          fatherName: a.student.fatherName,
          gender: a.student.gender,
          category: a.student.category,
          tradeId: a.tradeId,
          address: a.student.address,
          mobileNumber: a.student.mobileNumber,
          admissionDate: a.admissionDate ? a.admissionDate.split('T')[0] : new Date().toISOString().split('T')[0],
          instituteId: a.instituteId,
          academicYear: a.academicYear,
        });
      }
    } catch (err) {
      setError('Failed to fetch the admission record for editing.');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchMetadata();
      if (isEdit) {
        await fetchAdmissionToEdit();
      }
    };
    init();
  }, [id]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (isEdit) {
        response = await api.put(`/admissions/${id}`, data);
      } else {
        response = await api.post('/admissions', data);
      }

      if (response.data.status === 'success') {
        navigate('/admissions');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit admission record');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-sm font-semibold text-slate-500">Loading candidate register...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admissions')}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition border border-slate-200"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              {isEdit ? 'Modify Admission Entry' : 'Record New Admission Entry'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Enter candidate details below to update the system admission database.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-2xl flex items-center gap-3">
          <ShieldAlert size={16} />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Main Form Box */}
      <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
            <ClipboardCheck size={14} className="text-slate-600" />
            Registry Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Admission No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Admission Number
              </label>
              <input
                type="text"
                {...register('admissionNumber')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
                placeholder="E.g., ITI/2026/0001 (Leave empty to auto-generate)"
              />
              {errors.admissionNumber && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.admissionNumber.message}</p>}
            </div>

            {/* Session */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Session *
              </label>
              <input
                type="text"
                {...register('academicYear')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
                placeholder="E.g., 2026-2027"
              />
              {errors.academicYear && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.academicYear.message}</p>}
            </div>

            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Candidate Name *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
                placeholder="Full Name"
              />
              {errors.name && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.name.message}</p>}
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Father's Name *
              </label>
              <input
                type="text"
                {...register('fatherName')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
                placeholder="Father's Full Name"
              />
              {errors.fatherName && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.fatherName.message}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.gender.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="BC1">BC1 (Backward Class Block A)</option>
                <option value="BC2">BC2 (Backward Class Block B)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
              </select>
              {errors.category && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.category.message}</p>}
            </div>

            {/* Allocated Trade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Allocated Course Trade *
              </label>
              <select
                {...register('tradeId')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
              >
                <option value="">Select Course Trade</option>
                {trades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.tradeId && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.tradeId.message}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="text"
                {...register('mobileNumber')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
                placeholder="10-digit mobile number"
              />
              {errors.mobileNumber && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.mobileNumber.message}</p>}
            </div>

            {/* Date of Admission */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Date of Admission *
              </label>
              <input
                type="date"
                {...register('admissionDate')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
              />
              {errors.admissionDate && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.admissionDate.message}</p>}
            </div>
          </div>

          {/* Full Width Address Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Residential Address *
            </label>
            <textarea
              rows={3}
              {...register('address')}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-600/10 focus:border-slate-600 focus:outline-none transition"
              placeholder="Candidate's permanent address"
            />
            {errors.address && <p className="text-[10px] text-rose-600 mt-1.5 font-bold">{errors.address.message}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/admissions')}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmissionForm;
