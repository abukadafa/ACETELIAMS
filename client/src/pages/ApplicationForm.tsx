import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axiosInstance';
import { FileUp, CheckCircle, AlertCircle, Loader2, ArrowRight, User, Mail, Phone, BookOpen, GraduationCap, School } from 'lucide-react';

const applicationSchema = z.object({
  surname: z.string().min(2, 'Surname is required'),
  otherNames: z.string().min(2, 'Other names are required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  programme: z.string().min(1, 'Please select a programme'),
  gender: z.enum(['Male', 'Female', 'Other']),
  nationality: z.string().min(1, 'Nationality is required'),
  academicBackground: z.string().min(10, 'Please provide more details about your academic background'),
  degreeHeld: z.string().min(2, 'Last degree obtained is required'),
  cgpa: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 5.0, 'CGPA must be between 0 and 5.0'),
});

type ApplicationData = z.infer<typeof applicationSchema>;

const ApplicationForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    certificate: null,
    transcript: null,
    idProof: null,
  });
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appRef, setAppRef] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      programme: 'MSc Computer Science',
      gender: 'Male',
      nationality: 'Nigeria'
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} exceeds the 10MB limit.`);
        return;
      }
      setFiles({ ...files, [key]: file });
      setError(null);
    }
  };

  const uploadFile = async (file: File, key: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response: any = await api.post(`/applications/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(prev => ({ ...prev, [key]: percentCompleted }));
        }
      });
      
      return response.key; // The relative storage path returned from server
    } catch (err: any) {
      console.error(`Error uploading ${key}:`, err);
      throw new Error(err.message || `Failed to upload ${key}`);
    }
  };

  const onSubmit = async (data: ApplicationData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!files.certificate) {
        throw new Error('Degree Certificate is mandatory for postgraduate application.');
      }

      const uploadPromises = [];
      const keys = ['certificate', 'transcript', 'idProof'];
      const documents: any = {};

      for (const key of keys) {
        if (files[key]) {
          uploadPromises.push(
            uploadFile(files[key]!, key).then(storageKey => {
              documents[key] = storageKey;
            })
          );
        }
      }

      await Promise.all(uploadPromises);

      const response: any = await api.post('/applications', {
        ...data,
        name: `${data.surname} ${data.otherNames}`,
        documents,
        status: 'pending',
        appliedDate: new Date(),
      });

      setAppRef(response._id.slice(-8).toUpperCase());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-[#1e293b] mb-4">Application Received!</h2>
          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Reference Number</p>
            <p className="text-2xl font-black text-[#3B6D11]">{appRef}</p>
          </div>
          <p className="text-[#64748b] font-medium mb-8 leading-relaxed">
            Thank you for applying to ACETEL. Your application is now in the review queue. You will be notified via email of our admission decision.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#3B6D11] text-white py-4 rounded-2xl font-bold hover:bg-[#639922] transition-all shadow-lg active:scale-95"
          >
            RETURN TO PORTAL HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          <img src="https://acetel.nou.edu.ng/wp-content/uploads/2022/12/logo.png" alt="ACETEL" className="h-16" />
          <div className="hidden md:block h-12 w-px bg-slate-200" />
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-[#1e293b] leading-none uppercase tracking-tight">Postgraduate Application</h1>
            <p className="text-sm font-bold text-[#3B6D11] mt-1 tracking-widest uppercase">ACETEL Integrated Management System</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="flex h-3 bg-slate-100">
            <div 
              className="bg-[#3B6D11] transition-all duration-700 ease-out" 
              style={{ width: `${(step / 2) * 100}%` }} 
            />
          </div>

          <div className="p-8 md:p-14">
            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-[#3B6D11] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-green-100">1</div>
                    <h2 className="text-2xl font-black text-[#1e293b]">Candidate Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <User size={12} /> Surname
                      </label>
                      <input 
                        {...register('surname')}
                        className={`w-full bg-slate-50 border-2 ${errors.surname ? 'border-red-200' : 'border-slate-100'} rounded-2xl px-6 py-4 outline-none focus:border-[#3B6D11] focus:bg-white transition-all font-semibold`}
                        placeholder="Last Name"
                      />
                      {errors.surname && <p className="text-red-500 text-[10px] font-bold italic ml-2">{errors.surname.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <User size={12} /> Other Names
                      </label>
                      <input 
                        {...register('otherNames')}
                        className={`w-full bg-slate-50 border-2 ${errors.otherNames ? 'border-red-200' : 'border-slate-100'} rounded-2xl px-6 py-4 outline-none focus:border-[#3B6D11] focus:bg-white transition-all font-semibold`}
                        placeholder="First and Middle Names"
                      />
                      {errors.otherNames && <p className="text-red-500 text-[10px] font-bold italic ml-2">{errors.otherNames.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Mail size={12} /> Email Address
                      </label>
                      <input 
                        {...register('email')}
                        className={`w-full bg-slate-50 border-2 ${errors.email ? 'border-red-200' : 'border-slate-100'} rounded-2xl px-6 py-4 outline-none focus:border-[#3B6D11] focus:bg-white transition-all font-semibold`}
                        placeholder="email@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-[10px] font-bold italic ml-2">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Phone size={12} /> Mobile Number
                      </label>
                      <input 
                        {...register('phone')}
                        className={`w-full bg-slate-50 border-2 ${errors.phone ? 'border-red-200' : 'border-slate-100'} rounded-2xl px-6 py-4 outline-none focus:border-[#3B6D11] focus:bg-white transition-all font-semibold`}
                        placeholder="+234 ..."
                      />
                      {errors.phone && <p className="text-red-500 text-[10px] font-bold italic ml-2">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <BookOpen size={12} /> Target Programme
                      </label>
                      <select 
                        {...register('programme')}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-[#3B6D11] focus:bg-white transition-all appearance-none cursor-pointer font-semibold"
                      >
                        <option>MSc Educational Technology</option>
                        <option>MSc Computer Science</option>
                        <option>MSc Information Systems</option>
                        <option>PhD Educational Technology</option>
                        <option>PhD Computer Science</option>
                        <option>PhD Information Systems</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                        <select {...register('gender')} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 font-semibold">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nationality</label>
                        <input {...register('nationality')} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 font-semibold" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="bg-[#1e293b] text-white px-12 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-[#0f172a] transition-all shadow-xl active:scale-95"
                    >
                      CONTINUE TO ACADEMICS <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-[#3B6D11] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-green-100">2</div>
                    <h2 className="text-2xl font-black text-[#1e293b]">Academic Background & Documents</h2>
                  </div>

                  {error && (
                    <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-4 text-red-600 text-sm font-bold">
                      <AlertCircle size={24} /> {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                         <School size={12} /> Last Institution Attended
                      </label>
                      <input 
                        {...register('academicBackground')}
                        className={`w-full bg-slate-50 border-2 ${errors.academicBackground ? 'border-red-200' : 'border-slate-100'} rounded-2xl px-6 py-4 outline-none focus:border-[#3B6D11] focus:bg-white transition-all font-semibold`}
                        placeholder="Name of University/College"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree & CGPA</label>
                      <div className="flex gap-2">
                        <input {...register('degreeHeld')} className="w-2/3 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 font-semibold" placeholder="BSc/MSc" />
                        <input {...register('cgpa')} className="w-1/3 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 font-semibold text-center" placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      { key: 'certificate', label: 'Degree Certificate', icon: <GraduationCap size={28} />, req: true },
                      { key: 'transcript', label: 'Academic Transcript', icon: <BookOpen size={28} />, req: false },
                      { key: 'idProof', label: 'ID Document', icon: <User size={28} />, req: false },
                    ].map((doc) => (
                      <div key={doc.key} className="bg-slate-50/50 p-6 rounded-3xl border-2 border-dashed border-slate-200 group hover:border-[#3B6D11] hover:bg-white transition-all duration-300">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#3B6D11] shadow-sm group-hover:scale-110 transition-transform">
                            {doc.icon}
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="font-black text-[#1e293b] uppercase text-xs tracking-widest">
                              {doc.label} {doc.req && <span className="text-red-500">*</span>}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                              {files[doc.key] ? files[doc.key]!.name : 'PDF / JPG / PNG (Max 10MB)'}
                            </p>
                            {uploadProgress[doc.key] !== undefined && (
                              <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#3B6D11] transition-all" style={{ width: `${uploadProgress[doc.key]}%` }} />
                              </div>
                            )}
                          </div>
                          <label className="cursor-pointer">
                            <div className="bg-[#3B6D11] text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-[#639922] transition-all shadow-lg active:scale-95">
                              {files[doc.key] ? 'CHANGE' : 'SELECT'}
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleFileChange(e, doc.key)}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-14 flex flex-col sm:flex-row gap-6 justify-between items-center">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="text-slate-400 font-black text-sm uppercase tracking-widest hover:text-[#1e293b] transition-colors"
                    >
                      Back to Candidate Info
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-[#3B6D11] text-white px-16 py-6 rounded-[24px] font-black text-xl hover:bg-[#639922] transition-all shadow-2xl shadow-green-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-4"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" /> SUBMITTING...
                        </>
                      ) : (
                        'FINALIZE & SUBMIT'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <p className="text-center mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          ACETEL IAMS — Secure Institutional Admission Portal
        </p>
      </div>
    </div>
  );
};

export default ApplicationForm;
