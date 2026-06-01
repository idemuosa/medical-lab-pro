'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, CheckCircle, RefreshCw, Plus } from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  min_stock_level: number;
  status: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/billing/inventory/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="text-orange-500" /> Lab Inventory & Reagents
        </h2>
        <button
          onClick={fetchInventory}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-xs text-red-600 font-bold uppercase">Critical Low</p>
          <p className="text-2xl font-bold text-red-900">
            {items.filter(i => i.quantity <= i.min_stock_level).length} Items
          </p>
        </div>
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
          <p className="text-xs text-green-600 font-bold uppercase">Healthy Stock</p>
          <p className="text-2xl font-bold text-green-900">
            {items.filter(i => i.quantity > i.min_stock_level).length} Items
          </p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
           <button className="flex items-center gap-2 text-blue-600 font-bold text-sm">
             <Plus size={18} /> Add New Supply
           </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-400">
              <th className="pb-3 font-medium">Reagent Name</th>
              <th className="pb-3 font-medium">Quantity</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Min Level</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="py-4 font-medium">{item.name}</td>
                <td className="py-4 font-mono">{item.quantity} {item.unit}</td>
                <td className="py-4">
                  {item.quantity <= item.min_stock_level ? (
                    <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-[10px] w-fit">
                      <AlertTriangle size={12} /> LOW STOCK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-[10px] w-fit">
                      <CheckCircle size={12} /> OK
                    </span>
                  )}
                </td>
                <td className="py-4 text-right text-gray-500">{item.min_stock_level} {item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
