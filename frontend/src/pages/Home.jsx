import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();

  const months = [
    { value: '01', label: 'มกราคม' },
    { value: '02', label: 'กุมภาพันธ์' },
    { value: '03', label: 'มีนาคม' },
    { value: '04', label: 'เมษายน' },
    { value: '05', label: 'พฤษภาคม' },
    { value: '06', label: 'มิถุนายน' },
    { value: '07', label: 'กรกฎาคม' },
    { value: '08', label: 'สิงหาคม' },
    { value: '09', label: 'กันยายน' },
    { value: '10', label: 'ตุลาคม' },
    { value: '11', label: 'พฤศจิกายน' },
    { value: '12', label: 'ธันวาคม' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const handleSubmit = (e) => {
    e.preventDefault();

    // คำนวณวันแรกและวันสุดท้ายของเดือนที่เลือก
    const start = `${selectedYear}-${selectedMonth}-01`;
    const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
    const end = `${selectedYear}-${selectedMonth}-${lastDay}`;

    const monthName = months.find(m => m.value === selectedMonth)?.label;

    // บันทึกลง localStorage เพื่อไปแสดงที่หน้าตารางข้อมูล
    const newReport = {
      id: Date.now(),
      start: start,
      end: end,
      label: `ประจำเดือน ${monthName} ${parseInt(selectedYear) + 543}`,
      createdAt: new Date().toLocaleString('th-TH'),
      isNew: true
    };

    const existingReports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
    localStorage.setItem('generatedReports', JSON.stringify([newReport, ...existingReports]));

    navigate(`/data-table`);
  };

  return (
    <div className="max-w-5xl p-8">
      <div className="border-l-4 border-orange-500 pl-4 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">คิดค่าคอมศูนย์ - สร้าง</h2>
        <p className="text-gray-600 text-sm">
          เลือกเดือนและปีที่ต้องการ แล้วกด &quot;สร้างตาราง&quot; รายการจะถูกเพิ่มไปที่เมนู{' '}
          <Link to="/data-table" className="text-orange-600 hover:underline">ตารางข้อมูล</Link>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="month" className="block text-sm font-bold text-gray-700 mb-2">
                เลือกเดือน
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white cursor-pointer"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-bold text-gray-700 mb-2">
                เลือกปี (พ.ศ.)
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y.toString()}>{y + 543}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
              สร้างตาราง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
