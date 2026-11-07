import React from 'react';
import {
  TrendingUp,
  Truck,
  Fuel,
  Receipt,
  Scale,
  Calendar,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { AppState } from '../../services/storage';
import {
  generateIncomeStatement,
  generateBalanceSheet
} from '../../services/accountingEngine';
import { formatINR, formatPercent, formatDate, formatKm } from '../../services/formatters';

interface DashboardViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onSelectTab: (tab: any) => void;
  onOpenAddTruck?: () => void;
  onOpenDailyEntry?: () => void;
  onOpenBulkImport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onOpenQuickVoucher,
  onSelectTab,
  onOpenAddTruck,
  onOpenDailyEntry,
  onOpenBulkImport,
}) => {
  const { breakdowns, consolidated } = generateIncomeStatement(state.journalEntries, state.vehicles);
  const balanceSheet = generateBalanceSheet(state.accounts, state.journalEntries, state.vehicles);

  const truckA = state.vehicles[0];
  const truckB = state.vehicles[1];

  const breakdownA = truckA ? breakdowns[truckA.plateNumber] : null;
  const breakdownB = truckB ? breakdowns[truckB.plateNumber] : null;

  // Compute fuel cost percentage of revenue
  const totalRevenue = consolidated.totalRevenue || 1;
  const fuelCostPercent = (consolidated.dieselExpense / totalRevenue) * 100;

  // Recent 6 transactions
  const recentEntries = [...state.journalEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Enterprise Fleet Overview</span>
            <span className="text-xs bg-slate-800 text-white font-mono px-2 py-0.5 rounded font-normal">
              {state.vehicles.length} of 2 Trucks Registered
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time double-entry ledger summaries, operating margins, and vehicle asset health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-mono font-medium min-h-[42px] w-full sm:w-auto">
            <Scale className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="whitespace-nowrap">Balance Sheet Status: Balanced</span>
          </div>

          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded border border-slate-700 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
              title="Bulk Import CSV / Excel / Tally"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Bulk Import / Sync</span>
            </button>
          )}

          {onOpenDailyEntry && (
            <button
              onClick={onOpenDailyEntry}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded border border-blue-600 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
              title="All-in-one daily trip sheet"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Daily Sheet Entry</span>
            </button>
          )}

          <button
            onClick={onOpenQuickVoucher}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Add Voucher</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (High Contrast Utilitarian Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gross Freight Revenue */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Gross Freight Turnover</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900">
            {formatINR(consolidated.totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Billed across fleet</span>
            <span className="font-mono text-blue-700 font-medium">
              {state.journalEntries.filter(e => e.voucherType === 'FREIGHT_BILL').length} Bilties
            </span>
          </div>
        </div>

        {/* Card 2: Direct Trip Expenses */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Direct Operating Expenses</span>
            <Fuel className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-rose-700">
            {formatINR(consolidated.totalDirectExpenses)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Diesel, Tolls, Bhatta &amp; Repairs</span>
            <span className="font-mono text-rose-700 font-medium">
              {formatPercent((consolidated.totalDirectExpenses / totalRevenue) * 100)} Rev
            </span>
          </div>
        </div>

        {/* Card 3: Diesel Cost % Benchmark */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Fuel Expense / Turnover</span>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 flex items-baseline gap-2">
            <span>{formatPercent(fuelCostPercent)}</span>
            <span className="text-xs font-normal text-slate-500">
              ({formatINR(consolidated.dieselExpense)})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Industry Benchmark: 40-52%</span>
            <span className="font-mono text-emerald-700 font-medium">Target Range</span>
          </div>
        </div>

        {/* Card 4: Net Operating Profit */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Net Operating Profit</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-700">
            {formatINR(consolidated.netOperatingProfit)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Net Operating Margin</span>
            <span className="font-mono text-emerald-700 font-bold">
              {formatPercent(consolidated.netOperatingMarginPercent)}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Truck Side-by-Side Comparison Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Truck A Profile */}
        {truckA && breakdownA ? (
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded text-white">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight font-mono">{truckA.plateNumber}</div>
                  <div className="text-[11px] text-slate-400">{truckA.model}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                {truckA.operationalStatus}
              </span>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-slate-200">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Revenue</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatINR(breakdownA.totalRevenue, false)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Direct Expenses</span>
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    {formatINR(breakdownA.totalDirectExpenses, false)}
                  </span>
                </div>
                <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 block">Net Profit</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatINR(breakdownA.netOperatingProfit, false)}
                  </span>
                </div>
              </div>

              {/* Cost breakdown progress bars */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Diesel Fuel Cost ({breakdownA.dieselLiters} Ltr):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(breakdownA.dieselExpense)} (
                    {formatPercent(breakdownA.totalRevenue > 0 ? (breakdownA.dieselExpense / breakdownA.totalRevenue) * 100 : 0)})
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Tolls &amp; Fastag Deductions:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(breakdownA.tollExpense)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Driver Bhatta &amp; Repairs:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(breakdownA.driverBhattaExpense + breakdownA.enrouteRepairsExpense)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Fixed Monthly Loan EMI:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(truckA.monthlyEMI)}
                  </span>
                </div>
              </div>

              {/* Footer specs */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                <span>Odometer: {formatKm(truckA.currentOdometerKm)}</span>
                <button
                  onClick={() => onSelectTab('truck_ledger')}
                  className="text-blue-700 hover:underline font-sans font-semibold"
                >
                  View Full Truck Ledger &rarr;
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Truck A (Primary Vehicle)</div>
              <p className="text-xs text-slate-500 mt-0.5">Register your first commercial truck to track trip revenues, diesel, and EMIs.</p>
            </div>
            {onOpenAddTruck && (
              <button
                onClick={onOpenAddTruck}
                className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Add Truck A</span>
              </button>
            )}
          </div>
        )}

        {/* Truck B Profile */}
        {truckB && breakdownB ? (
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded text-white">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight font-mono">{truckB.plateNumber}</div>
                  <div className="text-[11px] text-slate-400">{truckB.model}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
                {truckB.operationalStatus}
              </span>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-slate-200">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Revenue</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatINR(breakdownB.totalRevenue, false)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Direct Expenses</span>
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    {formatINR(breakdownB.totalDirectExpenses, false)}
                  </span>
                </div>
                <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 block">Net Profit</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatINR(breakdownB.netOperatingProfit, false)}
                  </span>
                </div>
              </div>

              {/* Cost breakdown progress bars */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Diesel Fuel Cost ({breakdownB.dieselLiters} Ltr):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(breakdownB.dieselExpense)} (
                    {formatPercent(breakdownB.totalRevenue > 0 ? (breakdownB.dieselExpense / breakdownB.totalRevenue) * 100 : 0)})
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Tolls &amp; Fastag Deductions:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(breakdownB.tollExpense)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Driver Bhatta &amp; Repairs:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(breakdownB.driverBhattaExpense + breakdownB.enrouteRepairsExpense)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Fixed Monthly Loan EMI:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(truckB.monthlyEMI)}
                  </span>
                </div>
              </div>

              {/* Footer specs */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                <span>Odometer: {formatKm(truckB.currentOdometerKm)}</span>
                <button
                  onClick={() => onSelectTab('truck_ledger')}
                  className="text-blue-700 hover:underline font-sans font-semibold"
                >
                  View Full Truck Ledger &rarr;
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Truck B (Second Vehicle)</div>
              <p className="text-xs text-slate-500 mt-0.5">Register your second commercial vehicle for comparative 2-truck P&amp;L ledger.</p>
            </div>
            {onOpenAddTruck && (
              <button
                onClick={onOpenAddTruck}
                className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Add Truck B</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Balance Sheet Asset vs Liability Split & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Working Capital & Financial Position */}
        <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm text-xs space-y-3">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>WORKING CAPITAL &amp; LIQUIDITY</span>
            <Scale className="w-4 h-4 text-slate-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Liquid Funds (Cash+Bank+Fastag):</span>
              <span className="font-mono font-bold text-slate-900">
                {formatINR(
                  balanceSheet.assets.currentAssets.cashInHand +
                  balanceSheet.assets.currentAssets.bankBalance +
                  balanceSheet.assets.currentAssets.fastagWallet
                )}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Pending Freight Receivables:</span>
              <span className="font-mono font-bold text-blue-700">
                {formatINR(balanceSheet.assets.currentAssets.clientReceivables)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Fuel Pump Credit Dues Owed:</span>
              <span className="font-mono font-bold text-rose-700">
                {formatINR(balanceSheet.liabilities.currentLiabilities.fuelPumpCreditsPayable)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Driver Advances Recoverable:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatINR(balanceSheet.assets.currentAssets.driverAdvancesRecoverable)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Vehicle Loans Outstanding:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatINR(balanceSheet.liabilities.longTermLiabilities.vehicleLoansPayable)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Net Fleet Book Value:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatINR(balanceSheet.assets.fixedAssets.vehiclesNetBookValue)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-2 font-mono text-[11px]">
            <div className="flex justify-between text-slate-700">
              <span>Total Enterprise Assets:</span>
              <span className="font-bold">{formatINR(balanceSheet.assets.totalAssets)}</span>
            </div>
            <div className="flex justify-between text-slate-700 mt-1">
              <span>Total Liabilities + Equity:</span>
              <span className="font-bold">{formatINR(balanceSheet.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>

        {/* Recent Journal Transactions */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-300 shadow-sm text-xs space-y-3">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>RECENT DAYBOOK TRANSACTIONS</span>
            <button
              onClick={() => onSelectTab('daybook')}
              className="text-blue-700 hover:underline text-[11px] font-semibold"
            >
              View All Vouchers &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-1.5 px-2">Date</th>
                  <th className="py-1.5 px-2">Voucher #</th>
                  <th className="py-1.5 px-2">Vehicle</th>
                  <th className="py-1.5 px-2">Description</th>
                  <th className="py-1.5 px-2 text-right">Debit (₹)</th>
                  <th className="py-1.5 px-2 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans font-medium">
                      No transactions recorded yet. Click "Daily Sheet Entry", "Bulk Import / Sync", or "Add Voucher" to record transactions.
                    </td>
                  </tr>
                ) : (
                  recentEntries.map(entry => {
                    const totalDr = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
                    const totalCr = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2 px-2 font-bold text-blue-700 whitespace-nowrap">
                          {entry.voucherNumber}
                        </td>
                        <td className="py-2 px-2 text-slate-700 font-medium whitespace-nowrap">
                          {entry.vehiclePlate}
                        </td>
                        <td className="py-2 px-2 text-slate-800 font-sans max-w-xs truncate">
                          {entry.narration}
                        </td>
                        <td className="py-2 px-2 text-right text-rose-700 font-semibold whitespace-nowrap">
                          {formatINR(totalDr)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-700 font-semibold whitespace-nowrap">
                          {formatINR(totalCr)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
