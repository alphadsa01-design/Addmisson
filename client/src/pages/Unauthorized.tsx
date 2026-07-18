import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md space-y-4">
        <div className="p-4 bg-rose-50  border border-rose-200  text-rose-500 rounded-full inline-block">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900  tracking-tight">
          ACCESS RESTRICTED (403)
        </h2>
        <p className="text-xs text-slate-500  font-semibold leading-relaxed">
          You do not have the required role authorizations to view this administrative registry. Please submit a role upgrade petition to your administrator.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs transition"
        >
          Return to Safety
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
