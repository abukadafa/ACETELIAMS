import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import { Activity, Database, Server, CheckCircle2, AlertCircle } from 'lucide-react';

const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const [appHealth, dbHealth]: any = await Promise.all([
          api.get('/health'),
          api.get('/health/db')
        ]);
        setHealth({ app: appHealth, db: dbHealth });
      } catch (err) {
        console.error('Health check failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Checking ACETEL Systems...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-[#3B6D11] p-3 rounded-2xl text-white">
          <Activity size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#173404]">System Health Status</h1>
          <p className="text-[#639922] font-bold">ACETEL Integrated Academic Management System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Server Card */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <Server size={24} />
            </div>
            {health?.app ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
          </div>
          <h3 className="text-xl font-black text-[#1e293b] mb-2">API Server</h3>
          <p className="text-[#64748b] text-sm mb-4">Core backend services and request handling.</p>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${health?.app ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-bold text-sm uppercase tracking-wider">{health?.app ? 'Operational' : 'Unreachable'}</span>
          </div>
        </div>

        {/* Database Card */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
              <Database size={24} />
            </div>
            {health?.db?.status === 'healthy' ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
          </div>
          <h3 className="text-xl font-black text-[#1e293b] mb-2">Institutional Database</h3>
          <p className="text-[#64748b] text-sm mb-4">MongoDB instance for student and faculty records.</p>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${health?.db?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-bold text-sm uppercase tracking-wider">{health?.db?.status === 'healthy' ? 'Connected' : 'Disconnected'}</span>
          </div>
          {health?.db?.metrics && (
            <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Collections</p>
                <p className="text-lg font-black text-[#1e293b]">{health.db.metrics.collections}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Connections</p>
                <p className="text-lg font-black text-[#1e293b]">{health.db.metrics.connections}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;
