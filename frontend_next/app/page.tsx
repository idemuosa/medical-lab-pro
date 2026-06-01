import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-slate-50">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-4">Medical Lab Pro</h1>
      <p className="mb-8 text-xl text-gray-600 max-w-md text-center">
        Modern EHR & Laboratory Management System with Real-time Synchronization.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-blue-700 transition"
        >
          Open Dashboard
        </Link>
        <button className="bg-white text-blue-900 border-2 border-blue-900 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition">
          View Documentation
        </button>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center opacity-70">
        <div><p className="font-bold">PostgreSQL</p><p className="text-xs">Secure DB</p></div>
        <div><p className="font-bold">Redis</p><p className="text-xs">Cache & Socket</p></div>
        <div><p className="font-bold">Celery</p><p className="text-xs">Task Queue</p></div>
        <div><p className="font-bold">Channels</p><p className="text-xs">Real-time</p></div>
      </div>
    </div>
  );
}
