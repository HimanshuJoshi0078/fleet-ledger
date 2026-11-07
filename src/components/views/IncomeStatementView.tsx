import React, { useState } from 'react';
import {
  LineChart,
  Printer,
  Download,
  Calendar,
  Truck,
  TrendingUp,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { generateIncomeStatement } from '../../services/accountingEngine';
import { formatINR, formatPercent, formatDate } from '../../services/formatters';

interface IncomeStatementViewProps {
  state: AppState;
  onOpenPrintReport: () => void;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({
  state,
  onOpenPrintReport,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { breakdowns, consolidated } = generateIncomeStatement(
    state.journalEntries,
    state.vehicles,
    startDate || endDate ? { startDate, endDate } : undefined
  );

  const truckA = state.vehicles[0];
  const truckB = state.vehicles[1];

  const bA = truckA ? breakdowns[truckA.plateNumber] : null;
  const bB = truckB ? breakdowns[truckB.plateNumber] : null;

  const handleExportCSV = () => {
    const headers = ['Account Particulars', truckA?.plateNumber || 'Truck A', truckB?.plateNumber || 'Truck B', 'Consolidated Fleet Total'];
    const rows = [
      ['Gross Freight Revenue', bA?.grossFreightRevenue || 0, bB?.grossFreightRevenue || 0, consolidated.grossFreightRevenue],
      ['Detention & Other Incomes', bA?.detentionAndOtherIncome || 0, bB?.detentionAndOtherIncome || 0, consolidated.detentionAndOtherIncome],
      ['TOTAL REVENUE', bA?.totalRevenue || 0, bB?.totalRevenue || 0, consolidated.totalRevenue],
      ['Diesel Fuel Expense', bA?.dieselExpense || 0, bB?.dieselExpense || 0, consolidated.dieselExpense],
      ['Diesel Liters Consumed', bA?.dieselLiters || 0, bB?.dieselLiters || 0, consolidated.dieselLiters],
      ['Highway Toll & Fastag', bA?.tollExpense || 0, bB?.tollExpense || 0, consolidated.tollExpense],
      ['Driver Trip Bhatta', bA?.driverBhattaExpense || 0, bB?.driverBhattaExpense || 0, consolidated.driverBhattaExpense],
      ['En-route Repairs & Punctures', bA?.enrouteRepairsExpense || 0, bB?.enrouteRepairsExpense || 0, consolidated.enrouteRepairsExpense],
      ['Loading / Unloading Hamali', bA?.loadingHamaliExpense || 0, bB?.loadingHamaliExpense || 0, consolidated.loadingHamaliExpense],
      ['Border Green Tax', bA?.borderGreenTaxExpense || 0, bB?.borderGreenTaxExpense || 0, consolidated.borderGreenTaxExpense],
      ['TOTAL DIRECT EXPENSES', bA?.totalDirectExpenses || 0, bB?.totalDirectExpenses || 0, consolidated.totalDirectExpenses],
      ['GROSS OPERATING PROFIT', bA?.grossOperatingProfit || 0, bB?.grossOperatingProfit || 0, consolidated.grossOperatingProfit],
      ['Driver Monthly Base Salary', bA?.driverBaseSalary || 0, bB?.driverBaseSalary || 0, consolidated.driverBaseSalary],
      ['Vehicle Loan Interest', bA?.loanInterestExpense || 0, bB?.loanInterestExpense || 0, consolidated.loanInterestExpense],
      ['Insurance & Permits', bA?.insuranceAmortization || 0, bB?.insuranceAmortization || 0, consolidated.insuranceAmortization],
      ['Admin & GPS', bA?.adminGpsExpense || 0, bB?.adminGpsExpense || 0, consolidated.adminGpsExpense],
      ['Depreciation Expense', bA?.depreciationExpense || 0, bB?.depreciationExpense || 0, consolidated.depreciationExpense],
      ['TOTAL FIXED OVERHEADS', bA?.totalFixedOverheads || 0, bB?.totalFixedOverheads || 0, consolidated.totalFixedOverheads],
      ['NET OPERATING PROFIT', bA?.netOperatingProfit || 0, bB?.netOperatingProfit || 0, consolidated.netOperatingProfit],
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FleetLedger_Profit_Loss_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-600" />
            <span>Income Statement (Comparative Profit &amp; Loss)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial logistics P&amp;L with separate truck performance tracking and enterprise operating margin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded border border-slate-700 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenPrintReport}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Printer className="w-4 h-4 flex-shrink-0" />
            <span>Print P&amp;L</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Accounting Period:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-300 font-mono text-xs bg-slate-50"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-300 font-mono text-xs bg-slate-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] w-full sm:w-auto">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 py-1.5 min-h-[36px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            All Entries
          </button>
          <button
            onClick={() => {
              const d = new Date();
              const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
              setStartDate(firstDay);
              setEndDate('');
            }}
            className="px-3 py-1.5 min-h-[36px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            Current Month (Nov 2026)
          </button>
        </div>
      </div>

      {/* Tally Comparative Income Statement Table */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
        <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
          <span className="tracking-tight">
            INCOME STATEMENT FOR PERIOD {startDate ? formatDate(startDate) : 'START'} TO {endDate ? formatDate(endDate) : 'CURRENT'}
          </span>
          <span className="font-mono text-xs font-normal text-slate-300">
            Currency: Indian Rupee (₹)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200 text-xs">
                <th className="py-2.5 px-4 font-sans w-2/5">Particulars / Account Head</th>
                <th className="py-2.5 px-3 text-right">
                  <div>{truckA?.plateNumber || 'Truck A'}</div>
                  <div className="text-[10px] text-slate-500 font-normal font-sans">
                    {truckA?.model.split('(')[0]}
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">
                  <div>{truckB?.plateNumber || 'Truck B'}</div>
                  <div className="text-[10px] text-slate-500 font-normal font-sans">
                    {truckB?.model.split('(')[0]}
                  </div>
                </th>
                <th className="py-2.5 px-4 text-right bg-slate-200/60 font-bold text-slate-900">
                  <div>Enterprise Total</div>
                  <div className="text-[10px] text-slate-600 font-normal font-sans">Consolidated Fleet</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* SECTION 1: REVENUE */}
              <tr className="bg-slate-50 font-sans font-bold text-slate-800">
                <td colSpan={4} className="py-2 px-4 uppercase text-[10px] tracking-wider text-slate-500">
                  1. Operating Freight Revenue
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Gross Freight Billing (Bilties/LRs)</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.grossFreightRevenue)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.grossFreightRevenue)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.grossFreightRevenue)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Detention, Halting &amp; Demurrage Charges</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.detentionAndOtherIncome)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.detentionAndOtherIncome)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.detentionAndOtherIncome)}</td>
              </tr>
              <tr className="bg-blue-50/40 font-bold text-slate-900 border-t border-b border-blue-200">
                <td className="py-2 px-4 font-sans">TOTAL GROSS REVENUE (A)</td>
                <td className="py-2 px-3 text-right text-blue-900">{formatINR(bA?.totalRevenue)}</td>
                <td className="py-2 px-3 text-right text-blue-900">{formatINR(bB?.totalRevenue)}</td>
                <td className="py-2 px-4 text-right bg-blue-100/50 text-blue-950 font-bold">{formatINR(consolidated.totalRevenue)}</td>
              </tr>

              {/* SECTION 2: DIRECT OPERATING EXPENSES */}
              <tr className="bg-slate-50 font-sans font-bold text-slate-800">
                <td colSpan={4} className="py-2 px-4 uppercase text-[10px] tracking-wider text-slate-500">
                  2. Direct Trip Operating Expenses
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">
                  <span>Diesel Fuel Expense</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                    (Liters: {bA?.dieselLiters} / {bB?.dieselLiters})
                  </span>
                </td>
                <td className="py-1.5 px-3 text-right text-rose-700">{formatINR(bA?.dieselExpense)}</td>
                <td className="py-1.5 px-3 text-right text-rose-700">{formatINR(bB?.dieselExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-rose-800">{formatINR(consolidated.dieselExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Highway Toll &amp; Fastag Charges</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.tollExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.tollExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.tollExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Driver Trip Bhatta (Food Allowance)</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.driverBhattaExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.driverBhattaExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.driverBhattaExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">En-route Repairs &amp; Tyre Punctures</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.enrouteRepairsExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.enrouteRepairsExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.enrouteRepairsExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Loading, Unloading &amp; Hamali Charges</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.loadingHamaliExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.loadingHamaliExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.loadingHamaliExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">State Border Entry &amp; Green Tax</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.borderGreenTaxExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.borderGreenTaxExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.borderGreenTaxExpense)}</td>
              </tr>
              <tr className="bg-rose-50/40 font-bold text-rose-900 border-t border-b border-rose-200">
                <td className="py-2 px-4 font-sans">TOTAL DIRECT OPERATING COSTS (B)</td>
                <td className="py-2 px-3 text-right text-rose-800">{formatINR(bA?.totalDirectExpenses)}</td>
                <td className="py-2 px-3 text-right text-rose-800">{formatINR(bB?.totalDirectExpenses)}</td>
                <td className="py-2 px-4 text-right bg-rose-100/50 text-rose-950 font-bold">{formatINR(consolidated.totalDirectExpenses)}</td>
              </tr>

              {/* CONTRIBUTION MARGIN */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-b-2 border-slate-300">
                <td className="py-2.5 px-4 font-sans">
                  <span>GROSS OPERATING PROFIT / CONTRIBUTION (A - B)</span>
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-800 font-bold">
                  {formatINR(bA?.grossOperatingProfit)}
                  <span className="block text-[10px] text-slate-500 font-normal">
                    {formatPercent(bA?.grossOperatingMarginPercent)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-800 font-bold">
                  {formatINR(bB?.grossOperatingProfit)}
                  <span className="block text-[10px] text-slate-500 font-normal">
                    {formatPercent(bB?.grossOperatingMarginPercent)}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right bg-slate-200/80 text-emerald-950 font-bold">
                  {formatINR(consolidated.grossOperatingProfit)}
                  <span className="block text-[10px] text-slate-600 font-normal">
                    {formatPercent(consolidated.grossOperatingMarginPercent)}
                  </span>
                </td>
              </tr>

              {/* SECTION 3: FIXED & OVERHEAD EXPENSES */}
              <tr className="bg-slate-50 font-sans font-bold text-slate-800">
                <td colSpan={4} className="py-2 px-4 uppercase text-[10px] tracking-wider text-slate-500">
                  3. Fixed Allocated &amp; Ownership Overheads
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Driver Base Monthly Salary</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.driverBaseSalary)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.driverBaseSalary)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.driverBaseSalary)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Vehicle Loan Finance Interest</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.loanInterestExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.loanInterestExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.loanInterestExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Insurance Policy &amp; Permit Amortization</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.insuranceAmortization)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.insuranceAmortization)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.insuranceAmortization)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Office Administration &amp; Fleet GPS Tracking</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.adminGpsExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.adminGpsExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.adminGpsExpense)}</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-1.5 px-4 pl-6 font-sans text-slate-800">Vehicle Book Depreciation Expense</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bA?.depreciationExpense)}</td>
                <td className="py-1.5 px-3 text-right text-slate-800">{formatINR(bB?.depreciationExpense)}</td>
                <td className="py-1.5 px-4 text-right font-semibold bg-slate-50/50 text-slate-900">{formatINR(consolidated.depreciationExpense)}</td>
              </tr>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t border-b border-slate-300">
                <td className="py-2 px-4 font-sans">TOTAL FIXED OVERHEADS (C)</td>
                <td className="py-2 px-3 text-right text-slate-800">{formatINR(bA?.totalFixedOverheads)}</td>
                <td className="py-2 px-3 text-right text-slate-800">{formatINR(bB?.totalFixedOverheads)}</td>
                <td className="py-2 px-4 text-right bg-slate-200/60 font-bold text-slate-900">{formatINR(consolidated.totalFixedOverheads)}</td>
              </tr>

              {/* FINAL NET OPERATING PROFIT / LOSS */}
              <tr className="bg-emerald-50 border-t-2 border-b-2 border-emerald-400 font-bold text-emerald-950 text-xs">
                <td className="py-3 px-4 font-sans">
                  <div className="font-bold text-sm">NET OPERATING PROFIT / (LOSS)</div>
                  <div className="text-[10px] text-emerald-800 font-normal">
                    Transferred to Balance Sheet Owner Equity
                  </div>
                </td>
                <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                  {formatINR(bA?.netOperatingProfit)}
                  <span className="block text-[11px] font-normal text-emerald-900">
                    Net: {formatPercent(bA?.netOperatingMarginPercent)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                  {formatINR(bB?.netOperatingProfit)}
                  <span className="block text-[11px] font-normal text-emerald-900">
                    Net: {formatPercent(bB?.netOperatingMarginPercent)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right bg-emerald-100/80 text-emerald-950 font-bold text-sm">
                  {formatINR(consolidated.netOperatingProfit)}
                  <span className="block text-[11px] font-bold text-emerald-900">
                    Net: {formatPercent(consolidated.netOperatingMarginPercent)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

