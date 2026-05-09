import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, FileText, Table, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '../lib/exportService';

interface ExportButtonProps {
    fileName: string;
    title: string;
    headers: string[][];
    data: any[][];
    variant?: 'primary' | 'secondary' | 'outline';
}

const ExportButton = ({ fileName, title, headers, data, variant = 'outline' }: ExportButtonProps) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const logoUrl = (import.meta as any).env?.VITE_LOGO_URL || '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async (format: 'pdf' | 'xlsx' | 'csv') => {
        const config = { 
            fileName, 
            title, 
            headers, 
            data, 
            adminName: user?.name || 'System Administrator',
            logoUrl
        };
        if (format === 'pdf') await exportToPDF(config);
        else if (format === 'xlsx') exportToExcel(config);
        else if (format === 'csv') exportToCSV(config);
        setIsOpen(false);
    };

    const getBtnStyles = () => {
        const base = "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm hover:shadow-md active:scale-95";
        switch (variant) {
            case 'primary': return `${base} bg-[#3B6D11] text-white hover:bg-[#4d8a16]`;
            case 'secondary': return `${base} bg-[#C0DD97] text-[#3B6D11] hover:bg-[#afcf85]`;
            case 'outline': return `${base} bg-white border-2 border-[#C0DD97] text-[#3B6D11] hover:border-[#3B6D11]`;
            default: return base;
        }
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={getBtnStyles()}
            >
                <Download size={18} />
                <span>Export</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#C0DD97] rounded-xl shadow-xl z-[100] py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#F5FAF2] hover:text-[#3B6D11] transition-colors"
                    >
                        <FileText size={16} className="text-red-500" />
                        Professional PDF
                    </button>
                    <button
                        onClick={() => handleExport('xlsx')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#F5FAF2] hover:text-[#3B6D11] transition-colors"
                    >
                        <FileSpreadsheet size={16} className="text-green-600" />
                        Excel (XLSX)
                    </button>
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#F5FAF2] hover:text-[#3B6D11] transition-colors"
                    >
                        <Table size={16} className="text-blue-600" />
                        CSV Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
