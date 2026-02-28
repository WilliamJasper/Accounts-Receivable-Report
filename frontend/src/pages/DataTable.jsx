import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getClaimReport } from '../api';

export default function DataTable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Detail View State
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailSearch, setDetailSearch] = useState('');

  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
    setReports(savedReports);
    setLoading(false);

    savedReports.forEach(report => {
      fetchCount(report);
    });

    // Check URL params if redirected with start/end
    const start = searchParams.get('startRegDate');
    const end = searchParams.get('endRegDate');
    if (start && end) {
      const found = savedReports.find(r => r.start === start && r.end === end);
      if (found) handleView(found);
    }
  }, [searchParams]);

  const fetchCount = async (report) => {
    try {
      // ใช้ getClaimReport กรองตามวันที่เพื่อหาจำนวนรวม
      const res = await getClaimReport({
        startDate: report.start,
        endDate: report.end
      });
      setCounts(prev => ({ ...prev, [report.id]: res.total_rows || 0 }));
    } catch (err) {
      console.error('Failed to fetch count', err);
    }
  };

  const handleView = (report) => {
    // นำทางไปยังหน้าคำนวณค่าคอมมิชชันพร้อมแนบพารามิเตอร์วันที่
    navigate(`/check-status?startDate=${report.start}&endDate=${report.end}`);

    // Mark as viewed in background
    const updated = reports.map(r =>
      r.id === report.id ? { ...r, isNew: false } : r
    );
    localStorage.setItem('generatedReports', JSON.stringify(updated));
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      const updated = reports.filter(r => r.id !== id);
      setReports(updated);
      localStorage.setItem('generatedReports', JSON.stringify(updated));
      if (selectedReport?.id === id) setDetailData(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) return dateStr;
    }
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (detailData && selectedReport) {
    const requestedCols = [
      "รหัสงาน", "เลขที่ใบกำกับ", "วันที่", "ชื่อลูกค้า", "รุ่น", "เลขตัวถัง",
      "ค่าแรง", "ต้นทุนค่าแรง", "กำไรค่าแรง", "ค่าอะไหล่", "ต้นทุนอะไหล่", "กำไรอะไหล่",
      "ค่าน้ำมัน", "ต้นทุนน้ำมัน", "กำไรน้ำมัน", "งานนอก", "ต้นทุนงานนอก", "กำไรงานนอก",
      "งานสี", "ต้นทุนงานสี", "กำไรงานสี", "ยอดรวม", "ต้นทุนรวม", "กำไรรวม",
      "มูลค่าก่อนVAT", "ภาษี", "ยอดรวมภาษี"
    ];

    const displayToName = {};
    detailData.columns.forEach(c => { displayToName[c.display] = c.name; });

    const formatNum = (v) => {
      if (v == null || v === '') return '-';
      const n = parseFloat(String(v).replace(/,/g, ''));
      return isNaN(n) ? String(v) : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="border-l-4 border-orange-500 pl-4">
            <h1 className="text-2xl font-semibold text-gray-800">ระบบคำนวณค่าคอมมิชชัน</h1>
            <p className="text-gray-600 text-sm mt-1">
              ดึงข้อมูลจาก OMODA — รวม {detailData.data.length.toLocaleString()} แถว
            </p>
          </div>
          <button
            onClick={() => { setDetailData(null); navigate('/data-table'); }}
            className="bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>
        </div>

        {/* Tab Bar (Only Claim Report as requested) */}
        <div className="flex border-b border-gray-200 mb-6 font-medium text-sm">
          <button className="px-5 py-3 border-b-2 text-orange-500 border-orange-500">
            Claim Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">รวมทั้งหมด</p>
              <p className="text-lg font-semibold text-gray-800">{detailData.data.length.toLocaleString()} แถว</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">ข้อมูล</p>
              <p className="text-base font-medium text-gray-800 font-bold">จาก OMODA</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">แหล่งข้อมูล</p>
              <p className="text-base font-medium text-gray-800 font-bold">OMODA</p>
            </div>
          </div>
        </div>

        {/* Filter Info Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex items-center gap-4 flex-wrap">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm">
            ข้อมูลที่โหลดแล้ว
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <span>วันที่เริ่มต้น:</span>
            <span className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{formatDate(selectedReport.start)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <span>วันที่สิ้นสุด:</span>
            <span className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{formatDate(selectedReport.end)}</span>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ค้นหาข้อมูลในตาราง (เช่น เลขตัวถัง, ชื่อลูกค้า, รหัสงาน)..."
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="font-bold text-slate-800">Claim Report (OMODA)</span>
            <span className="text-sm text-gray-500 font-medium">{detailData.data.length.toLocaleString()} แถว</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 border-r border-slate-700 font-semibold sticky left-0 bg-slate-800 z-10 text-center">ลำดับ</th>
                  {requestedCols.map((colDisplay, idx) => (
                    <th key={idx} className="px-3 py-2.5 border-r border-slate-700 font-semibold whitespace-nowrap text-center align-middle">
                      {colDisplay}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  if (detailData.data.length === 0) {
                    return (
                      <tr>
                        <td colSpan={requestedCols.length + 1} className="px-6 py-20 text-center text-gray-400 font-medium">
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    );
                  }

                  const filteredRows = detailData.data.filter(row => {
                    if (!detailSearch.trim()) return true;
                    const searchLower = detailSearch.toLowerCase().trim();
                    return Object.values(row).some(val =>
                      val != null && String(val).toLowerCase().includes(searchLower)
                    );
                  });

                  if (filteredRows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={requestedCols.length + 1} className="px-6 py-20 text-center text-gray-400 font-medium">
                          ไม่พบข้อมูลที่ค้นหา
                        </td>
                      </tr>
                    );
                  }

                  return filteredRows.map((row, idx) => (
                    <tr key={idx} className="group hover:bg-orange-50 transition-colors even:bg-white odd:bg-gray-50/30">
                      <td className="px-3 py-2 border-r border-gray-100 text-center text-gray-400 sticky left-0 z-10 font-medium bg-white group-odd:bg-[#f9fafb] group-hover:bg-orange-50 transition-colors">
                        {(detailData.data.indexOf(row) + 1).toLocaleString()}
                      </td>
                      {requestedCols.map((colDisplay, cIdx) => {
                        const colName = displayToName[colDisplay];
                        let val = colName ? row[colName] : '-';

                        // Numeric key check
                        const isNumeric = colDisplay.includes('ค่า') || colDisplay.includes('รวม') || colDisplay.includes('กำไร') || colDisplay.includes('ภาษี') || colDisplay.includes('ต้นทุน');

                        if (typeof val === 'number' && colDisplay !== 'รหัสงาน') {
                          val = formatNum(val);
                        } else if (colDisplay === 'วันที่' && val && val !== '-') {
                          val = formatDate(val.split('T')[0]);
                        }

                        return (
                          <td key={cIdx} className={`px-3 py-2 border-r border-gray-100 whitespace-nowrap align-middle ${isNumeric ? 'text-right font-mono' : 'text-center'}`}>
                            {val ?? '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
            สิ้นสุดข้อมูลรายละเอียด
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-8 mx-auto">
      <div className="border-l-4 border-orange-500 pl-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">คิดค่าคอมศูนย์ - ตารางข้อมูล</h2>
        <p className="text-gray-500 text-sm">
          รายการกรองข้อมูลที่บันทึกไว้จากการตั้งค่าในเมนู{' '}
          <Link to="/" className="text-orange-600 hover:underline font-medium">สร้าง</Link>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden border-t-4 border-t-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-gray-200">ข้อมูลรายการ</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-gray-200 text-center">ช่วงวันที่</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-gray-200 text-center">เวลาที่สร้าง</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">เครื่องมือ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(loading || detailLoading) ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm font-medium">กำลังเตรียมข้อมูล...</span>
                  </div>
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-400 bg-gray-50/50">
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-base font-medium">ไม่พบรายการที่สร้างไว้</p>
                    <p className="text-sm">กรุณาไปที่เมนู <Link to="/" className="text-orange-500 underline">สร้าง</Link> แล้วกด สร้างตาราง</p>
                  </div>
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/80 transition-all duration-200">
                  <td className="px-6 py-5 border-r border-gray-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-lg">รวม {counts[report.id] != null ? counts[report.id].toLocaleString() : '...'} รายการ</span>
                        {report.isNew && (
                          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">New</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">ID: {report.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm border-r border-gray-100 text-center font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{formatDate(report.start)}</span>
                      <span className="text-gray-300">ถึง</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{formatDate(report.end)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[11px] border-r border-gray-100 text-center font-mono text-gray-400 font-semibold">
                    {report.createdAt}
                  </td>
                  <td className="px-6 py-5 text-sm text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleView(report)}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-blue-200 active:scale-90 group"
                        title="ดูรายละเอียด"
                      >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="bg-white hover:bg-red-50 text-red-500 border border-red-100 w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm hover:shadow-red-100 active:scale-90 group"
                        title="ลบรายงาน"
                      >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {reports.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>รวม {reports.length} รายการที่ประมวลผลไว้</span>
            <button
              onClick={() => { if (window.confirm('ยืนยันหน้าการล้างประวัติคำสั่งทั้งหมด?')) { setReports([]); localStorage.removeItem('generatedReports'); } }}
              className="text-red-400 hover:text-red-600 transition-colors bg-white px-3 py-1.5 rounded-md border border-gray-100 hover:border-red-100 shadow-sm"
            >
              ลบประวัติทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
