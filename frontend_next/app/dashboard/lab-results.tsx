'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, AlertTriangle, CheckCircle, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface LabRecord {
  id: number;
  test_name: string;
  test_unit: string;
  test_range?: string;
  result_value: number;
  is_abnormal: boolean;
  status: string;
  created_at: string;
  patient: string;
  attachment?: string;
}

interface AIInsight {
  status: string;
  insight: string;
  alerts: string[];
}

export default function LabResults() {
  const [records, setRecords] = useState<LabRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<{ [id: number]: AIInsight }>({});
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/records/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err) {
      console.error('Error fetching lab records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFileUpload = async (recordId: number) => {
    if (!selectedFile) return;
    setUploadingId(recordId);
    const formData = new FormData();
    formData.append('attachment', selectedFile);

    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:8000/api/records/${recordId}/`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      alert('File Uploaded Successfully');
      fetchRecords();
      setSelectedFile(null);
    } catch (err) {
      alert('Error uploading file');
    } finally {
      setUploadingId(null);
    }
  };

  const downloadPDF = async (recordId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8000/api/records/${recordId}/download_pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Result_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Error downloading PDF', err);
    }
  };

  const handleEmailResult = async (recordId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://localhost:8000/api/records/${recordId}/send_email/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Result emailed to patient');
    } catch (err) {
      toast.error('Failed to send email');
    }
  };

  const runAiAnalysis = async (recordId: number) => {
    setAnalyzingId(recordId);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:8000/api/records/${recordId}/ai_analysis/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiInsights(prev => ({
        ...prev,
        [recordId]: res.data
      }));
      toast.success('AI Analysis Completed');
    } catch (err) {
      toast.error('AI Analysis request failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <FileText className="text-purple-500" /> Laboratory Test Results
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-500 text-sm">
              <th className="pb-3 font-medium">Test Name</th>
              <th className="pb-3 font-medium">Result</th>
              <th className="pb-3 font-medium">Ref. Range</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {records.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="hover:bg-gray-50 transition">
                  <td className="py-4 font-medium">{r.test_name}</td>
                  <td className="py-4">
                    <span className={r.is_abnormal ? 'text-red-600 font-bold' : 'text-green-600 font-medium'}>
                      {r.result_value} {r.test_unit}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400 italic text-xs">
                    {r.test_range || '--'}
                  </td>
                  <td className="py-4">
                    {r.is_abnormal ? (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit text-xs">
                        <AlertTriangle size={12} /> Abnormal
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit text-xs">
                        <CheckCircle size={12} /> Normal
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-4 text-right flex items-center justify-end gap-2">
                    {r.attachment ? (
                      <a
                          href={`http://localhost:8000${r.attachment}`}
                          target="_blank"
                          className="text-purple-600 hover:underline text-xs"
                      >
                          View Attachment
                      </a>
                    ) : (
                      <div className="flex items-center gap-1">
                          <input
                              type="file"
                              className="text-[10px] w-24"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          />
                          <button
                              onClick={() => handleFileUpload(r.id)}
                              disabled={uploadingId === r.id}
                              className="bg-gray-100 p-1 rounded hover:bg-gray-200"
                          >
                              {uploadingId === r.id ? '...' : 'UP'}
                          </button>
                      </div>
                    )}
                    <button
                      onClick={() => runAiAnalysis(r.id)}
                      disabled={analyzingId === r.id}
                      className="inline-flex items-center gap-1 text-purple-600 hover:bg-purple-50 px-2.5 py-1 rounded-md transition text-xs font-medium"
                      title="Run AI Insights"
                    >
                      <Sparkles size={13} /> {analyzingId === r.id ? 'Analyzing...' : 'AI Insights'}
                    </button>
                    <button
                      onClick={() => downloadPDF(r.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md transition"
                    >
                      <Download size={14} /> PDF
                    </button>
                    <button
                      onClick={() => handleEmailResult(r.id)}
                      className="inline-flex items-center gap-1 text-green-600 hover:bg-green-50 px-3 py-1 rounded-md transition"
                      title="Send to Patient Email"
                    >
                      <Send size={14} />
                    </button>
                  </td>
                </tr>
                {aiInsights[r.id] && (
                  <tr className="bg-purple-50/40">
                    <td colSpan={6} className="px-6 py-3 border-t border-purple-100">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-purple-900">
                          <Sparkles size={14} className="text-purple-600" />
                          <span>AI Clinical Insights:</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                            {aiInsights[r.id].status}
                          </span>
                        </div>
                        <p className="text-gray-700">{aiInsights[r.id].insight}</p>
                        {aiInsights[r.id].alerts?.length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {aiInsights[r.id].alerts.map((alert, idx) => (
                              <span key={idx} className="bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                                <AlertTriangle size={11} /> {alert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
