/**
 * Commission calculation engine — pure business logic, no React.
 */
import { THAI_MONTHS } from './constants';
import { parseV } from './formatters';

/** Build monthly summary: labor = SERVNET, parts = PARTNET + OILNET + OUTNET */
export function computeMonthlySummary(claimData, yearFilter) {
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthName: THAI_MONTHS[i],
        labor: 0,
        parts: 0,
        total: 0,
    }));
    const rows = claimData || [];
    const filterYear = yearFilter != null && yearFilter !== '' ? String(yearFilter).trim() : null;
    for (const row of rows) {
        const dateStr = row.TAXDATE;
        if (!dateStr) continue;
        const s = String(dateStr).trim().slice(0, 10);
        const match = s.match(/^(\d{4})-(\d{2})/);
        if (!match) continue;
        const rowYear = match[1];
        if (filterYear != null && rowYear !== filterYear) continue;
        const monthIndex = parseInt(match[2], 10) - 1;
        if (monthIndex < 0 || monthIndex > 11) continue;
        const labor = Number(row.SERVNET) || 0;
        const parts = (Number(row.PARTNET) || 0) + (Number(row.OILNET) || 0) + (Number(row.OUTNET) || 0);
        byMonth[monthIndex].labor += labor;
        byMonth[monthIndex].parts += parts;
        byMonth[monthIndex].total += labor + parts;
    }
    let sumLabor = 0, sumParts = 0, sumTotal = 0;
    for (const r of byMonth) {
        sumLabor += r.labor;
        sumParts += r.parts;
        sumTotal += r.total;
    }
    return { rows: byMonth, sumLabor, sumParts, sumTotal };
}

/** Extract unique years from claim data */
export function getYearsFromClaimData(claimData) {
    const set = new Set();
    for (const row of claimData || []) {
        const dateStr = row.TAXDATE;
        if (!dateStr) continue;
        const s = String(dateStr).trim().slice(0, 10);
        const match = s.match(/^(\d{4})/);
        if (match) set.add(match[1]);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Calculate commission values from all inputs.
 * Returns null if not loaded.
 */
export function calculateCommission({
    loaded, monthlySummaryRows, monthlyTargets, officerData, officerEdits,
    workingDays, cashIncomeRows, accIncomeRows, claimStartDate, monthlySummary,
}) {
    if (!loaded) return null;

    const filterMonthIdx = claimStartDate ? (parseInt(claimStartDate.split('-')[1], 10) - 1) : -1;

    const omodaL = filterMonthIdx >= 0 ? (monthlySummaryRows[filterMonthIdx]?.labor || 0) : monthlySummary.sumLabor;
    const omodaP = filterMonthIdx >= 0 ? (monthlySummaryRows[filterMonthIdx]?.parts || 0) : monthlySummary.sumParts;

    const totalCashL = cashIncomeRows.reduce((s, r) => s + parseV(r.labor), 0) + omodaL;
    const totalCashP = cashIncomeRows.reduce((s, r) => s + parseV(r.parts), 0) + omodaP;

    const totalAccL = accIncomeRows.reduce((s, r) => s + parseV(r.labor), 0);
    const totalAccP = accIncomeRows.reduce((s, r) => s + parseV(r.parts), 0);

    const totalL = totalCashL + totalAccL;
    const totalP = totalCashP + totalAccP;
    const totalAchieved = totalL + totalP;

    let activeIndices = [];
    if (filterMonthIdx >= 0) {
        activeIndices = [filterMonthIdx];
    } else if (monthlySummary.sumTotal > 0) {
        monthlySummaryRows.forEach((r, i) => {
            if (r.total > 0) activeIndices.push(i);
        });
    }

    const totalTarget = activeIndices.reduce((sum, idx) => {
        const v = String(monthlyTargets[idx] || '0').replace(/,/g, '');
        const n = parseFloat(v);
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    const achievedPercent = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

    // --- 3-Tier Commission ---
    // Tier 100%: ค่าแรง 10%, อะไหล่ 1%
    const meetsTarget100 = totalTarget > 0 && achievedPercent >= 100;
    const commL100 = meetsTarget100 ? (totalL * 10 / 100) : 0;
    const commP100 = meetsTarget100 ? (totalP * 1 / 100) : 0;
    const total100 = commL100 + commP100;

    // Tier 90%: ค่าแรง 9%, อะไหล่ 0.9%
    const meetsTarget90 = totalTarget > 0 && achievedPercent >= 90;
    const commL90 = meetsTarget90 ? (totalL * 9 / 100) : 0;
    const commP90 = meetsTarget90 ? (totalP * 0.9 / 100) : 0;
    const total90 = commL90 + commP90;

    // Tier 80%: ค่าแรง 8%, อะไหล่ 0.8%
    const meetsTarget80 = totalTarget > 0 && achievedPercent >= 80;
    const commL80 = meetsTarget80 ? (totalL * 8 / 100) : 0;
    const commP80 = meetsTarget80 ? (totalP * 0.8 / 100) : 0;
    const total80 = commL80 + commP80;

    // Active tier (highest met)
    const activeTier = meetsTarget100 ? 100 : meetsTarget90 ? 90 : meetsTarget80 ? 80 : 0;
    const activeTotal = activeTier === 100 ? total100 : activeTier === 90 ? total90 : activeTier === 80 ? total80 : 0;
    const meetsTarget = activeTier > 0;

    const managers = officerData.filter(r => String(r.STARID || '').trim().toUpperCase() === 'MG');
    const technicians = officerData.filter(r =>
        String(r.OFFTYPE || '').trim().toUpperCase() === 'SV' &&
        String(r.STARID || '').trim().toUpperCase() !== 'MG'
    );

    const uM = managers.reduce((sum, r) => sum + (parseFloat(officerEdits[r.CODE]?.UNIT) || 0), 0);
    const uT = technicians.reduce((sum, r) => sum + (parseFloat(officerEdits[r.CODE]?.UNIT) || 0), 0);
    const totalUnitsAll = uM + uT;

    const perUnit = totalUnitsAll > 0 ? activeTotal / totalUnitsAll : 0;
    const resultCentral = uM * perUnit;
    const resultTech = uT * perUnit;

    const breakdownUnits = [1.50, 1.25, 1.00, 0.75, 0.63, 0.50, 0.35];
    const techRewardsMap = {};
    breakdownUnits.forEach(val => {
        const rowValue = uT > 0 ? (resultTech * val) / uT : 0;
        const daysNum = parseFloat(workingDays) || 0;
        const perDayValue = daysNum > 0 ? rowValue / daysNum : 0;
        techRewardsMap[val.toFixed(2)] = perDayValue;
    });

    const totalTechRewards = technicians.reduce((sum, row) => {
        const u = parseFloat(officerEdits[row.CODE]?.UNIT || '0') || 0;
        const d = parseFloat(officerEdits[row.CODE]?.WORKDAYS || '0') || 0;
        const rewardPerDay = techRewardsMap[u.toFixed(2)] || 0;
        return sum + (rewardPerDay * d);
    }, 0);

    const surplusTech = resultTech - totalTechRewards;

    return {
        // Active tier values (used for downstream calculations)
        activeTotal, activeTier, perUnit, totalUnitsAll, uM, uT,
        resultCentral, resultTech, techRewardsMap, totalTechRewards, surplusTech,
        // All tier details
        commL100, commP100, total100, meetsTarget100,
        commL90, commP90, total90, meetsTarget90,
        commL80, commP80, total80, meetsTarget80,
        // Income totals
        omodaL, omodaP, totalCashL, totalCashP, totalAccL, totalAccP, totalL, totalP,
        totalTarget, totalAchieved, achievedPercent, meetsTarget
    };
}

/** Filter officers: managers vs technicians */
export function filterOfficerGroups(officerList) {
    const managers = officerList.filter(r => String(r.STARID || '').trim().toUpperCase() === 'MG');
    const technicians = officerList.filter(r =>
        String(r.OFFTYPE || '').trim().toUpperCase() === 'SV' &&
        String(r.STARID || '').trim().toUpperCase() !== 'MG'
    );
    return { managers, technicians };
}
