import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navIcon = (d) => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export default function Layout() {
  const loc = useLocation();
  const [isCommissionOpen, setIsCommissionOpen] = useState(true);
  const isActive = (path) => loc.pathname === path;
  const isDataTable = loc.pathname === '/data-table';
  const isCheckStatus = loc.pathname === '/check-status';

  return (
    <div className="bg-gray-50 min-h-screen flex">
      <aside className="w-64 bg-gray-200 flex flex-col h-screen">
        <div className="p-4 bg-white border-b border-gray-300">
          <h1 className="text-lg font-bold text-gray-800">EAKSAHA GROUP</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="mb-1">
            <button
              type="button"
              onClick={() => setIsCommissionOpen(!isCommissionOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                {navIcon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
                <span>คิดค่าคอมศูนย์</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isCommissionOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isCommissionOpen && (
              <div className="pl-4 pt-1 space-y-0.5">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${isActive('/') ? 'text-white bg-orange-400' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                  {navIcon('M12 4v16m8-8H4')}
                  สร้าง
                </Link>
                <Link
                  to="/data-table"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${isDataTable ? 'text-white bg-orange-400' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                  {navIcon('M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z')}
                  ตารางข้อมูล
                </Link>
                <Link
                  to="/check-status"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${isCheckStatus ? 'text-white bg-orange-400' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                  {navIcon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4')}
                  คำนวณค่าคอมมิชชัน
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>
      <main className="flex-1 bg-white overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
