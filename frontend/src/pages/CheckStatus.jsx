import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getClaimReport, getOfficerList } from '../api';

// Utils
import { parseV } from '../utils/formatters';
import { computeMonthlySummary, getYearsFromClaimData, calculateCommission } from '../utils/commission';

// Hooks
import { useLocalStorage, useLocalStorageWithMigration } from '../hooks/useLocalStorage';

// Tab Components
import CalcTab from '../components/CheckStatus/CalcTab';
import OfficerTab from '../components/CheckStatus/OfficerTab';
import SummaryTab from '../components/CheckStatus/SummaryTab';

export default function CheckStatus() {
  const [searchParams] = useSearchParams();

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('calc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [lastLoadedLabel, setLastLoadedLabel] = useState('');

  // ── Data State ──
  const [claimData, setClaimData] = useState([]);
  const [officerData, setOfficerData] = useState([]);
  const [filteredClaim, setFilteredClaim] = useState([]);
  const [filteredOfficer, setFilteredOfficer] = useState([]);
  const [claimSearch, setClaimSearch] = useState('');
  const [officerSearch, setOfficerSearch] = useState('');
  const [claimStartDate, setClaimStartDate] = useState('');
  const [claimEndDate, setClaimEndDate] = useState('');
  const [calcYearFilter, setCalcYearFilter] = useState('');

  const getInitialTargetsMap = () => {
    const old = localStorage.getItem('monthly_targets');
    if (old) {
      try {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed)) return { '2025': parsed };
      } catch (e) { }
    }
    return {};
  };

  const [monthlyTargetsMap, setMonthlyTargetsMap] = useLocalStorage('monthly_targets_map_v2', getInitialTargetsMap());
  const targetYear = claimStartDate ? claimStartDate.split('-')[0] : String(new Date().getFullYear());
  const monthlyTargets = monthlyTargetsMap[targetYear] || Array.from({ length: 12 }, () => '');

  const setMonthlyTargets = useCallback((updater) => {
    setMonthlyTargetsMap(prev => {
      const arr = prev[targetYear] ? [...prev[targetYear]] : Array.from({ length: 12 }, () => '');
      const nextArr = typeof updater === 'function' ? updater(arr) : updater;
      return { ...prev, [targetYear]: nextArr };
    });
  }, [targetYear, setMonthlyTargetsMap]);
  const [commissionNote, setCommissionNote] = useLocalStorage('commission_note', '');
  const [workingDays, setWorkingDays] = useLocalStorage('working_days', '');

  const periodKey = `${claimStartDate || 'all'}_${claimEndDate || 'all'}`;

  const [officerEditsMap, setOfficerEditsMap] = useLocalStorageWithMigration(
    'officer_edits_v2', 'officer_edits', {}
  );
  const officerEdits = officerEditsMap[periodKey] || {};

  const [manualSummaryMap, setManualSummaryMap] = useLocalStorageWithMigration(
    'ar_manual_summary_v2', 'ar_manual_summary', {}
  );
  const manualSummary = manualSummaryMap[periodKey] || [{ id: Date.now() }];

  const [cashIncomeMap, setCashIncomeMap] = useLocalStorageWithMigration(
    'ar_cash_income_v2', 'ar_cash_income', {}
  );
  const [accIncomeMap, setAccIncomeMap] = useLocalStorageWithMigration(
    'ar_acc_income_v2', 'ar_acc_income', {}
  );
  const cashIncomeRows = cashIncomeMap[periodKey] || [];
  const accIncomeRows = accIncomeMap[periodKey] || [];

  // ── Saved Reports ──
  const [savedReports, setSavedReports] = useState([]);
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
    setSavedReports(reports);
  }, []);

  // ── Summary Row Actions ──
  const addSummaryRow = (isHeader = false, defaultTitle = '') => {
    setManualSummaryMap(p => ({
      ...p,
      [periodKey]: [
        ...(p[periodKey] || [{ id: Date.now(), type: 'row' }]),
        { id: Date.now(), type: isHeader ? 'header' : 'row', title: defaultTitle }
      ]
    }));
  };
  const removeSummaryRow = (id) => {
    setManualSummaryMap(p => ({
      ...p,
      [periodKey]: (p[periodKey] || []).filter(r => r.id !== id)
    }));
  };
  const updateSummaryRow = (id, key, val) => {
    setManualSummaryMap(p => ({
      ...p,
      [periodKey]: (p[periodKey] || []).map(r => r.id === id ? { ...r, [key]: val } : r)
    }));
  };

  // ── Income Row Actions ──
  const addCashIncome = () => setCashIncomeMap(p => ({
    ...p,
    [periodKey]: [...(p[periodKey] || []), { id: Date.now().toString(), label: '', labor: '', parts: '' }]
  }));
  const removeCashIncome = (id) => setCashIncomeMap(p => ({
    ...p,
    [periodKey]: (p[periodKey] || []).filter(r => r.id !== id)
  }));
  const updateCashIncome = (id, field, val) => setCashIncomeMap(p => ({
    ...p,
    [periodKey]: (p[periodKey] || []).map(r => r.id === id ? { ...r, [field]: val } : r)
  }));

  const addAccIncome = () => setAccIncomeMap(p => ({
    ...p,
    [periodKey]: [...(p[periodKey] || []), { id: Date.now().toString(), label: '', labor: '', parts: '' }]
  }));
  const removeAccIncome = (id) => setAccIncomeMap(p => ({
    ...p,
    [periodKey]: (p[periodKey] || []).filter(r => r.id !== id)
  }));
  const updateAccIncome = (id, field, val) => setAccIncomeMap(p => ({
    ...p,
    [periodKey]: (p[periodKey] || []).map(r => r.id === id ? { ...r, [field]: val } : r)
  }));

  // ── Computed / Memoized ──
  const calcYearOptions = useMemo(() => getYearsFromClaimData(claimData), [claimData]);
  const monthlySummary = useMemo(
    () => computeMonthlySummary(claimData, calcYearFilter),
    [claimData, calcYearFilter]
  );

  const commissionCalc = useMemo(() => calculateCommission({
    loaded,
    monthlySummaryRows: monthlySummary.rows,
    monthlyTargets,
    officerData,
    officerEdits,
    workingDays,
    cashIncomeRows,
    accIncomeRows,
    claimStartDate,
    monthlySummary,
  }), [loaded, monthlySummary, monthlyTargets, officerData, officerEdits, workingDays, cashIncomeRows, accIncomeRows, claimStartDate]);

  // ── Data Loading ──
  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const claimParams = {};
      if (claimStartDate.trim()) claimParams.startDate = claimStartDate.trim().slice(0, 10);
      if (claimEndDate.trim()) claimParams.endDate = claimEndDate.trim().slice(0, 10);
      const [claimRes, officerRes] = await Promise.all([
        getClaimReport(claimParams),
        getOfficerList(),
      ]);
      const claim = claimRes.data || [];
      const officer = officerRes.data || [];
      setClaimData(claim);
      setOfficerData(officer);

      const qClaim = claimSearch.trim().toLowerCase();
      const qOfficer = officerSearch.trim().toLowerCase();
      setFilteredClaim(
        !qClaim ? claim : claim.filter((row) =>
          ['JOBNO', 'TAXNO', 'CUSNAM', 'MDLCOD', 'STRNO'].some((col) => {
            const v = row[col];
            return v != null && String(v).toLowerCase().includes(qClaim);
          })
        )
      );
      setFilteredOfficer(
        !qOfficer ? officer : officer.filter((row) => row.NAME != null && String(row.NAME).toLowerCase().includes(qOfficer))
      );
      setLoaded(true);

      const start = claimStartDate.trim();
      const end = claimEndDate.trim();
      if (start && end) setLastLoadedLabel(`ช่วงวันที่ ${start} ถึง ${end}`);
      else if (start) setLastLoadedLabel(`ตั้งแต่วันที่ ${start}`);
      else if (end) setLastLoadedLabel(`จนถึงวันที่ ${end}`);
      else setLastLoadedLabel('ข้อมูลทั้งหมด');
    } catch (e) {
      setError(e.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [claimSearch, officerSearch, claimStartDate, claimEndDate]);

  // URL Query Parameters
  useEffect(() => {
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    if (start || end) {
      if (start) setClaimStartDate(start);
      if (end) setClaimEndDate(end);
    }
  }, [searchParams]);

  // Auto-load when dates change
  useEffect(() => {
    if (claimStartDate && claimEndDate) loadData();
  }, [claimStartDate, claimEndDate, loadData]);

  // ── Search ──
  const applyOfficerSearch = useCallback((q) => {
    if (!q.trim()) { setFilteredOfficer(officerData); return; }
    const lower = q.trim().toLowerCase();
    setFilteredOfficer(officerData.filter((row) => row.NAME != null && String(row.NAME).toLowerCase().includes(lower)));
  }, [officerData]);

  // ── Display Counts ──
  const managersCount = filteredOfficer.filter(r => String(r.STARID || '').trim().toUpperCase() === 'MG').length;
  const techniciansCount = filteredOfficer.filter(r =>
    String(r.OFFTYPE || '').trim().toUpperCase() === 'SV' &&
    String(r.STARID || '').trim().toUpperCase() !== 'MG'
  ).length;

  const displayTotal = activeTab === 'calc'
    ? filteredClaim.length
    : activeTab === 'officer'
      ? (managersCount + techniciansCount)
      : activeTab === 'summary'
        ? manualSummary.length
        : 0;

  // ── Render ──
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="border-l-4 border-orange-500 pl-4">
          <h1 className="text-2xl font-semibold text-gray-800">ระบบคำนวณค่าคอมมิชชัน</h1>
          <p className="text-gray-600 text-sm mt-1">ดึงข้อมูลจาก OMODA — รวม {displayTotal.toLocaleString()} แถว</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 mb-6 gap-0">
        {[
          { id: 'calc', label: 'คำนวน' },
          { id: 'officer', label: 'ข้อมูลพนักงาน' },
          { id: 'summary', label: 'สรุป' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'text-orange-500 border-orange-500' : 'text-gray-600 border-transparent hover:text-orange-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon="list" label="รวมทั้งหมด" value={`${displayTotal.toLocaleString()} แถว`} />
        <StatCard icon="calendar" label="ข้อมูล" value="จาก OMODA" />
        <StatCard icon="table" label="แหล่งข้อมูล" value="OMODA" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          {savedReports.length > 0 && (
            <select
              className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer shadow-sm"
              value={savedReports.find(r => r.start === claimStartDate && r.end === claimEndDate)?.id || ''}
              onChange={(e) => {
                const report = savedReports.find(r => String(r.id) === e.target.value);
                if (report) {
                  setLoaded(false);
                  setClaimStartDate(report.start);
                  setClaimEndDate(report.end);
                }
              }}
            >
              <option value="">-- เลือกตารางที่สร้างไว้ --</option>
              {savedReports.map(report => (
                <option key={report.id} value={report.id}>{report.label}</option>
              ))}
            </select>
          )}
          {lastLoadedLabel && !loading && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                {lastLoadedLabel}
              </span>
            </div>
          )}
        </div>
        {activeTab === 'officer' && (
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อ"
              value={officerSearch}
              onChange={(e) => {
                setOfficerSearch(e.target.value);
                applyOfficerSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-sm text-red-700">{error}</div>
      )}

      {/* Tab Content */}
      {activeTab === 'calc' && (
        <CalcTab
          loaded={loaded}
          commissionCalc={commissionCalc}
          monthlySummary={monthlySummary}
          monthlyTargets={monthlyTargets}
          setMonthlyTargets={setMonthlyTargets}
          cashIncomeRows={cashIncomeRows}
          accIncomeRows={accIncomeRows}
          addCashIncome={addCashIncome}
          removeCashIncome={removeCashIncome}
          updateCashIncome={updateCashIncome}
          addAccIncome={addAccIncome}
          removeAccIncome={removeAccIncome}
          updateAccIncome={updateAccIncome}
          claimStartDate={claimStartDate}
          cashIncomeMap={cashIncomeMap}
          accIncomeMap={accIncomeMap}
          officerData={officerData}
          officerEdits={officerEdits}
          workingDays={workingDays}
          setWorkingDays={setWorkingDays}
          commissionNote={commissionNote}
          setCommissionNote={setCommissionNote}
        />
      )}

      {activeTab === 'officer' && (
        <OfficerTab
          filteredOfficer={filteredOfficer}
          officerEdits={officerEdits}
          commissionCalc={commissionCalc}
          loaded={loaded}
          periodKey={periodKey}
          setOfficerEditsMap={setOfficerEditsMap}
        />
      )}

      {activeTab === 'summary' && (
        <SummaryTab
          manualSummary={manualSummary}
          addSummaryRow={addSummaryRow}
          removeSummaryRow={removeSummaryRow}
          updateSummaryRow={updateSummaryRow}
        />
      )}
    </div>
  );
}

/* ── Helper: Stat Card ── */
function StatCard({ icon, label, value }) {
  const icons = {
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    table: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[icon]}
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
