import React from 'react';
import { formatNum, parseV } from '../../utils/formatters';

export default function OverviewTab({ monthlySummary, monthlyTargets, cashIncomeMap, accIncomeMap, claimStartDate }) {
    if (!monthlySummary || !monthlySummary.rows) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500">
                <p>กรุณาโหลดและคำนวณข้อมูลในหน้า 'คำนวน' ก่อน</p>
            </div>
        );
    }

    const filterMonth = claimStartDate ? (parseInt(claimStartDate.split('-')[1], 10) - 1) : -1;
    const year = claimStartDate ? claimStartDate.split('-')[0] : new Date().getFullYear();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        เป้าหมายและยอดขาย {year}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border border-gray-200 p-3 bg-slate-800 text-white font-semibold text-left whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        เดือน
                                    </div>
                                </th>
                                <th className="border border-gray-200 p-3 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        เป้าหมาย
                                    </div>
                                </th>
                                <th className="border border-gray-200 p-3 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        ยอดที่ทำได้
                                    </div>
                                </th>
                                <th className="border border-gray-200 p-3 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                        คิดเป็น %
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlySummary.rows.map((r, idx) => {
                                const targetRaw = monthlyTargets[idx] ?? '';
                                const target = parseFloat(String(targetRaw).replace(/,/g, '') || '0') || 0;

                                const monthNum = String(idx + 1).padStart(2, '0');
                                const lastDay = new Date(year, idx + 1, 0).getDate();
                                const thisMonthKey = `${year}-${monthNum}-01_${year}-${monthNum}-${lastDay}`;

                                const mCash = cashIncomeMap?.[thisMonthKey] || [];
                                const mAcc = accIncomeMap?.[thisMonthKey] || [];
                                const manualSum = mCash.reduce((s, row) => s + parseV(row.labor) + parseV(row.parts), 0) +
                                    mAcc.reduce((s, row) => s + parseV(row.labor) + parseV(row.parts), 0);

                                const achieved = r.total + manualSum;
                                const percent = target > 0 ? (achieved / target) * 100 : 0;
                                const meetsTarget = target > 0 && achieved >= target;

                                const isSelected = idx === filterMonth;

                                return (
                                    <tr
                                        key={r.month}
                                        className={isSelected ? "bg-orange-50 border-2 border-orange-400" : "hover:bg-gray-50 border-b border-gray-100"}
                                    >
                                        <td className={`p-3 font-medium ${isSelected ? 'text-orange-700 font-bold' : 'text-slate-700'}`}>
                                            {r.monthName}
                                            {isSelected && (
                                                <span className="ml-2 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full uppercase">Selected</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className={`px-2 py-1.5 text-sm font-semibold rounded ${isSelected ? 'border border-orange-400 ring-1 ring-orange-200 text-orange-800 bg-white' : 'text-slate-600'}`}>
                                                {target > 0 ? formatNum(target) : '-'}
                                            </div>
                                        </td>
                                        <td className={`p-3 text-right font-bold text-lg ${isSelected ? (meetsTarget ? 'text-green-600' : 'text-blue-700') : 'text-slate-700'}`}>
                                            {formatNum(achieved)}
                                        </td>
                                        <td className={`p-3 text-right font-black text-lg ${percent >= 100 ? 'text-green-600' : percent >= 80 ? 'text-orange-600' : percent > 0 ? 'text-red-600' : 'text-slate-400 font-medium'}`}>
                                            {target > 0 ? `${formatNum(percent)} %` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
