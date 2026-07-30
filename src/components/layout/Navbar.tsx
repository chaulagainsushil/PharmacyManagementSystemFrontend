'use client';

import { Menu, Bell } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
