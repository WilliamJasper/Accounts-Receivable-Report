import { formatNum, formatInputCommas, parseV } from '../../utils/formatters';

/**
 * Single income row in the Commission Calculation table.
 * Can be auto (read-only) or manual (editable).
 */
const IncomeRow = ({ id, label, labor, parts, onUpdate, onRemove, isAuto = false }) => {
    const total = parseV(labor) + parseV(parts);

    return (
        <tr className="group hover:bg-gray-50 border-b border-gray-200">
            <td className="border border-gray-300 p-2">
                <div className="flex items-center gap-2">
                    {!isAuto && onRemove && (
                        <button onClick={() => onRemove(id)} className="text-red-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    )}
                    {isAuto ? (
                        <span className="font-bold text-blue-700">{label}</span>
                    ) : (
                        <input
                            type="text"
                            value={label}
                            placeholder="ชื่อรายการ..."
                            onChange={(e) => onUpdate(id, 'label', e.target.value)}
                            className="w-full bg-transparent outline-none focus:ring-1 focus:ring-orange-200 rounded px-1 font-medium text-gray-700"
                        />
                    )}
                </div>
            </td>
            <td className="border border-gray-300 p-2">
                {isAuto ? (
                    <div className="text-right font-mono pr-2">{formatNum(labor)}</div>
                ) : (
                    <input
                        type="text"
                        value={labor || ''}
                        placeholder="0.00"
                        onChange={(e) => onUpdate(id, 'labor', formatInputCommas(e.target.value))}
                        className="w-full text-right font-mono bg-transparent outline-none focus:ring-1 focus:ring-orange-200 rounded px-1"
                    />
                )}
            </td>
            <td className="border border-gray-300 p-2">
                {isAuto ? (
                    <div className="text-right font-mono pr-2">{formatNum(parts)}</div>
                ) : (
                    <input
                        type="text"
                        value={parts || ''}
                        placeholder="0.00"
                        onChange={(e) => onUpdate(id, 'parts', formatInputCommas(e.target.value))}
                        className="w-full text-right font-mono bg-transparent outline-none focus:ring-1 focus:ring-orange-200 rounded px-1"
                    />
                )}
            </td>
            <td className="border border-gray-300 p-2 text-right font-bold text-slate-800 bg-gray-50/50">
                {formatNum(total)}
            </td>
        </tr>
    );
};

export default IncomeRow;
