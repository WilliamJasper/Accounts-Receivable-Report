import React from 'react';
import { formatNum, formatInputCommas, parseV } from '../../utils/formatters';
import IncomeRow from './IncomeRow';

/**
 * CalcTab — Commission Calculation tab
 */
export default function CalcTab({
    loaded, commissionCalc, monthlySummary, monthlyTargets, setMonthlyTargets,
    cashIncomeRows, accIncomeRows, addCashIncome, removeCashIncome, updateCashIncome,
    addAccIncome, removeAccIncome, updateAccIncome,
    claimStartDate, cashIncomeMap, accIncomeMap,
    officerData, officerEdits, workingDays, setWorkingDays,
    commissionNote, setCommissionNote,
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                <div className="p-2 bg-orange-500 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">คำนวณค่าคอมมิชชัน</h3>
                    <p className="text-sm text-slate-600">สรุปการคำนวณรายได้ ประเมินเป้าหมาย และระบบส่วนแบ่งอัตโนมัติ</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-100">
                <div className="overflow-x-auto p-4">
                    {/* ตารางสรุปรายได้ */}
                    <table className="w-full border-collapse border border-gray-300 shadow-sm">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="border border-gray-300 p-2 text-left w-1/4">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        รายการ
                                    </div>
                                </th>
                                <th className="border border-gray-300 p-2 text-right w-1/4">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        ค่าแรง
                                    </div>
                                </th>
                                <th className="border border-gray-300 p-2 text-right w-1/4">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        ค่าอะไหล่
                                    </div>
                                </th>
                                <th className="border border-gray-300 p-2 text-right w-1/4 uppercase">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        รวม
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loaded ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-slate-500 py-12 bg-gray-50">
                                        กรุณาเลือกเดือน/ปี และกด "โหลดข้อมูล" ก่อน
                                    </td>
                                </tr>
                            ) : commissionCalc && (() => {
                                const { omodaL, omodaP, totalL, totalP } = commissionCalc;
                                return (
                                    <>
                                        <tr className="bg-blue-50/50 font-bold">
                                            <td colSpan={4} className="border border-gray-300 p-2 text-blue-900 border-l-4 border-l-blue-500">
                                                <span>รายได้เงินสด</span>
                                            </td>
                                        </tr>
                                        {cashIncomeRows.map(r => (
                                            <IncomeRow key={r.id} {...r} onUpdate={updateCashIncome} onRemove={removeCashIncome} />
                                        ))}
                                        <IncomeRow id="omoda" label="OMODA" labor={omodaL} parts={omodaP} isAuto={true} />

                                        <tr className="bg-green-50/50 font-bold border-t border-gray-300">
                                            <td colSpan={4} className="border border-gray-300 p-2 text-green-900 border-l-4 border-l-green-500">
                                                <div className="flex justify-between items-center">
                                                    <span>อุปกรณ์ตกแต่ง</span>
                                                    <button onClick={addAccIncome} className="bg-green-600 hover:bg-green-700 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 uppercase tracking-tighter">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                        เพิ่มรายการ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {accIncomeRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="border border-gray-300 p-4 text-center text-gray-400 italic text-sm">
                                                    ยังไม่มีรายการอุปกรณ์ตกแต่ง (กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มกรอก)
                                                </td>
                                            </tr>
                                        ) : accIncomeRows.map(r => (
                                            <IncomeRow key={r.id} {...r} onUpdate={updateAccIncome} onRemove={removeAccIncome} />
                                        ))}

                                        <tr className="bg-yellow-300 font-black text-slate-900 border-t-2 border-slate-800">
                                            <td className="border border-gray-300 p-3 italic">รวมทั้งหมด (Commission Base)</td>
                                            <td className="border border-gray-300 p-3 text-right">{formatNum(totalL)}</td>
                                            <td className="border border-gray-300 p-3 text-right">{formatNum(totalP)}</td>
                                            <td className="border border-gray-300 p-3 text-right text-xl underline decoration-double">
                                                {formatNum(totalL + totalP)}
                                            </td>
                                        </tr>
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>

                    {/* ตารางเป้าหมาย */}
                    <TargetTable
                        loaded={loaded}
                        monthlySummary={monthlySummary}
                        monthlyTargets={monthlyTargets}
                        setMonthlyTargets={setMonthlyTargets}
                        claimStartDate={claimStartDate}
                        cashIncomeMap={cashIncomeMap}
                        accIncomeMap={accIncomeMap}
                    />

                    {/* ตารางคำนวนการเบิกค่าคอมมิชัน */}
                    {loaded && commissionCalc && (
                        <CommissionBreakdown
                            commissionCalc={commissionCalc}
                            officerData={officerData}
                            officerEdits={officerEdits}
                            workingDays={workingDays}
                            setWorkingDays={setWorkingDays}
                            commissionNote={commissionNote}
                            setCommissionNote={setCommissionNote}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Sub-components ---------- */

function TargetTable({ loaded, monthlySummary, monthlyTargets, setMonthlyTargets, claimStartDate, cashIncomeMap, accIncomeMap }) {
    return (
        <table className="w-full min-w-[400px] border-collapse mt-6">
            <thead>
                <tr>
                    <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            เดือน
                        </div>
                    </th>
                    <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            เป้าหมาย
                        </div>
                    </th>
                    <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ยอดที่ทำได้
                        </div>
                    </th>
                    <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                            คิดเป็น %
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                {!loaded && (
                    <tr>
                        <td colSpan={4} className="text-center text-slate-500 py-8 border border-gray-200">
                            โหลดข้อมูลจากแท็บ Claim Report ก่อน
                        </td>
                    </tr>
                )}
                {loaded && monthlySummary.rows
                    .filter((_, idx) => {
                        const filterMonth = claimStartDate ? (parseInt(claimStartDate.split('-')[1], 10) - 1) : -1;
                        return idx === filterMonth;
                    })
                    .map(() => {
                        const filterMonth = claimStartDate ? (parseInt(claimStartDate.split('-')[1], 10) - 1) : -1;
                        const idx = filterMonth;
                        const r = monthlySummary.rows[idx];
                        const targetRaw = monthlyTargets[idx] ?? '';
                        const target = parseFloat(String(targetRaw).replace(/,/g, '') || '0') || 0;
                        const year = claimStartDate ? claimStartDate.split('-')[0] : new Date().getFullYear();
                        const monthNum = String(idx + 1).padStart(2, '0');
                        const lastDay = new Date(year, idx + 1, 0).getDate();
                        const thisMonthKey = `${year}-${monthNum}-01_${year}-${monthNum}-${lastDay}`;

                        const mCash = cashIncomeMap[thisMonthKey] || [];
                        const mAcc = accIncomeMap[thisMonthKey] || [];
                        const manualSum = mCash.reduce((s, row) => s + parseV(row.labor) + parseV(row.parts), 0) +
                            mAcc.reduce((s, row) => s + parseV(row.labor) + parseV(row.parts), 0);

                        const achieved = r.total + manualSum;
                        const percent = target > 0 ? (achieved / target) * 100 : 0;
                        const meetsTarget = target > 0 && achieved >= target;

                        return (
                            <tr key={r.month} className="bg-orange-50 border-2 border-orange-400 hover:bg-orange-100 transition-colors">
                                <td className="border border-gray-200 p-3 font-bold text-orange-700">
                                    {r.monthName}
                                    <span className="ml-2 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full uppercase">Selected</span>
                                </td>
                                <td className="border border-gray-200 p-3 text-right">
                                    <input
                                        type="text"
                                        className="w-full text-right border border-orange-400 ring-1 ring-orange-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-bold text-orange-800"
                                        value={formatInputCommas(String(targetRaw))}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
                                            setMonthlyTargets((prev) => {
                                                const next = [...prev];
                                                next[idx] = raw;
                                                return next;
                                            });
                                        }}
                                        placeholder="0"
                                    />
                                </td>
                                <td className={`border border-gray-200 p-3 text-right font-black text-lg ${meetsTarget ? 'text-green-600' : 'text-blue-700'}`}>
                                    {formatNum(achieved)}
                                </td>
                                <td className={`border border-gray-200 p-3 text-right font-black text-lg ${percent >= 100 ? 'text-green-600' : percent >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
                                    {target > 0 ? `${formatNum(percent)} %` : '-'}
                                </td>
                            </tr>
                        );
                    })}
            </tbody>
        </table>
    );
}

function CommissionBreakdown({ commissionCalc, officerData, officerEdits, workingDays, setWorkingDays, commissionNote, setCommissionNote }) {
    const {
        commL100, commP100, total100, meetsTarget100,
        commL90, commP90, total90, meetsTarget90,
        commL80, commP80, total80, meetsTarget80,
        activeTier, activeTotal, totalUnitsAll, perUnit, uM, uT, resultCentral, resultTech
    } = commissionCalc;
    const totalComm = activeTotal;

    const tiers = [
        { pct: 100, laborRate: '10%', partsRate: '1%', commL: commL100, commP: commP100, total: total100, meets: meetsTarget100, color: 'green' },
        { pct: 90, laborRate: '9%', partsRate: '0.9%', commL: commL90, commP: commP90, total: total90, meets: meetsTarget90, color: 'orange' },
        { pct: 80, laborRate: '8%', partsRate: '0.8%', commL: commL80, commP: commP80, total: total80, meets: meetsTarget80, color: 'red' },
    ];

    return (
        <div className="space-y-8 mt-8">
            {/* Commission Tiers Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-left whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    รายการ
                                </div>
                            </th>
                            <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    ค่าคอมมิชัน
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map(tier => {
                            const isActive = activeTier === tier.pct;
                            const bgClass = isActive
                                ? (tier.color === 'green' ? 'bg-green-50 border-l-4 border-l-green-500' : tier.color === 'orange' ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'bg-red-50 border-l-4 border-l-red-500')
                                : 'opacity-40';
                            const textColor = isActive
                                ? (tier.color === 'green' ? 'text-green-700' : tier.color === 'orange' ? 'text-orange-700' : 'text-red-700')
                                : 'text-gray-400';

                            return (
                                <React.Fragment key={tier.pct}>
                                    <tr className={bgClass}>
                                        <td colSpan={2} className="border border-gray-200 p-2 font-bold text-sm italic">
                                            <div className="flex items-center gap-2">
                                                <span className={textColor}>
                                                    คำนวนจากกลุ่มเป้าหมาย {tier.pct}% ขึ้นไป
                                                </span>
                                                {isActive && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${tier.color === 'green' ? 'bg-green-500' : tier.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`}>
                                                        ✓ ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className={`${isActive ? 'hover:bg-gray-50' : 'opacity-40'}`}>
                                        <td className="border border-gray-200 p-2 pl-6 text-sm text-gray-700">ค่าแรง {tier.laborRate}</td>
                                        <td className={`border border-gray-200 p-2 text-right ${isActive ? 'font-semibold' : ''}`}>{formatNum(tier.commL)}</td>
                                    </tr>
                                    <tr className={`${isActive ? 'hover:bg-gray-50' : 'opacity-40'}`}>
                                        <td className="border border-gray-200 p-2 pl-6 text-sm text-gray-700">ค่าอะไหล่ {tier.partsRate}</td>
                                        <td className={`border border-gray-200 p-2 text-right ${isActive ? 'font-semibold' : ''}`}>{formatNum(tier.commP)}</td>
                                    </tr>
                                    <tr className={`font-semibold ${isActive ? (tier.color === 'green' ? 'bg-green-50/30 text-green-700' : tier.color === 'orange' ? 'bg-orange-50/30 text-orange-700' : 'bg-red-50/30 text-red-700') : 'opacity-40 text-gray-400'}`}>
                                        <td className="border border-gray-200 p-2 text-right">รวมกลุ่ม {tier.pct}%</td>
                                        <td className={`border border-gray-200 p-2 text-right ${isActive ? 'underline decoration-double' : ''}`}>{formatNum(tier.total)}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        <tr className="bg-blue-50/50 font-bold text-slate-800">
                            <td className="border border-gray-200 p-2 text-right">
                                ผลลัพธ์ต่อหน่วย ({formatNum(totalUnitsAll)} หน่วย)
                            </td>
                            <td className="border border-gray-200 p-2 text-right text-lg text-blue-700 underline decoration-double">
                                {formatNum(perUnit)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Summary Units Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm mt-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-left">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    กลุ่มงาน
                                </div>
                            </th>
                            <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                    หน่วย
                                </div>
                            </th>
                            <th className="border border-gray-200 p-2 bg-slate-800 text-white font-semibold text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    ผลลัพธ์
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const managers = officerData.filter(r => String(r.STARID || '').trim().toUpperCase() === 'MG');
                            const technicians = officerData.filter(r =>
                                String(r.OFFTYPE || '').trim().toUpperCase() === 'SV' &&
                                String(r.STARID || '').trim().toUpperCase() !== 'MG'
                            );
                            const uMLocal = managers.reduce((sum, r) => sum + (parseFloat(officerEdits[r.CODE]?.UNIT) || 0), 0);
                            const uTLocal = technicians.reduce((sum, r) => sum + (parseFloat(officerEdits[r.CODE]?.UNIT) || 0), 0);
                            const uTotal = uMLocal + uTLocal;

                            return (
                                <>
                                    <tr className="hover:bg-gray-50">
                                        <td className="border border-gray-200 p-2 font-bold text-slate-700">ส่วนกลาง</td>
                                        <td className="border border-gray-200 p-2 text-right font-bold text-slate-800">{formatNum(uMLocal)}</td>
                                        <td className="border border-gray-200 p-2 text-right font-bold text-slate-800">{formatNum(resultCentral)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="border border-gray-200 p-2 font-bold text-slate-700">ช่าง</td>
                                        <td className="border border-gray-200 p-2 text-right font-bold text-slate-800">{formatNum(uTLocal)}</td>
                                        <td className="border border-gray-200 p-2 text-right font-bold text-slate-800">{formatNum(resultTech)}</td>
                                    </tr>
                                    <tr className="bg-red-50 font-bold text-red-600">
                                        <td className="border border-gray-200 p-2">รวม</td>
                                        <td className="border border-gray-200 p-2 text-right">{formatNum(uTotal)}</td>
                                        <td className="border border-gray-200 p-2 text-right">{formatNum(totalComm)}</td>
                                    </tr>
                                </>
                            );
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Work Period Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm mt-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-yellow-400 text-slate-900 font-bold">
                            <th className="border border-gray-200 p-2 text-center w-1/4">
                                <div className="flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    หน่วย
                                </div>
                            </th>
                            <th colSpan={2} className="border border-gray-200 p-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    วันละ /
                                    <input
                                        type="number"
                                        className="w-16 mx-1 border border-gray-800 rounded px-1 py-0.5 text-center bg-white text-slate-800 font-bold focus:ring-1 focus:ring-orange-500"
                                        value={workingDays || ''}
                                        placeholder=""
                                        onChange={(e) => setWorkingDays(e.target.value)}
                                    />
                                    วันทำงาน
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1.50, 1.25, 1.00, 0.75, 0.63, 0.50, 0.35].map((val) => {
                            const rowValue = uT > 0 ? (resultTech * val) / uT : 0;
                            const daysNum = parseFloat(workingDays) || 0;
                            const perDayValue = daysNum > 0 ? rowValue / daysNum : 0;
                            return (
                                <tr key={val} className="hover:bg-gray-50 text-slate-800 font-semibold text-right">
                                    <td className="border border-gray-200 p-2 text-center">{val.toFixed(2)}</td>
                                    <td className="border border-gray-200 p-2">{formatNum(rowValue)}</td>
                                    <td className="border border-gray-200 p-2">{formatNum(perDayValue)}</td>
                                </tr>
                            );
                        })}
                        <tr className="bg-[#92d050] font-bold text-red-600 h-10">
                            <td className="border border-gray-200 p-2 text-center text-slate-800">
                                <div className="flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                    ส่วนเกิน
                                </div>
                            </td>
                            <td className="border border-gray-200 p-2"></td>
                            <td className="border border-gray-200 p-2 text-right">
                                {formatNum(commissionCalc?.surplusTech || 0)}
                            </td>
                        </tr>
                        <tr className="bg-white text-slate-800 text-sm">
                            <td className="border border-gray-200 p-2 font-bold text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    หมายเหตุ
                                </div>
                            </td>
                            <td colSpan={2} className="border border-gray-200 p-2">
                                <input
                                    type="text"
                                    className="w-full border border-gray-800 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/30"
                                    value={commissionNote || ''}
                                    onChange={(e) => setCommissionNote(e.target.value)}
                                    placeholder="ใส่หมายเหตุที่นี่..."
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
