'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import { ArrowLeft, User, FileText, Calendar, Phone, Clock, CheckCircle, XCircle, AlertCircle, Activity, Loader2 } from 'lucide-react';

export default function PatientHistoryRecords() {
  const { id } = useParams();
  const router = useRouter();
  const { token, API_BASE_URL, user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!id) return;

    const fetchPatient = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 404) throw new Error('Patient record not found.');
          throw new Error('Failed to load patient data.');
        }
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, token, user]);

  const statusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle className="h-4 w-4 text-teal-500" />;
    if (status === 'CANCELLED') return <XCircle className="h-4 w-4 text-rose-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  const statusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
    if (status === 'CANCELLED') return 'bg-rose-500/10 text-rose-500';
    return 'bg-amber-500/10 text-amber-500';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
            <p className="mt-4 text-sm font-semibold text-slate-400">Loading patient records...</p>
          </div>
        )}

        {error && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold text-sm">{error}</span>
          </div>
        )}

        {!loading && patient && (
          <>
            <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{patient.name}</h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Patient Diagnostic History Records</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      {patient.age} years · {patient.gender}
                    </span>
                    {patient.phoneNumber && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {patient.phoneNumber}
                      </span>
                    )}
                    {patient.email && <span>{patient.email}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-teal-600" />
                Clinical Background
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                {patient.medicalHistory ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-6 whitespace-pre-wrap">{patient.medicalHistory}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No medical history on record for this patient.</p>
                )}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-teal-600" />
                Appointment History
                <span className="ml-auto text-xs font-semibold text-slate-400">{patient.appointments?.length ?? 0} record(s)</span>
              </h2>

              {!patient.appointments || patient.appointments.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="mt-3 text-sm text-slate-400 font-semibold">No appointments found for this patient.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...patient.appointments]
                    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
                    .map((appt) => (
                      <div key={appt.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {statusIcon(appt.status)}
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{appt.reason || 'No reason specified'}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                              {new Date(appt.appointmentDate).toLocaleDateString('en-GB', {
                                weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded text-xs font-extrabold tracking-wide uppercase ${statusClass(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
