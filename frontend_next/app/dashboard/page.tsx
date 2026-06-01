'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Activity, Bell, PlusCircle, Database, RefreshCw, Lock, FileText, Receipt, ShieldCheck, TrendingUp, Microscope, BarChart3, Package } from 'lucide-react';
import { useAuth } from '../auth-provider';
import { useRouter } from 'next/navigation';
import LabResults from './lab-results';
import Billing from './billing';
import Inventory from './inventory';
import Analytics from './analytics';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface LabTest {
  id: number;
  name: string;
  unit: string;
}

interface AuditLog {
  id: number;
  username: string;
  action: string;
  resource_type: string;
  timestamp: string;
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'patients' | 'results' | 'billing' | 'inventory' | 'analytics' | 'audit'>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '1990-01-01',
    gender: 'Other',
    address: 'Default Address'
  });

  const [resultData, setResultData] = useState({
    patient: '',
    test: '',
    result_value: '',
    status: 'Completed',
    doctor_notes: ''
  });

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/patients/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setPatients(res.data);
    } catch (err) {
      console.error('Error fetching patients', err);
    }
  };

  const fetchLabTests = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/tests/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLabTests(res.data);
    } catch (err) {
      console.error('Error fetching tests', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/audit-logs/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Error fetching audits', err);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      Promise.all([
        fetchPatients(),
        fetchLabTests(),
        user.role === 'ADMIN' ? fetchAuditLogs() : Promise.resolve(),
      ]).finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResultChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setResultData({ ...resultData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8000/api/patients/', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      fetchPatients();
      setFormData({ ...formData, first_name: '', last_name: '', email: '', phone_number: '' });
    } catch (err) {
      console.error('Sync failed', err);
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8000/api/records/', resultData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Result Recorded', {
        description: 'Inventory has been automatically updated.'
      });
      setResultData({ patient: '', test: '', result_value: '', status: 'Completed', doctor_notes: '' });
    } catch (err) {
      toast.error('Error submitting result');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading) return <div className="p-8 text-center">Checking credentials...</div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-sm">
        <Lock className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">You must be logged in to view the dashboard.</p>
        <a href="/login" className="block bg-blue-600 text-white py-2 rounded-lg font-medium">Go to Login</a>
      </div>
    </div>
  );

  const canRegister = ['ADMIN', 'RECEPTIONIST'].includes(user.role);
  const isLabTech = user.role === 'LAB_TECH' || user.role === 'ADMIN';
  const isAdmin = user.role === 'ADMIN';

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone_number?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Activity className="text-blue-600" />
              Medical Lab Pro
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user.role} Dashboard
              </span>
              <span className="text-xs text-gray-500 ml-1">Logged in as {user.username}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 font-medium hover:bg-red-50 px-3 py-2 rounded-lg transition"
            >
              Logout
            </button>
            <button
              onClick={fetchPatients}
              className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm"
            >
              <RefreshCw size={16} /> Sync Data
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-8 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('patients')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'patients' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Patients Registry
            {activeTab === 'patients' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'results' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Test Results
            {activeTab === 'results' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'billing' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Billing & Invoices
            {activeTab === 'billing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
          {isLabTech && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Inventory
              {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Analytics
              {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'audit' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Audit Log
              {activeTab === 'audit' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'patients' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="text-blue-500" /> Patient Registry
                  </h2>
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  </div>
                </div>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-gray-400">
                          <th className="pb-3 font-medium">Name</th>
                          <th className="pb-3 font-medium">Contact</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredPatients.map((p) => (
                          <tr key={p.id} className="hover:bg-blue-50/20 transition">
                            <td className="py-4 font-medium">{p.first_name} {p.last_name}</td>
                            <td className="py-4 text-gray-600">{p.email}</td>
                            <td className="py-4">
                              <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && <LabResults />}
            {activeTab === 'billing' && <Billing />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'analytics' && <Analytics />}

            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                 <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-red-500" /> Security Audit Log
                </h2>
                <div className="space-y-4">
                  {auditLogs.length > 0 ? auditLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between border-b pb-2 text-sm">
                      <div>
                        <span className="font-bold text-blue-900">{log.username}</span>
                        <span className="mx-2 text-gray-400">performed</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{log.action}</span>
                        <span className="ml-2 text-gray-500">on {log.resource_type}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  )) : <p className="text-gray-400 text-center py-8">No audit logs found.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {canRegister && activeTab === 'patients' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PlusCircle className="text-green-500" size={20} /> Quick Register
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text" name="first_name" placeholder="First Name" required
                    value={formData.first_name} onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text" name="last_name" placeholder="Last Name" required
                    value={formData.last_name} onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="email" name="email" placeholder="Email" required
                    value={formData.email} onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Add Patient
                  </button>
                </form>
              </div>
            )}

            {isLabTech && activeTab === 'results' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Microscope className="text-purple-500" size={20} /> Record Lab Result
                </h2>
                <form onSubmit={handleResultSubmit} className="space-y-4">
                  <select
                    name="patient" required value={resultData.patient} onChange={handleResultChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select>
                  <select
                    name="test" required value={resultData.test} onChange={handleResultChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none"
                  >
                    <option value="">Select Test Type</option>
                    {labTests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
                  </select>
                  <input
                    type="number" step="0.01" name="result_value" placeholder="Result Value" required
                    value={resultData.result_value} onChange={handleResultChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none"
                  />
                  <input
                    type="text" name="doctor_notes" placeholder="Notes (optional)"
                    value={resultData.doctor_notes} onChange={handleResultChange}
                    className="w-full border px-3 py-2 rounded-lg text-sm outline-none"
                  />
                  <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition">
                    Submit Result
                  </button>
                </form>
              </div>
            )}

            {isAdmin && (
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-400">
                  <Database size={20} /> System Health
                </h2>
                <div className="space-y-3 text-xs opacity-80 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Database (PG)</span>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>UP</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cache (Redis)</span>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>UP</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Workers (Celery)</span>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><span>UP</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
