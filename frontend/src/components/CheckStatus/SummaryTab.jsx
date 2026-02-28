import { formatNum } from '../../utils/formatters';
import { MANUAL_COLS } from '../../utils/constants';

/**
 * SummaryTab — Manual Commission Summary tab with section headers support
 */
export default function SummaryTab({
    manualSummary, addSummaryRow, removeSummaryRow, updateSummaryRow,
}) {
    const grandTotals = manualSummary.reduce((acc, r) => {
        if (r.type === 'header') return acc;
        acc.comm += parseFloat(r.comm || 0) || 0;
        acc.promo += parseFloat(r.promo || 0) || 0;
        acc.plus += parseFloat(r.plus || 0) || 0;
        acc.csRefund += parseFloat(r.csRefund || 0) || 0;
        acc.csDebt += parseFloat(r.csDebt || 0) || 0;
        acc.saving += parseFloat(r.saving || 0) || 0;

        const net = (parseFloat(r.comm || 0) || 0) +
            (parseFloat(r.promo || 0) || 0) +
            (parseFloat(r.plus || 0) || 0) +
            (parseFloat(r.csRefund || 0) || 0) -
            (parseFloat(r.csDebt || 0) || 0) -
            (parseFloat(r.saving || 0) || 0);
        acc.net += net;
        return acc;
    }, { comm: 0, promo: 0, plus: 0, csRefund: 0, csDebt: 0, saving: 0, net: 0 });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        หน้าสรุปยอดจ่ายค่าคอมมิชชัน (Manual Entry)
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => addSummaryRow(true)}
                            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            เพิ่มหัวข้อตาราง
                        </button>
                        <button
                            onClick={() => addSummaryRow(false)}
                            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            เพิ่มพนักงาน
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b-2 border-slate-200">
                                <th className="p-3 text-center font-bold text-slate-600 border-r border-slate-200 w-12">
                                    <div className="flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                        ลำดับ
                                    </div>
                                </th>
                                {MANUAL_COLS.map(c => (
                                    <th key={c.key} className={`p-3 text-center font-bold text-slate-600 border-r border-slate-200 text-sm ${c.isNum ? 'text-orange-700' : ''}`}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            {c.icon && (
                                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${c.iconColor || 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                                                </svg>
                                            )}
                                            {c.label}
                                        </div>
                                    </th>
                                ))}
                                <th className="p-3 w-12 text-slate-400 font-bold bg-slate-50">
                                    <div className="flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        ลบ
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {manualSummary.map((row, idx) => {
                                if (row.type === 'header') {
                                    return (
                                        <tr key={row.id} className="bg-orange-100/60 border-b-2 border-orange-200 shadow-sm">
                                            <td className="p-2 text-center text-orange-400 font-bold border-r border-orange-200 bg-orange-50/50">{idx + 1}</td>
                                            <td colSpan={MANUAL_COLS.length} className="p-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent font-bold text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-400 px-3 py-1.5 rounded-md"
                                                    placeholder="พิมพ์ชื่อตาราง/สาขา/แผนก... (เช่น ศูนย์บริการ-สาขาราชสีมา)"
                                                    value={row.title || ''}
                                                    onChange={(e) => updateSummaryRow(row.id, 'title', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 text-center bg-orange-50/50">
                                                <button
                                                    onClick={() => removeSummaryRow(row.id)}
                                                    className="text-orange-400 hover:text-red-500 transition-colors"
                                                    title="ลบหัวข้อตารางนี้"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }

                                const rowNet = (parseFloat(row.comm || 0) || 0) +
                                    (parseFloat(row.promo || 0) || 0) +
                                    (parseFloat(row.plus || 0) || 0) +
                                    (parseFloat(row.csRefund || 0) || 0) -
                                    (parseFloat(row.csDebt || 0) || 0) -
                                    (parseFloat(row.saving || 0) || 0);

                                return (
                                    <tr key={row.id} className="hover:bg-orange-50/30 transition-colors border-b border-slate-100">
                                        <td className="p-2 text-center text-slate-400 font-medium border-r border-slate-100">{idx + 1}</td>
                                        {MANUAL_COLS.map(c => (
                                            <td key={c.key} className="p-1 border-r border-slate-100">
                                                {c.readOnly ? (
                                                    <div className={`px-2 py-1.5 font-bold text-slate-800 text-right ${rowNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {formatNum(rowNet)}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className={`px-2 py-1.5 w-full rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-transparent ${c.isNum ? 'text-right font-medium' : 'text-left'}`}
                                                        value={row[c.key] || ''}
                                                        onChange={(e) => updateSummaryRow(row.id, c.key, e.target.value)}
                                                        placeholder={c.isNum ? '0.00' : '...'}
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-2 text-center bg-slate-50">
                                            <button
                                                onClick={() => removeSummaryRow(row.id)}
                                                className="text-red-300 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-900 text-white font-black">
                                <td colSpan={4} className="p-4 text-center text-lg">ยอดรวมทั้งหมด (Grand Total)</td>
                                <td className="p-4 text-right text-orange-400 border-l border-slate-700">{formatNum(grandTotals.comm)}</td>
                                <td className="p-4 text-right text-orange-400 border-l border-slate-700">{formatNum(grandTotals.promo)}</td>
                                <td className="p-4 text-right text-orange-400 border-l border-slate-700">{formatNum(grandTotals.plus)}</td>
                                <td className="p-4 text-right text-orange-400 border-l border-slate-700">{formatNum(grandTotals.csRefund)}</td>
                                <td className="p-4 text-right text-red-400 border-l border-slate-700">({formatNum(grandTotals.csDebt)})</td>
                                <td className="p-4 text-right text-red-400 border-l border-slate-700">({formatNum(grandTotals.saving)})</td>
                                <td className="p-4 text-right text-green-400 border-l border-slate-700 text-2xl underline decoration-double decoration-green-400/30">
                                    {formatNum(grandTotals.net)}
                                </td>
                                <td colSpan={2} className="bg-slate-800"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-center gap-6 pb-10 mt-6">
                <button
                    onClick={() => addSummaryRow(false)}
                    className="group flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all text-slate-400 hover:text-orange-500 w-56"
                >
                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center transition-all">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <span className="font-bold">เพิ่มพนักงานใหม่</span>
                </button>

                <button
                    onClick={() => addSummaryRow(true)}
                    className="group flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500 w-56"
                >
                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-all">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-bold">เพิ่มหัวข้อตาราง/สาขา</span>
                </button>
            </div>
        </div>
    );
}
