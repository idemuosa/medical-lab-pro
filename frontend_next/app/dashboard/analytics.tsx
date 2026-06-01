'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

interface AnalyticsData {
  total_revenue: number;
  abnormal_rate: number;
  popular_tests: { test__name: string; count: number }[];
  low_stock_alerts: number;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/billing/analytics/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Error fetching analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Calculating insights...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load analytics.</div>;

  return (
    <div className="space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-green-600" />
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900">${data.total_revenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-red-600" />
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Alert</span>
          </div>
          <p className="text-sm text-gray-500">Abnormal Rate</p>
          <p className="text-2xl font-bold text-slate-900">{data.abnormal_rate}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <p className="text-sm text-gray-500">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-slate-900">{data.low_stock_alerts}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-purple-600" />
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Growing</span>
          </div>
          <p className="text-sm text-gray-500">Active Patients</p>
          <p className="text-2xl font-bold text-slate-900">842</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Tests Bar Chart Simulation */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" /> Most Frequent Tests (30d)
          </h3>
          <div className="space-y-4">
            {data.popular_tests.map((test, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{test.test__name}</span>
                  <span className="text-gray-500">{test.count} tests</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(test.count / data.popular_tests[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Efficiency */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
           <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-purple-500" /> Lab Efficiency
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Avg Turnaround</p>
                <p className="text-xl font-bold text-slate-900">4.2 hrs</p>
             </div>
             <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Pending Validation</p>
                <p className="text-xl font-bold text-slate-900">12</p>
             </div>
             <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Equipment Uptime</p>
                <p className="text-xl font-bold text-slate-900">99.8%</p>
             </div>
             <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Staff Utilization</p>
                <p className="text-xl font-bold text-slate-900">76%</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
