import React from "react";
import { Bell, User, Search } from "lucide-react";

export default function Header({ title }) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-8 flex justify-between items-center z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 transition-all"
            placeholder="Search..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
