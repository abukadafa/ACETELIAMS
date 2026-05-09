import React, { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    Plus,
    Trash2,
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

interface Lab {
    _id: string;
    name: string;
    type: string;
}

interface Facilitator {
    _id: string;
    name: string;
    email: string;
    username: string;
    enrolledLabs: string[];
}

const ManageFacilitators: React.FC = () => {
    const { token } = useAuth();
    const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const allUsers = await api.get('/users');
            const list = Array.isArray(allUsers) ? allUsers : [];
            setFacilitators(
                list
                    .filter((u: any) => u.role === 'facilitator')
                    .map((u: any) => ({
                        ...u,
                        enrolledLabs: Array.isArray(u.enrolledLabs) ? u.enrolledLabs : [],
                    }))
            );
            setLabs([]);
        } catch (err: any) {
            console.error('Failed to fetch data:', err);
            setError(err?.message || 'Failed to load facilitators');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignLab = async (_facilitatorId: string, _labId: string) => {
        setError('Lab assignment is not available in this deployment (no lab API). Manage facilitators from the main dashboard.');
    };

    const handleRemoveLab = async (_facilitatorId: string, _labId: string) => {
        setError('Lab assignment is not available in this deployment (no lab API).');
    };

    const filteredFacilitators = facilitators.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-acetel-green animate-spin" />
                <p className="mt-4 text-slate-500 font-medium font-heading">Loading facilitator data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-acetel-navy font-heading">Facilitator Lab Access</h2>
                    <p className="text-slate-500 text-sm">Facilitator accounts from user directory. Lab assignment UI is disabled unless a lab service is deployed.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search facilitators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-acetel-green outline-none transition text-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-pulse">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto flex items-center"><X className="w-4 h-4" /></button>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600 text-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {filteredFacilitators.map(facilitator => (
                    <div key={facilitator._id} className="card-acetel p-6 flex flex-col md:flex-row gap-8">
                        {/* Facilitator Info */}
                        <div className="md:w-1/3">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-acetel-navy text-white rounded-2xl flex items-center justify-center font-bold text-xl uppercase shadow-md">
                                    {facilitator.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-acetel-navy text-lg">{facilitator.name}</h3>
                                    <p className="text-xs text-slate-400 font-medium">@{facilitator.username}</p>
                                    <p className="text-xs text-slate-500 lowercase">{facilitator.email}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                    Assigned Labs ({facilitator.enrolledLabs.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {facilitator.enrolledLabs.length > 0 ? (
                                        facilitator.enrolledLabs.map(labId => {
                                            const lab = labs.find(l => l._id === labId);
                                            return (
                                                <div key={labId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition hover:border-red-200 group">
                                                    <span className="text-xs font-semibold text-acetel-navy">
                                                        {lab?.name || 'Unknown Lab'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveLab(facilitator._id, labId)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Remove assignment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No labs assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lab Selection Section */}
                        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-6 md:pt-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <BookOpen className="w-3 h-3" />
                                Assign New Lab
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {labs.length === 0 ? (
                                    <div className="col-span-full py-4 px-3 text-center border border-slate-100 rounded-xl bg-slate-50">
                                        <p className="text-xs text-slate-500">No lab catalogue is configured for this server build. Use <strong>Dashboard → Facilitators</strong> for course assignments and workload.</p>
                                    </div>
                                ) : (
                                    <>
                                        {labs
                                            .filter(lab => !facilitator.enrolledLabs.includes(lab._id))
                                            .map(lab => (
                                                <button
                                                    key={lab._id}
                                                    type="button"
                                                    onClick={() => handleAssignLab(facilitator._id, lab._id)}
                                                    className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:border-acetel-green hover:shadow-md transition group text-left"
                                                >
                                                    <div className="flex items-center justify-between w-full mb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lab.type}</span>
                                                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-acetel-green transition-colors" />
                                                    </div>
                                                    <span className="text-xs font-bold text-acetel-navy group-hover:text-acetel-green transition-colors line-clamp-1">{lab.name}</span>
                                                </button>
                                            ))}
                                        {labs.filter(lab => !facilitator.enrolledLabs.includes(lab._id)).length === 0 && (
                                            <div className="col-span-full py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                                <p className="text-xs text-slate-400 italic">All available labs already assigned</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredFacilitators.length === 0 && (
                    <div className="card-acetel p-12 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No facilitators found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageFacilitators;
