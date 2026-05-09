import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white border-2 border-red-100 rounded-3xl p-12 text-center max-w-md shadow-2xl">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-[#1e293b] mb-4">Access Denied</h1>
        <p className="text-[#64748b] mb-8 font-medium leading-relaxed">
          Your current role does not have permission to view this institutional resource. 
          If you believe this is an error, please contact the ACETEL technical team.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="w-full px-8 py-4 bg-[#1e293b] hover:bg-[#334155] text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
        >
          RETURN TO PREVIOUS PAGE
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
