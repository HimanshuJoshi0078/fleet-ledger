import React, { useState } from 'react';
import {
  Scale,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Truck,
  CreditCard,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { generateBalanceSheet, generateTrialBalance } from '../../services/accountingEngine';
import { formatINR, formatDate } from '../../services/formatters';

interface BalanceSheetViewProps {
  state: AppState;
  onOpenPrintReport: () => void;
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({
  state,
  onOpenPrintReport,
}) => {
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'BALANCE_SHEET' | 'TRIAL_BALANCE'>('BALANCE_SHEET');

  const balanceSheet = generateBalanceSheet(
    state.accounts,
    state.journalEntries,
    state.vehicles,
    asOfDate
  );

  const trialBalance = generateTrialBalance(
    state.accounts,
    state.journalEntries,
    { endDate: asOfDate }
  );

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTab === 'BALANCE_SHEET') {
      headers = ['Category', 'Particulars / Account Head', 'Amount (INR)'];
      rows = [
        ['CAPITAL & LIABILITIES', 'Proprietor Capital Account', balanceSheet.equity.proprietorCapital],
        ['CAPITAL & LIABILITIES', 'Retained Earnings (Reserves)', balanceSheet.equity.retainedEarningsOpening],
        ['CAPITAL & LIABILITIES', 'Current Period Net Operating Profit', balanceSheet.equity.currentPeriodNetProfit],
        ['CAPITAL & LIABILITIES', 'TOTAL OWNER EQUITY', balanceSheet.equity.totalEquity],
        ['LONG TERM LIABILITIES', 'Vehicle Loan: HDFC Bank (RJ-14-GB-1001)', balanceSheet.liabilities.longTermLiabilities.details[0]?.balance || 0],
        ['LONG TERM LIABILITIES', 'Vehicle Loan: ICICI Bank (RJ-14-GB-1002)', balanceSheet.liabilities.longTermLiabilities.details[1]?.balance || 0],
        ['LONG TERM LIABILITIES', 'TOTAL VEHICLE LOAN PRINCIPALS', balanceSheet.liabilities.longTermLiabilities.vehicleLoansPayable],
        ['CURRENT LIABILITIES', 'Fuel Pump Credits (IOCL & BPCL)', balanceSheet.liabilities.currentLiabilities.fuelPumpCreditsPayable],
        ['CURRENT LIABILITIES', 'Unpaid Driver Accrued Salaries', balanceSheet.liabilities.currentLiabilities.unpaidDriverSalaries],
        ['CURRENT LIABILITIES', 'Trade & Workshop Payables', balanceSheet.liabilities.currentLiabilities.workshopVendorPayables],
        ['CURRENT LIABILITIES', 'TOTAL CURRENT LIABILITIES', balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities],
        ['CAPITAL & LIABILITIES', 'TOTAL LIABILITIES & EQUITY', balanceSheet.totalLiabilitiesAndEquity],
        ['ASSETS', 'Commercial Vehicles Gross Block', balanceSheet.assets.fixedAssets.vehiclesGrossValue],
        ['ASSETS', 'Less: Accumulated Depreciation', -balanceSheet.assets.fixedAssets.accumulatedDepreciation],
        ['ASSETS', 'NET VEHICLE BOOK VALUE', balanceSheet.assets.fixedAssets.vehiclesNetBookValue],
        ['CURRENT ASSETS', 'Cash in Hand (Fleet Operational Cash)', balanceSheet.assets.currentAssets.cashInHand],
        ['CURRENT ASSETS', 'HDFC Bank Fleet Current Account', balanceSheet.assets.currentAssets.bankBalance],
        ['CURRENT ASSETS', 'Fastag Master Pool Wallet', balanceSheet.assets.currentAssets.fastagWallet],
        ['CURRENT ASSETS', 'Accounts Receivable (Client Freight Dues)', balanceSheet.assets.currentAssets.clientReceivables],
        ['CURRENT ASSETS', 'Driver Cash Advances Recoverable', balanceSheet.assets.currentAssets.driverAdvancesRecoverable],
        ['CURRENT ASSETS', 'TOTAL CURRENT ASSETS', balanceSheet.assets.currentAssets.totalCurrentAssets],
        ['ASSETS', 'TOTAL ASSETS', balanceSheet.assets.totalAssets],
      ];
    } else {
      headers = ['Account Code', 'Account Head', 'Category', 'Opening Balance', 'Debit Movement', 'Credit Movement', 'Closing Balance'];
      rows = trialBalance.items.map(i => [
        i.code,
        `"${i.name}"`,
        i.category,
        i.openingBalance,
        i.debitTotal,
        i.creditTotal,
        i.netBalance,
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FleetLedger_${activeTab}_${asOfDate}.csv`);
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
            <Scale className="w-5 h-5 text-blue-600" />
            <span>Balance Sheet &amp; General Ledger Audit</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tally-style dual balance sheet: Fixed assets, vehicle book value, working capital, and owner equity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab Toggle */}
          <div className="bg-slate-100 p-1 rounded border border-slate-300 flex text-xs">
            <button
              onClick={() => setActiveTab('BALANCE_SHEET')}
              className={`px-3 py-1 font-semibold rounded transition-colors ${
                activeTab === 'BALANCE_SHEET'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Balance Sheet
            </button>
            <button
              onClick={() => setActiveTab('TRIAL_BALANCE')}
              className={`px-3 py-1 font-semibold rounded transition-colors ${
                activeTab === 'TRIAL_BALANCE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Trial Balance
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenPrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded border border-blue-500 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Audit Balance Verification Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Financial Position As Of:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="px-2.5 py-1 rounded border border-slate-300 font-mono text-xs bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-3">
          {balanceSheet.isBalanced ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Double-Entry Balanced: Total Assets = Total Liabilities + Equity</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded font-mono font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Imbalance Detected: Difference of {formatINR(balanceSheet.difference)}</span>
            </div>
          )}
        </div>
      </div>

      {/* DUAL-COLUMN BALANCE SHEET VIEW */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT COLUMN: LIABILITIES & OWNER'S EQUITY */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
              <span>CAPITAL &amp; LIABILITIES</span>
              <span className="font-mono text-emerald-400 font-bold">
                {formatINR(balanceSheet.totalLiabilitiesAndEquity)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* 1. OWNER'S EQUITY & RESERVES */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  1. Capital &amp; Retained Earnings
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Proprietor Capital / Owner's Equity [3100]:</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheet.equity.proprietorCapital)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Retained Earnings (Opening Reserves) [3200]:</span>
                  <span className="text-slate-800">{formatINR(balanceSheet.equity.retainedEarningsOpening)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-emerald-800 font-medium">Add: Current Period Net Operating Profit:</span>
                  <span className="font-bold text-emerald-700">{formatINR(balanceSheet.equity.currentPeriodNetProfit)}</span>
                </div>

                <div className="flex justify-between py-1 bg-slate-50 px-2 rounded font-mono font-bold text-slate-900">
                  <span className="font-sans">Total Proprietor Equity:</span>
                  <span className="text-blue-900">{formatINR(balanceSheet.equity.totalEquity)}</span>
                </div>
              </div>

              {/* 2. LONG-TERM VEHICLE LOANS */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  2. Long-Term Vehicle Loans (Financing)
                </div>

                {balanceSheet.liabilities.longTermLiabilities.details.map((loan, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100 font-mono">
                    <div>
                      <span className="font-sans text-slate-700 block">{loan.plate} Loan Principal:</span>
                      <span className="font-sans text-[10px] text-slate-400">{loan.bank}</span>
                    </div>
                    <span className="text-slate-900 font-medium self-center">{formatINR(loan.balance)}</span>
                  </div>
                ))}

                <div className="flex justify-between py-1 bg-slate-50 px-2 rounded font-mono font-bold text-slate-900">
                  <span className="font-sans">Total Vehicle Loan Principals:</span>
                  <span>{formatINR(balanceSheet.liabilities.longTermLiabilities.vehicleLoansPayable)}</span>
                </div>
              </div>

              {/* 3. CURRENT LIABILITIES */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  3. Current Operating Liabilities &amp; Payables
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <div>
                    <span className="font-sans text-slate-700 block">Fuel Pump Credit Accounts:</span>
                    <span className="font-sans text-[10px] text-slate-400">Shri Ram (IOCL) + Karni Kripa (BPCL)</span>
                  </div>
                  <span className="font-bold text-rose-700 self-center">
                    {formatINR(balanceSheet.liabilities.currentLiabilities.fuelPumpCreditsPayable)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Accrued Driver Salaries Payable:</span>
                  <span className="text-slate-900">{formatINR(balanceSheet.liabilities.currentLiabilities.unpaidDriverSalaries)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Trade &amp; Workshop Repair Payables:</span>
                  <span className="text-slate-900">{formatINR(balanceSheet.liabilities.currentLiabilities.workshopVendorPayables)}</span>
                </div>

                <div className="flex justify-between py-1 bg-slate-50 px-2 rounded font-mono font-bold text-slate-900">
                  <span className="font-sans">Total Current Liabilities:</span>
                  <span className="text-rose-800">{formatINR(balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities)}</span>
                </div>
              </div>

              {/* TOTAL LIABILITIES & EQUITY */}
              <div className="bg-slate-900 text-white p-3 rounded font-mono font-bold flex justify-between items-center text-sm mt-4">
                <span className="font-sans">TOTAL CAPITAL &amp; LIABILITIES:</span>
                <span className="text-emerald-400">{formatINR(balanceSheet.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ASSETS & RESOURCES */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
              <span>ASSETS &amp; RESOURCES</span>
              <span className="font-mono text-emerald-400 font-bold">
                {formatINR(balanceSheet.assets.totalAssets)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* 1. FIXED ASSETS: COMMERCIAL VEHICLES */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  1. Fixed Assets (Commercial Vehicle Fleet)
                </div>

                {balanceSheet.assets.fixedAssets.details.map((v, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100 font-mono">
                    <div>
                      <span className="font-sans text-slate-700 block">{v.plate} Commercial Truck:</span>
                      <span className="font-sans text-[10px] text-slate-400">
                        Cost: {formatINR(v.gross, false)} | Dep: -{formatINR(v.dep, false)}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 self-center">{formatINR(v.net)}</span>
                  </div>
                ))}

                <div className="flex justify-between py-1 bg-slate-50 px-2 rounded font-mono font-bold text-slate-900">
                  <span className="font-sans">Net Fleet Book Value (Block):</span>
                  <span className="text-blue-900">{formatINR(balanceSheet.assets.fixedAssets.vehiclesNetBookValue)}</span>
                </div>
              </div>

              {/* 2. CURRENT ASSETS: CASH, BANK, RECEIVABLES */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  2. Current Assets &amp; Working Liquidity
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Cash in Hand (Fleet Petty &amp; En-route Cash) [1100]:</span>
                  <span className="font-bold text-emerald-700">{formatINR(balanceSheet.assets.currentAssets.cashInHand)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">HDFC Fleet Current Account (50200049281720) [1200]:</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheet.assets.currentAssets.bankBalance)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Fastag Master Central Pool Wallet (IDBI/NHAI) [1300]:</span>
                  <span className="font-semibold text-slate-900">{formatINR(balanceSheet.assets.currentAssets.fastagWallet)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <div>
                    <span className="font-sans text-slate-700 block">Accounts Receivable (Client Freight Dues) [1400]:</span>
                    <span className="font-sans text-[10px] text-slate-400">UltraTech, Wonder Cement, Tata Steel</span>
                  </div>
                  <span className="font-bold text-blue-700 self-center">
                    {formatINR(balanceSheet.assets.currentAssets.clientReceivables)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                  <span className="font-sans text-slate-700">Driver Personal Cash Advances (Recoverable) [1500]:</span>
                  <span className="text-slate-900">{formatINR(balanceSheet.assets.currentAssets.driverAdvancesRecoverable)}</span>
                </div>

                <div className="flex justify-between py-1 bg-slate-50 px-2 rounded font-mono font-bold text-slate-900">
                  <span className="font-sans">Total Current Assets:</span>
                  <span className="text-emerald-800">{formatINR(balanceSheet.assets.currentAssets.totalCurrentAssets)}</span>
                </div>
              </div>

              {/* TOTAL ASSETS */}
              <div className="bg-slate-900 text-white p-3 rounded font-mono font-bold flex justify-between items-center text-sm mt-4">
                <span className="font-sans">TOTAL ENTERPRISE ASSETS:</span>
                <span className="text-emerald-400">{formatINR(balanceSheet.assets.totalAssets)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRIAL BALANCE TAB */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
          <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
            <span>GENERAL LEDGER TRIAL BALANCE AS OF {formatDate(asOfDate)}</span>
            <span className="font-mono text-xs font-normal text-slate-300">
              {trialBalance.isBalanced ? 'Audit Status: In Perfect Balance' : 'Discrepancy Detected'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3 font-sans">Account Head</th>
                  <th className="py-2.5 px-3 font-sans">Category</th>
                  <th className="py-2.5 px-3 text-right">Opening Bal (₹)</th>
                  <th className="py-2.5 px-3 text-right">Dr Period (₹)</th>
                  <th className="py-2.5 px-3 text-right">Cr Period (₹)</th>
                  <th className="py-2.5 px-3 text-right">Closing Debit (₹)</th>
                  <th className="py-2.5 px-3 text-right">Closing Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.items.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-bold text-slate-700">{acc.code}</td>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-900">{acc.name}</td>
                    <td className="py-1.5 px-3 font-sans text-slate-500">{acc.category}</td>
                    <td className="py-1.5 px-3 text-right text-slate-700">{formatINR(acc.openingBalance)}</td>
                    <td className="py-1.5 px-3 text-right text-rose-700">{acc.debitTotal > 0 ? formatINR(acc.debitTotal) : '-'}</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">{acc.creditTotal > 0 ? formatINR(acc.creditTotal) : '-'}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-rose-800">
                      {acc.closingDebit > 0 ? formatINR(acc.closingDebit) : '-'}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-emerald-800">
                      {acc.closingCredit > 0 ? formatINR(acc.closingCredit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <td colSpan={6} className="py-2.5 px-3 text-right font-sans">
                    Grand Trial Balance Sum:
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-800">
                    {formatINR(trialBalance.totalDebits)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-800">
                    {formatINR(trialBalance.totalCredits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

