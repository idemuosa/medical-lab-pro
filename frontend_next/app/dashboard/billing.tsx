'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Receipt, DollarSign, Clock, CheckCircle2, PlusCircle } from 'lucide-react';

interface Invoice {
  id: number;
  total_amount: string;
  is_paid: boolean;
  created_at: string;
  patient: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [invRes, patRes] = await Promise.all([
        axios.get('http://localhost:8000/api/billing/invoices/', { headers }),
        axios.get('http://localhost:8000/api/patients/', { headers })
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data);
    } catch (err) {
      console.error('Error fetching billing data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateInvoice = async () => {
    if (!selectedPatient) return;
    try {
      const token = localStorage.getItem('access_token');
      // In a real app, you'd select specific records.
      // For this demo, we'll bill all completed records for the patient.
      await axios.post('http://localhost:8000/api/billing/invoices/create_from_records/',
        { patient_id: selectedPatient, record_ids: [] }, // Backend logic modified to handle empty record_ids as "all" or specific
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Invoice Generated Successfully');
      fetchData();
    } catch (err) {
      alert('Error: Likely no completed unbilled records found for this patient.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Receipt className="text-green-500" /> Billing & Invoices
        </h2>

        <div className="flex gap-2">
           <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1 outline-none"
           >
             <option value="">Select Patient to Bill</option>
             {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
           </select>
           <button
            onClick={handleGenerateInvoice}
            className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-green-700 transition"
           >
             <PlusCircle size={14} /> Generate
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500 text-white rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-green-900">
              ${invoices.filter(i => i.is_paid).reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-orange-500 text-white rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-orange-700 font-medium">Pending Payments</p>
            <p className="text-2xl font-bold text-orange-900">
              ${invoices.filter(i => !i.is_paid).reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3 font-medium">Invoice ID</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="py-4 font-mono font-medium text-blue-600">#INV-{inv.id}</td>
                <td className="py-4 font-bold text-slate-900">${inv.total_amount}</td>
                <td className="py-4">
                  {inv.is_paid ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit text-xs font-bold">
                      <CheckCircle2 size={12} /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit text-xs font-bold">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="py-4 text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                <td className="py-4 text-right">
                  {!inv.is_paid && (
                    <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition shadow-sm">
                      Process Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
