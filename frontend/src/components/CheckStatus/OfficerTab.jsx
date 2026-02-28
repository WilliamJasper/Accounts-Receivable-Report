import { formatNum } from '../../utils/formatters';
import { OFFICER_COLUMNS } from '../../utils/constants';

/**
 * OfficerTab — Employee Data tab (Managers + Technicians)
 */
export default function OfficerTab({
    filteredOfficer, officerEdits, commissionCalc, loaded,
    periodKey, setOfficerEditsMap,
}) {
    const managers = filteredOfficer.filter(r => String(r.STARID || '').trim().toUpperCase() === 'MG');
    const technicians = filteredOfficer.filter(r =>
        String(r.OFFTYPE || '').trim().toUpperCase() === 'SV' &&
        String(r.STARID || '').trim().toUpperCase() !== 'MG'
    );

    const handleEdit = (code, key, val) => {
        setOfficerEditsMap(p => {
            const currentPeriodEdits = p[periodKey] || {};
            return {
                ...p,
                [periodKey]: {
                    ...currentPeriodEdits,
                    [code]: {
                        ...(currentPeriodEdits[code] || {}),
                        [key]: val
                    }
                }
            };
        });
    };

    const renderTable = (data, title, accentColor) => {
        const isManagerGroup = data.length > 0 && String(data[0].STARID || '').trim().toUpperCase() === 'MG';
        const perUnit = commissionCalc?.perUnit || 0;

        const totals = data.reduce((acc, row) => {
            const u = parseFloat(officerEdits[row.CODE]?.UNIT || '0') || 0;
            const d = parseFloat(officerEdits[row.CODE]?.WORKDAYS || '0') || 0;
            const reward = isManagerGroup ? (u * perUnit) : ((commissionCalc?.techRewardsMap[u.toFixed(2)] || 0) * d);
            const promo = parseFloat(officerEdits[row.CODE]?.PROMO || '0') || 0;
            const plus = parseFloat(officerEdits[row.CODE]?.PLUS || '0') || 0;
            const minus = parseFloat(officerEdits[row.CODE]?.MINUS || '0') || 0;
            const saving = parseFloat(officerEdits[row.CODE]?.SAVING || '0') || 0;
            const net = reward + promo + plus - minus - saving;

            acc.units += u;
            acc.rewards += reward;
            acc.promo += promo;
            acc.plus += plus;
            acc.minus += minus;
            acc.saving += saving;
            acc.net += net;
            return acc;
        }, { units: 0, rewards: 0, promo: 0, plus: 0, minus: 0, saving: 0, net: 0 });

        return (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-7 ${accentColor} rounded-full`}></div>
                        <span className="text-lg font-bold text-slate-800">{title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            รวมหน่วย: {totals.units.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            รวมสุทธิ: {totals.net.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                            {data.length.toLocaleString()} คน
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] border-collapse">
                        <thead>
                            <tr>
                                <th className="border-b border-gray-200 p-3 bg-slate-800 text-white font-semibold text-center w-16 text-sm">
                                    <div className="flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                        ลำดับ
                                    </div>
                                </th>
                                {OFFICER_COLUMNS.map((c) => (
                                    <th key={c.key} className="border-b border-gray-200 p-3 bg-slate-800 text-white font-semibold text-left text-sm whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            {c.icon && (
                                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${c.iconColor || 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                                                </svg>
                                            )}
                                            {c.label}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={OFFICER_COLUMNS.length + 1} className="text-center text-slate-400 py-12 bg-gray-50/30">
                                        {loaded ? 'ไม่พบข้อมูลในหมวดนี้' : 'กำลังโหลดข้อมูล...'}
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="even:bg-gray-50/50 hover:bg-orange-50/30 transition-colors">
                                            <td className="border-t border-gray-100 p-3 text-center text-gray-500 text-sm">
                                                {(idx + 1).toLocaleString()}
                                            </td>
                                            {OFFICER_COLUMNS.map((c) => (
                                                <td key={c.key} className={`border-t border-gray-100 p-2 text-slate-700 text-sm ${c.key === 'NAME' ? 'whitespace-nowrap min-w-[180px]' : ''}`}>
                                                    {c.editable ? (
                                                        c.key === 'REWARD' ? (
                                                            <div className="w-24 px-2 py-1 border border-blue-200 rounded text-right bg-blue-50 font-semibold text-blue-700">
                                                                {(() => {
                                                                    const u = parseFloat(officerEdits[row.CODE]?.UNIT || '0') || 0;
                                                                    if (isManagerGroup) {
                                                                        return formatNum(u * perUnit);
                                                                    } else {
                                                                        const d = parseFloat(officerEdits[row.CODE]?.WORKDAYS || '0') || 0;
                                                                        const rewardPerDay = commissionCalc?.techRewardsMap[u.toFixed(2)] || 0;
                                                                        return formatNum(rewardPerDay * d);
                                                                    }
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="text"
                                                                    className={`w-24 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ${c.key === 'UNIT' ? 'bg-yellow-50 font-semibold border-yellow-200 text-right' :
                                                                        c.key === 'MINUS' || c.key === 'SAVING' ? 'text-red-500 bg-red-50 border-red-100 text-right' :
                                                                            c.key === 'SIGN' ? 'bg-gray-50 border-gray-200 text-left' :
                                                                                'bg-orange-50/50 border-orange-100 text-right'
                                                                        }`}
                                                                    value={officerEdits[row.CODE]?.[c.key] || ''}
                                                                    onChange={(e) => handleEdit(row.CODE, c.key, e.target.value)}
                                                                    placeholder={c.key === 'SIGN' ? 'ชื่อผู้รับเงิน...' : '0.00'}
                                                                />
                                                            </div>
                                                        )
                                                    ) : c.key === 'NET' ? (
                                                        <div className="w-24 px-2 py-1 border border-green-200 rounded text-right bg-green-50 font-bold text-green-700">
                                                            {(() => {
                                                                const u = parseFloat(officerEdits[row.CODE]?.UNIT || '0') || 0;
                                                                const d = parseFloat(officerEdits[row.CODE]?.WORKDAYS || '0') || 0;
                                                                const reward = isManagerGroup ? (u * perUnit) : ((commissionCalc?.techRewardsMap[u.toFixed(2)] || 0) * d);
                                                                const promo = parseFloat(officerEdits[row.CODE]?.PROMO || '0') || 0;
                                                                const plus = parseFloat(officerEdits[row.CODE]?.PLUS || '0') || 0;
                                                                const minus = parseFloat(officerEdits[row.CODE]?.MINUS || '0') || 0;
                                                                const saving = parseFloat(officerEdits[row.CODE]?.SAVING || '0') || 0;
                                                                return formatNum(reward + promo + plus - minus - saving);
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        row[c.key] != null ? String(row[c.key]) : '-'
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100 font-bold">
                                        <td className="p-3 text-center border-t border-gray-300">
                                            <svg className="w-4 h-4 text-orange-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </td>
                                        {OFFICER_COLUMNS.map((c) => (
                                            <td key={c.key} className="p-3 border-t border-gray-300 text-sm">
                                                {c.key === 'UNIT' ? (
                                                    <div className="text-right text-orange-600">
                                                        {totals.units.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </div>
                                                ) : c.key === 'REWARD' ? (
                                                    <div className="text-right text-blue-600">
                                                        {totals.rewards.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </div>
                                                ) : c.key === 'PROMO' ? (
                                                    <div className="text-right">{totals.promo.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                                                ) : c.key === 'PLUS' ? (
                                                    <div className="text-right">{totals.plus.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                                                ) : c.key === 'MINUS' ? (
                                                    <div className="text-right text-red-600">({totals.minus.toLocaleString('th-TH', { minimumFractionDigits: 2 })})</div>
                                                ) : c.key === 'SAVING' ? (
                                                    <div className="text-right text-red-600">({totals.saving.toLocaleString('th-TH', { minimumFractionDigits: 2 })})</div>
                                                ) : c.key === 'NET' ? (
                                                    <div className="text-right text-green-600 font-black">
                                                        {totals.net.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </div>
                                                ) : c.key === 'NAME' ? (
                                                    <span className="text-slate-600">รวมทั้งหมด</span>
                                                ) : null}
                                            </td>
                                        ))}
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                <div className="p-2 bg-orange-500 rounded-lg text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">แยกกลุ่มบุคลากร</h3>
                    <p className="text-sm text-slate-600">ระบบคัดแยกผู้จัดการและช่างเทคนิคอัตโนมัติตามตำแหน่งงาน</p>
                </div>
            </div>
            {renderTable(managers, 'รายชื่อผู้จัดการ (Managers)', 'bg-blue-500')}
            {renderTable(technicians, 'รายชื่อช่างเทคนิค (Technicians)', 'bg-emerald-500')}
        </div>
    );
}
