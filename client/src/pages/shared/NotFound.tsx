import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white border-2 border-slate-100 rounded-3xl p-12 text-center max-w-md shadow-2xl">
        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <FileQuestion size={40} />
        </div>
        <h1 className="text-3xl font-black text-[#1e293b] mb-4">Page Not Found</h1>
        <p className="text-[#64748b] mb-8 font-medium leading-relaxed">
          The page you are looking for does not exist or has been moved within the ACETEL IAMS infrastructure.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full px-8 py-4 bg-[#3B6D11] hover:bg-[#639922] text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
        >
          BACK TO PORTAL HOME
        </button>
      </div>
    </div>
  );
};

export default NotFound;
