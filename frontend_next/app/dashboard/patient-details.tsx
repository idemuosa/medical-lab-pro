'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Phone, Mail, Calendar, History, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface PatientDetailsProps {
  patientId: string;
  onClose: () => void;
}

export default function PatientDetails({ patientId, onClose }: PatientDetailsProps) {
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [pRes, rRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/patients/${patientId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8000/api/records/?patient=${patientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setPatient(pRes.data);
        setRecords(rRes.data);
      } catch (err) {
        toast.error('Failed to load patient history');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{patient.first_name} {patient.last_name}</h2>
              <p className="text-sm text-gray-500 font-mono">ID: {patient.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar: Patient Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" /> {patient.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" /> {patient.phone_number}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={16} className="text-gray-400" /> Born {patient.date_of_birth}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Medical Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-blue-400 uppercase">Blood Group</p>
                  <p className="font-bold text-blue-900">{patient.blood_group || 'Not Set'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 uppercase">Gender</p>
                  <p className="font-bold text-blue-900">{patient.gender}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content: History */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-purple-500" /> Laboratory History
              </h3>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{records.length} Tests Total</span>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 text-sm">No medical records found for this patient.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="p-4 border rounded-xl hover:border-blue-200 transition group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-900">{record.test_name}</p>
                        <p className="text-xs text-gray-500">{new Date(record.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${record.is_abnormal ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {record.is_abnormal ? 'Abnormal' : 'Normal'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <p className="text-gray-700">Result: <span className="font-mono font-bold">{record.result_value} {record.test_unit}</span></p>
                      <p className="text-gray-400 text-xs italic">Range: {record.test_range}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
