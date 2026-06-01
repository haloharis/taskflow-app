'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6">
          <span className="text-5xl font-bold text-white tracking-tight">
            Task<span className="text-purple-500">Flow</span>
          </span>
        </div>
        <p className="text-slate-400 text-lg mb-10">
          Manage projects and tasks with your team
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
