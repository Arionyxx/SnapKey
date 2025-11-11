import { ReactNode } from 'react';
import { StatusBar } from './StatusBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-base-100">
      {/* Header */}
      <header className="navbar bg-base-200 shadow-lg">
        <div className="flex-1">
          <span className="text-xl font-bold">🎮 SnapKey</span>
          <span className="ml-3 text-sm opacity-60">v2.0</span>
        </div>
        <div className="flex-none">
          <StatusBar />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
