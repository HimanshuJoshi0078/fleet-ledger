import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Truck,
  Scale,
  Calendar,
  Building
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { generateIncomeStatement, generateBalanceSheet } from '../../services/accountingEngine';
import { formatINR, formatPercent, formatDate } from '../../services/formatters';

interface PrintReportModalProps {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  state,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState<'MONTHLY_SUMMARY' | 'PL_STATEMENT' | 'BALANCE_SHEET'>('MONTHLY_SUMMARY');

  const { breakdowns, consolidated } = generateIncomeStatement(state.journalEntries, state.vehicles);
  const balanceSheet = generateBalanceSheet(state.accounts, state.journalEntries, state.vehicles);

  const truckA = state.vehicles[0];
  const truckB = state.vehicles[1];
  const bA = truckA ? breakdowns[truckA.plateNumber] : null;
  const bB = truckB ? breakdowns[truckB.plateNumber] : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base tracking-tight">PRINT FINANCIAL STATEMENT</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded border border-blue-500 shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Selector Tabs (no-print) */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex gap-2 no-print text-xs">
          <button
            onClick={() => setReportType('MONTHLY_SUMMARY')}
            className={`px-3 py-1 font-semibold rounded ${
              reportType === 'MONTHLY_SUMMARY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            Monthly Executive Summary
          </button>
          <button
            onClick={() => setReportType('PL_STATEMENT')}
            className={`px-3 py-1 font-semibold rounded ${
              reportType === 'PL_STATEMENT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            Comparative P&amp;L Statement
          </button>
          <button
            onClick={() => setReportType('BALANCE_SHEET')}
            className={`px-3 py-1 font-semibold rounded ${
              reportType === 'BALANCE_SHEET'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            Tally Balance Sheet
          </button>
        </div>

        {/* Printable Paper Canvas Area */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-xs print:p-0 print:overflow-visible">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  FLEETLEDGER LOGISTICS &amp; TRANSPORT
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Commercial Fleet Operations: 2-Truck Enterprise | Regd. Rajasthan Transport Authority
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Vehicles: {truckA?.plateNumber} &amp; {truckB?.plateNumber}
                </p>
              </div>

              <div className="text-right font-mono text-[11px]">
                <div className="font-bold text-slate-900">FINANCIAL REPORT</div>
                <div className="text-slate-500">Date: {formatDate(new Date().toISOString())}</div>
                <div className="text-slate-500">FY: 2026-27 (Double-Entry Basis)</div>
              </div>
            </div>
          </div>

          {/* 1. MONTHLY SUMMARY REPORT */}
          {reportType === 'MONTHLY_SUMMARY' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-300">
                <div className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-wide">
                  Monthly Transport Financial Statement
                </div>
                <p className="text-[11px] text-slate-600">
                  Consolidated performance metrics, direct operating trip costs, and asset-liability summary.
                </p>
              </div>

              {/* High-level KPI grid */}
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2 border border-slate-300 rounded bg-white">
                  <span className="text-[10px] text-slate-500 font-sans block">Gross Turnover</span>
                  <span className="font-bold text-slate-900 text-xs">{formatINR(consolidated.totalRevenue)}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded bg-white">
                  <span className="text-[10px] text-slate-500 font-sans block">Trip Direct Costs</span>
                  <span className="font-bold text-rose-800 text-xs">{formatINR(consolidated.totalDirectExpenses)}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded bg-white">
                  <span className="text-[10px] text-slate-500 font-sans block">Fixed Overheads</span>
                  <span className="font-bold text-slate-800 text-xs">{formatINR(consolidated.totalFixedOverheads)}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded bg-emerald-50">
                  <span className="text-[10px] text-emerald-900 font-sans block">Net Operating Profit</span>
                  <span className="font-bold text-emerald-800 text-xs">{formatINR(consolidated.netOperatingProfit)}</span>
                </div>
              </div>

              {/* Vehicle Comparison Table */}
              <table className="w-full text-left border-collapse border border-slate-300 text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300 font-sans">
                    <th className="p-2">Financial Metric</th>
                    <th className="p-2 text-right">{truckA?.plateNumber}</th>
                    <th className="p-2 text-right">{truckB?.plateNumber}</th>
                    <th className="p-2 text-right">Consolidated Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-1.5 font-sans">Freight Billed (Bilties)</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.grossFreightRevenue)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.grossFreightRevenue)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.grossFreightRevenue)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-sans">Diesel Fuel Consumed</td>
                    <td className="p-1.5 text-right text-rose-700">{formatINR(bA?.dieselExpense)}</td>
                    <td className="p-1.5 text-right text-rose-700">{formatINR(bB?.dieselExpense)}</td>
                    <td className="p-1.5 text-right font-bold text-rose-800">{formatINR(consolidated.dieselExpense)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-sans">Diesel Liters Consumed</td>
                    <td className="p-1.5 text-right">{bA?.dieselLiters} L</td>
                    <td className="p-1.5 text-right">{bB?.dieselLiters} L</td>
                    <td className="p-1.5 text-right font-bold">{consolidated.dieselLiters} L</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-sans">Highway Tolls &amp; Fastag</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.tollExpense)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.tollExpense)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.tollExpense)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-sans">Driver Bhatta &amp; Repairs</td>
                    <td className="p-1.5 text-right">{formatINR((bA?.driverBhattaExpense || 0) + (bA?.enrouteRepairsExpense || 0))}</td>
                    <td className="p-1.5 text-right">{formatINR((bB?.driverBhattaExpense || 0) + (bB?.enrouteRepairsExpense || 0))}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.driverBhattaExpense + consolidated.enrouteRepairsExpense)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-1.5 font-sans">Gross Operating Profit (Contribution)</td>
                    <td className="p-1.5 text-right text-emerald-800">{formatINR(bA?.grossOperatingProfit)}</td>
                    <td className="p-1.5 text-right text-emerald-800">{formatINR(bB?.grossOperatingProfit)}</td>
                    <td className="p-1.5 text-right text-emerald-950 font-bold">{formatINR(consolidated.grossOperatingProfit)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-sans">Driver Salaries &amp; Overheads</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.totalFixedOverheads)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.totalFixedOverheads)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.totalFixedOverheads)}</td>
                  </tr>
                  <tr className="bg-emerald-50/80 font-bold border-t-2 border-slate-400">
                    <td className="p-2 font-sans text-xs">NET OPERATING PROFIT</td>
                    <td className="p-2 text-right text-emerald-800">{formatINR(bA?.netOperatingProfit)}</td>
                    <td className="p-2 text-right text-emerald-800">{formatINR(bB?.netOperatingProfit)}</td>
                    <td className="p-2 text-right text-emerald-950 text-xs font-bold">{formatINR(consolidated.netOperatingProfit)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Working Capital Summary */}
              <div className="grid grid-cols-2 gap-4 text-[11px] font-mono pt-2">
                <div className="border border-slate-300 p-2.5 rounded bg-slate-50">
                  <div className="font-bold font-sans text-slate-800 border-b border-slate-200 pb-1 mb-1">
                    Current Assets &amp; Liquidity
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Cash in Hand:</span>
                    <span>{formatINR(balanceSheet.assets.currentAssets.cashInHand)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">HDFC Fleet Bank:</span>
                    <span>{formatINR(balanceSheet.assets.currentAssets.bankBalance)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Fastag Pool:</span>
                    <span>{formatINR(balanceSheet.assets.currentAssets.fastagWallet)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Client Freight Receivables:</span>
                    <span className="font-bold">{formatINR(balanceSheet.assets.currentAssets.clientReceivables)}</span>
                  </div>
                </div>

                <div className="border border-slate-300 p-2.5 rounded bg-slate-50">
                  <div className="font-bold font-sans text-slate-800 border-b border-slate-200 pb-1 mb-1">
                    Operating Liabilities
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Fuel Pump Credits:</span>
                    <span className="font-bold text-rose-700">{formatINR(balanceSheet.liabilities.currentLiabilities.fuelPumpCreditsPayable)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Unpaid Driver Salaries:</span>
                    <span>{formatINR(balanceSheet.liabilities.currentLiabilities.unpaidDriverSalaries)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Vehicle Loans Outstanding:</span>
                    <span>{formatINR(balanceSheet.liabilities.longTermLiabilities.vehicleLoansPayable)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-sans text-slate-600">Net Fleet Book Value:</span>
                    <span className="font-bold">{formatINR(balanceSheet.assets.fixedAssets.vehiclesNetBookValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. P&L REPORT */}
          {reportType === 'PL_STATEMENT' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="font-bold text-sm text-slate-900 border-b border-slate-400 pb-1 font-sans">
                INCOME STATEMENT (PROFIT &amp; LOSS) FOR THE PERIOD
              </div>

              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300 font-sans text-xs">
                    <th className="p-2">Particulars / Account Head</th>
                    <th className="p-2 text-right">{truckA?.plateNumber}</th>
                    <th className="p-2 text-right">{truckB?.plateNumber}</th>
                    <th className="p-2 text-right">Consolidated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="font-bold font-sans text-slate-600 bg-slate-50">
                    <td colSpan={4} className="p-1.5 uppercase text-[10px]">Revenue</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">Freight Billed (Bilties/LRs)</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.grossFreightRevenue)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.grossFreightRevenue)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.grossFreightRevenue)}</td>
                  </tr>
                  <tr className="font-bold bg-blue-50/50">
                    <td className="p-1.5 font-sans">TOTAL REVENUE (A)</td>
                    <td className="p-1.5 text-right text-blue-900">{formatINR(bA?.totalRevenue)}</td>
                    <td className="p-1.5 text-right text-blue-900">{formatINR(bB?.totalRevenue)}</td>
                    <td className="p-1.5 text-right font-bold text-blue-950">{formatINR(consolidated.totalRevenue)}</td>
                  </tr>

                  <tr className="font-bold font-sans text-slate-600 bg-slate-50">
                    <td colSpan={4} className="p-1.5 uppercase text-[10px]">Direct Trip Costs</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">Diesel Fuel</td>
                    <td className="p-1.5 text-right text-rose-700">{formatINR(bA?.dieselExpense)}</td>
                    <td className="p-1.5 text-right text-rose-700">{formatINR(bB?.dieselExpense)}</td>
                    <td className="p-1.5 text-right font-bold text-rose-800">{formatINR(consolidated.dieselExpense)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">Highway Fastag &amp; Toll</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.tollExpense)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.tollExpense)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.tollExpense)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">Driver Trip Bhatta</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.driverBhattaExpense)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.driverBhattaExpense)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.driverBhattaExpense)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">En-route Repairs &amp; Tyres</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.enrouteRepairsExpense)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.enrouteRepairsExpense)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.enrouteRepairsExpense)}</td>
                  </tr>
                  <tr className="font-bold bg-rose-50/50">
                    <td className="p-1.5 font-sans">TOTAL DIRECT COSTS (B)</td>
                    <td className="p-1.5 text-right text-rose-800">{formatINR(bA?.totalDirectExpenses)}</td>
                    <td className="p-1.5 text-right text-rose-800">{formatINR(bB?.totalDirectExpenses)}</td>
                    <td className="p-1.5 text-right font-bold text-rose-950">{formatINR(consolidated.totalDirectExpenses)}</td>
                  </tr>

                  <tr className="font-bold bg-slate-100">
                    <td className="p-2 font-sans">GROSS PROFIT (A - B)</td>
                    <td className="p-2 text-right text-emerald-800">{formatINR(bA?.grossOperatingProfit)}</td>
                    <td className="p-2 text-right text-emerald-800">{formatINR(bB?.grossOperatingProfit)}</td>
                    <td className="p-2 text-right font-bold text-emerald-950">{formatINR(consolidated.grossOperatingProfit)}</td>
                  </tr>

                  <tr className="font-bold font-sans text-slate-600 bg-slate-50">
                    <td colSpan={4} className="p-1.5 uppercase text-[10px]">Fixed Overheads</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">Driver Base Salary</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.driverBaseSalary)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.driverBaseSalary)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.driverBaseSalary)}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 pl-4 font-sans">Vehicle Loan Interest</td>
                    <td className="p-1.5 text-right">{formatINR(bA?.loanInterestExpense)}</td>
                    <td className="p-1.5 text-right">{formatINR(bB?.loanInterestExpense)}</td>
                    <td className="p-1.5 text-right font-bold">{formatINR(consolidated.loanInterestExpense)}</td>
                  </tr>
                  <tr className="font-bold bg-emerald-100 border-t-2 border-slate-900 text-xs">
                    <td className="p-2 font-sans">NET OPERATING PROFIT</td>
                    <td className="p-2 text-right text-emerald-800">{formatINR(bA?.netOperatingProfit)}</td>
                    <td className="p-2 text-right text-emerald-800">{formatINR(bB?.netOperatingProfit)}</td>
                    <td className="p-2 text-right font-bold text-emerald-950">{formatINR(consolidated.netOperatingProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 3. BALANCE SHEET REPORT */}
          {reportType === 'BALANCE_SHEET' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="font-bold text-sm text-slate-900 border-b border-slate-400 pb-1 font-sans flex justify-between">
                <span>TALLY BALANCE SHEET</span>
                <span className="text-xs font-normal">Status: Balanced (Assets = Liabilities + Equity)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Left: Liabilities & Equity */}
                <div className="border border-slate-300 p-3 rounded">
                  <div className="font-bold font-sans text-slate-900 border-b border-slate-300 pb-1 mb-2 text-xs">
                    CAPITAL &amp; LIABILITIES
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-sans">Proprietor Capital:</span>
                      <span>{formatINR(balanceSheet.equity.proprietorCapital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Retained Reserves:</span>
                      <span>{formatINR(balanceSheet.equity.retainedEarningsOpening)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span className="font-sans">Net Period Profit:</span>
                      <span>{formatINR(balanceSheet.equity.currentPeriodNetProfit)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="font-sans">Vehicle Loans Principal:</span>
                      <span>{formatINR(balanceSheet.liabilities.longTermLiabilities.vehicleLoansPayable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Fuel Pump Credits:</span>
                      <span className="text-rose-700 font-bold">{formatINR(balanceSheet.liabilities.currentLiabilities.fuelPumpCreditsPayable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Driver Salary Dues:</span>
                      <span>{formatINR(balanceSheet.liabilities.currentLiabilities.unpaidDriverSalaries)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-1 font-bold text-xs bg-slate-50 p-1">
                      <span className="font-sans">TOTAL LIABILITIES &amp; EQUITY:</span>
                      <span>{formatINR(balanceSheet.totalLiabilitiesAndEquity)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Assets */}
                <div className="border border-slate-300 p-3 rounded">
                  <div className="font-bold font-sans text-slate-900 border-b border-slate-300 pb-1 mb-2 text-xs">
                    ASSETS &amp; RESOURCES
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-sans">Commercial Vehicles Gross Block:</span>
                      <span>{formatINR(balanceSheet.assets.fixedAssets.vehiclesGrossValue)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span className="font-sans">Less: Depreciation:</span>
                      <span>-{formatINR(balanceSheet.assets.fixedAssets.accumulatedDepreciation)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                      <span className="font-sans">Net Vehicles Book Value:</span>
                      <span>{formatINR(balanceSheet.assets.fixedAssets.vehiclesNetBookValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Cash in Hand:</span>
                      <span>{formatINR(balanceSheet.assets.currentAssets.cashInHand)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">HDFC Current Account:</span>
                      <span>{formatINR(balanceSheet.assets.currentAssets.bankBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Fastag Wallet Pool:</span>
                      <span>{formatINR(balanceSheet.assets.currentAssets.fastagWallet)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Freight Receivables:</span>
                      <span className="font-bold text-blue-800">{formatINR(balanceSheet.assets.currentAssets.clientReceivables)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-1 font-bold text-xs bg-slate-50 p-1">
                      <span className="font-sans">TOTAL ENTERPRISE ASSETS:</span>
                      <span>{formatINR(balanceSheet.assets.totalAssets)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit signature section */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-[10px] text-slate-600 font-mono">
            <div>
              <div className="font-bold text-slate-800 font-sans">Prepared by:</div>
              <div>Fleet Accounting Desk</div>
              <div>FLEETLEDGER ERP System</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800 font-sans">Authorized Signature:</div>
              <div className="mt-4">_____________________________</div>
              <div>Fleet Managing Partner / Proprietor</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (no-print) */}
        <div className="px-5 py-3 bg-slate-100 rounded-b-lg border-t border-slate-300 flex justify-between items-center no-print">
          <span className="text-[11px] text-slate-500 font-mono">
            Optimized for standard A4 landscape or portrait print
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded border border-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

