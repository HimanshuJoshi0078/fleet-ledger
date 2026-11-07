import React, { useState } from 'react';
import {
  Users,
  Plus,
  Receipt,
  Building,
  CreditCard,
  FileCheck,
  Utensils,
  Phone,
  ShieldCheck,
  Calendar,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { DriverProfile } from '../../types/fleet';
import { calculateDriverLedger } from '../../services/accountingEngine';
import { formatINR, formatDate } from '../../services/formatters';

interface DriverHubViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onTriggerVoucherWithType: (type: any, driverId?: string) => void;
  onOpenAddDriver?: () => void;
}

export const DriverHubView: React.FC<DriverHubViewProps> = ({
  state,
  onOpenQuickVoucher,
  onTriggerVoucherWithType,
  onOpenAddDriver,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const activeDriverId = (selectedDriverId && state.drivers.some(d => d.id === selectedDriverId))
    ? selectedDriverId
    : (state.drivers[0]?.id || '');

  const selectedDriver = state.drivers.find(d => d.id === activeDriverId);
  const driverLedger = selectedDriver
    ? calculateDriverLedger(selectedDriver, state.journalEntries)
    : null;

  // Transactions linked to this driver
  const driverEntries = state.journalEntries.filter(
    e => e.driverId === activeDriverId
  ).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Driver Profiles &amp; Salary Settlement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial vehicle driver rosters, recoverable salary advances, trip fooding bhatta, and monthly net payouts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onOpenAddDriver && (
            <button
              onClick={onOpenAddDriver}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Commercial Driver</span>
            </button>
          )}

          <button
            onClick={onOpenQuickVoucher}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded border border-slate-700 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>New Driver Entry</span>
          </button>
        </div>
      </div>

      {/* Driver Select Tabs */}
      <div className="flex gap-2 border-b border-slate-300 pb-2 overflow-x-auto">
        {state.drivers.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDriverId(d.id)}
            className={`px-4 py-2 min-h-[42px] text-xs font-bold rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap ${
              selectedDriverId === d.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>{d.fullName}</span>
            <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-normal">
              {d.assignedPlateNumber}
            </span>
          </button>
        ))}
      </div>

      {/* Empty State: No Drivers Configured */}
      {state.drivers.length === 0 && (
        <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base">No Commercial Drivers Configured</div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Register commercial drivers to assign them to trucks, track monthly salary settlements, bhatta fooding allowances, and recoverable advances.
            </p>
          </div>
          {onOpenAddDriver && (
            <button
              onClick={onOpenAddDriver}
              className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Commercial Driver</span>
            </button>
          )}
        </div>
      )}

      {selectedDriver && driverLedger && (
        <div className="space-y-4">
          {/* Driver Master Profile Card */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 text-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedDriver.fullName}</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    Assigned: {selectedDriver.assignedPlateNumber}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                  Driving License: {selectedDriver.licenseNumber}
                </div>
              </div>

              {/* Action Buttons for this driver */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onTriggerVoucherWithType('DRIVER_ADVANCE', selectedDriver.id)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <Wallet className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Give Advance</span>
                </button>

                <button
                  onClick={() => onTriggerVoucherWithType('DRIVER_BHATTA', selectedDriver.id)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <Utensils className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Pay Bhatta</span>
                </button>

                <button
                  onClick={() => onTriggerVoucherWithType('SALARY_PAYMENT', selectedDriver.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Settle Salary</span>
                </button>
              </div>
            </div>

            {/* Contact & Terms Info */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">Phone Contact:</span>
                <span className="font-mono font-bold text-slate-800">{selectedDriver.contactNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Emergency Contact:</span>
                <span className="font-sans text-slate-800">{selectedDriver.emergencyContact}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Base Monthly Salary:</span>
                <span className="font-mono font-bold text-blue-700 text-xs">
                  {formatINR(selectedDriver.baseMonthlySalary)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Daily Fooding Bhatta:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatINR(selectedDriver.dailyBhattaRate)} / day
                </span>
              </div>
            </div>

            {/* Financial Ledger Balance Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Recoverable Advance Box */}
              <div className="bg-amber-50/50 p-3 rounded border border-amber-200 space-y-1">
                <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                  Driver Advance Position (Recoverable Asset)
                </div>
                <div className="font-mono text-lg font-bold text-amber-900">
                  {formatINR(driverLedger.netAdvancePending)}
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-amber-200 pt-1">
                  <div className="flex justify-between font-mono">
                    <span>Total Advance Given:</span>
                    <span>{formatINR(driverLedger.advancesGiven)}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Total Deducted in Salary:</span>
                    <span>-{formatINR(driverLedger.advancesDeducted)}</span>
                  </div>
                </div>
              </div>

              {/* Accrued Salary Payable Box */}
              <div className="bg-blue-50/50 p-3 rounded border border-blue-200 space-y-1">
                <div className="text-[11px] font-bold text-blue-950 uppercase tracking-wider">
                  Accrued Salary Balance (Current Liability)
                </div>
                <div className="font-mono text-lg font-bold text-blue-900">
                  {formatINR(driverLedger.netSalaryPayable)}
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-blue-200 pt-1">
                  <div className="flex justify-between font-mono">
                    <span>Monthly Salary Due:</span>
                    <span>{formatINR(driverLedger.salariesAccrued)}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Disbursed so far:</span>
                    <span>{formatINR(driverLedger.salariesPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Fooding Bhatta Box */}
              <div className="bg-emerald-50/50 p-3 rounded border border-emerald-200 space-y-1">
                <div className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                  Trip Fooding Bhatta Received
                </div>
                <div className="font-mono text-lg font-bold text-emerald-900">
                  {formatINR(driverLedger.bhattaTotalReceived)}
                </div>
                <div className="text-[11px] text-slate-600 border-t border-emerald-200 pt-1">
                  <span>En-route meal allowances paid out in cash against ongoing trips</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History for this driver */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
              <span>DRIVER TRANSACTION &amp; DISBURSEMENT HISTORY: {selectedDriver.fullName}</span>
              <span className="font-mono text-xs font-normal text-slate-300">
                {driverEntries.length} Recorded Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Voucher #</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 font-sans">Narration / Notes</th>
                    <th className="py-2 px-3 text-right">Debit / Given (₹)</th>
                    <th className="py-2 px-3 text-right">Credit / Cleared (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-sans font-medium">
                        No transactions recorded specifically for {selectedDriver.fullName}.
                      </td>
                    </tr>
                  ) : (
                    driverEntries.map(entry => {
                      const totalDr = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
                      const totalCr = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-700 whitespace-nowrap">
                            {entry.voucherNumber}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-300 font-sans">
                              {entry.voucherType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-800 max-w-sm truncate">
                            {entry.narration}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-rose-700 whitespace-nowrap">
                            {formatINR(totalDr)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
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
      )}
    </div>
  );
};
