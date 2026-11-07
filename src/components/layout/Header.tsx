import React from 'react';
import {
  Truck,
  Plus,
  Printer,
  RotateCcw,
  Download,
  Upload,
  AlertCircle,
  Building,
  CreditCard,
  Wallet,
  Receipt,
  FileCheck
} from 'lucide-react';
import { formatINR } from '../../services/formatters';
import { AppState } from '../../services/storage';

interface HeaderProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onOpenPrintReport: () => void;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onOpenQuickVoucher,
  onOpenPrintReport,
  onOpenBackupModal,
}) => {
  // Compute top bar quick balances
  const cashAcc = state.accounts.find(a => a.code === '1100');
  const bankAcc = state.accounts.find(a => a.code === '1200');
  const fastagAcc = state.accounts.find(a => a.code === '1300');
  const recAcc = state.accounts.find(a => a.code === '1400');
  const pumpCreditAccs = state.accounts.filter(a => a.code === '2201' || a.code === '2202');

  // Compute live movements
  const getNetBalance = (code: string, normalDebit: boolean, initialBal: number) => {
    let debits = 0;
    let credits = 0;
    for (const e of state.journalEntries) {
      for (const l of e.lines) {
        if (l.accountCode === code) {
          debits += l.debit || 0;
          credits += l.credit || 0;
        }
      }
    }
    return normalDebit ? initialBal + debits - credits : initialBal + credits - debits;
  };

  const cashBalance = getNetBalance('1100', true, cashAcc?.openingBalance || 0);
  const bankBalance = getNetBalance('1200', true, bankAcc?.openingBalance || 0);
  const fastagBalance = getNetBalance('1300', true, fastagAcc?.openingBalance || 0);
  const receivablesBalance = getNetBalance('1400', true, recAcc?.openingBalance || 0);

  const pump1Balance = getNetBalance('2201', false, pumpCreditAccs.find(a => a.code === '2201')?.openingBalance || 0);
  const pump2Balance = getNetBalance('2202', false, pumpCreditAccs.find(a => a.code === '2202')?.openingBalance || 0);
  const totalPumpCredit = pump1Balance + pump2Balance;

  const isFastagLow = fastagBalance < 5000;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold border border-blue-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">FLEETLEDGER ERP</span>
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded font-mono border border-slate-700">
                  FY 2026-27
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Double-Entry Transport &amp; Fleet Accounting System: 2-Truck Unit
              </p>
            </div>
          </div>

          {/* Quick Financial Indicators Bar */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700">
              <div className="text-slate-400 flex items-center gap-1 font-medium">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cash in Hand</span>
              </div>
              <div className="font-mono font-semibold text-emerald-400 text-sm">
                {formatINR(cashBalance)}
              </div>
            </div>

            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700">
              <div className="text-slate-400 flex items-center gap-1 font-medium">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>HDFC Fleet Bank</span>
              </div>
              <div className="font-mono font-semibold text-slate-100 text-sm">
                {formatINR(bankBalance)}
              </div>
            </div>

            <div className={`px-2.5 py-1.5 rounded border ${isFastagLow ? 'bg-amber-950/40 border-amber-600 text-amber-200' : 'bg-slate-800/80 border-slate-700 text-slate-100'}`}>
              <div className="flex items-center gap-1 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Fastag Wallet</span>
                {isFastagLow && (
                  <span className="text-[10px] bg-amber-600 text-black px-1 rounded font-bold uppercase ml-1">
                    Low
                  </span>
                )}
              </div>
              <div className="font-mono font-semibold text-sm">
                {formatINR(fastagBalance)}
              </div>
            </div>

            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700">
              <div className="text-slate-400 flex items-center gap-1 font-medium">
                <Receipt className="w-3.5 h-3.5 text-sky-400" />
                <span>Client Receivables</span>
              </div>
              <div className="font-mono font-semibold text-sky-300 text-sm">
                {formatINR(receivablesBalance)}
              </div>
            </div>

            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700">
              <div className="text-slate-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Pump Credit Dues</span>
              </div>
              <div className="font-mono font-semibold text-rose-300 text-sm">
                {formatINR(totalPumpCredit)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQuickVoucher}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 rounded flex items-center gap-1.5 transition-colors border border-blue-500 shadow-sm active:translate-y-0.5"
              title="Record any trip transaction or double-entry voucher"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Voucher</span>
              <span className="sm:hidden">Entry</span>
            </button>

            <button
              onClick={onOpenPrintReport}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 sm:px-3 py-2 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Generate printable statement"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Print Report</span>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 sm:px-3 py-2 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Export, import, or reset ledger state"
            >
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline">Data / Backup</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

