import React, { useState } from 'react';
import {
  Fuel,
  Plus,
  CreditCard,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { calculatePumpLedger } from '../../services/accountingEngine';
import { formatINR, formatPercent, formatDate } from '../../services/formatters';

interface FuelPumpHubViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onTriggerVoucherWithType: (type: any, pumpId?: string) => void;
}

export const FuelPumpHubView: React.FC<FuelPumpHubViewProps> = ({
  state,
  onOpenQuickVoucher,
  onTriggerVoucherWithType,
}) => {
  const [selectedPumpId, setSelectedPumpId] = useState<string>(
    state.pumps[0]?.id || ''
  );

  const selectedPump = state.pumps.find(p => p.id === selectedPumpId);
  const pumpLedger = selectedPump
    ? calculatePumpLedger(selectedPump, state.journalEntries)
    : null;

  // Transactions tagged to this pump
  const pumpEntries = state.journalEntries.filter(
    e => e.pumpId === selectedPumpId
  ).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            <span>Fuel Pump Credit Accounts &amp; Diesel Statements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit reconciliation ledgers with IOCL / BPCL dealers, diesel slip receipts, and payment settlements
          </p>
        </div>

        <button
          onClick={() => onTriggerVoucherWithType('DIESEL_SLIP', selectedPumpId)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>New Fuel Slip</span>
        </button>
      </div>

      {/* Pump Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-300 pb-2 overflow-x-auto">
        {state.pumps.map(p => {
          const ldg = calculatePumpLedger(p, state.journalEntries);
          const isSelected = selectedPumpId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPumpId(p.id)}
              className={`px-4 py-2 min-h-[42px] text-xs font-bold rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Fuel className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{p.pumpName.split('(')[0]}</span>
              <span className="font-mono text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-normal">
                {p.oilCompany}
              </span>
            </button>
          );
        })}
      </div>

      {selectedPump && pumpLedger && (
        <div className="space-y-4">
          {/* Pump Master Card */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 text-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedPump.pumpName}</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    {selectedPump.oilCompany} Authorized Dealership
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedPump.location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onTriggerVoucherWithType('DIESEL_SLIP', selectedPump.id)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>Add Fuel Slip</span>
                </button>

                <button
                  onClick={() => onTriggerVoucherWithType('PUMP_SETTLEMENT', selectedPump.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span>Pay Pump Credit</span>
                </button>
              </div>
            </div>

            {/* Credit Limit & Outstanding Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">Credit Limit Allowed:</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {formatINR(selectedPump.creditLimit)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Current Outstanding Due:</span>
                <span className="font-mono font-bold text-rose-700 text-xs">
                  {formatINR(pumpLedger.currentBalance)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Total Diesel Supplied:</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {pumpLedger.litersSupplied} Liters ({formatINR(pumpLedger.totalFuelCredited)})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Payments Settled:</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  {formatINR(pumpLedger.totalPaymentsSettled)}
                </span>
              </div>
            </div>

            {/* Credit Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                <span>Credit Utilization:</span>
                <span className="font-bold text-slate-800">
                  {formatPercent((pumpLedger.currentBalance / selectedPump.creditLimit) * 100)} of limit
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (pumpLedger.currentBalance / selectedPump.creditLimit) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Pump Slips and Payments Table */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
              <span>FUEL SLIPS &amp; SETTLEMENT LEDGER: {selectedPump.pumpName}</span>
              <span className="font-mono text-xs font-normal text-slate-300">
                {pumpEntries.length} Transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Voucher #</th>
                    <th className="py-2 px-3">Slip Reference</th>
                    <th className="py-2 px-3">Vehicle</th>
                    <th className="py-2 px-3 font-sans">Narration</th>
                    <th className="py-2 px-3 text-right">Liters</th>
                    <th className="py-2 px-3 text-right">Fuel Debited (₹)</th>
                    <th className="py-2 px-3 text-right">Payment Settled (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pumpEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 font-sans font-medium">
                        No transactions recorded for this petrol pump.
                      </td>
                    </tr>
                  ) : (
                    pumpEntries.map(entry => {
                      const isFuelSlip = entry.voucherType === 'DIESEL_SLIP';
                      const isSettlement = entry.voucherType === 'PUMP_SETTLEMENT';
                      const fuelAmount = entry.lines.find(l => l.accountCode.startsWith('510'))?.debit || 0;
                      const paidAmount = entry.lines.find(l => l.accountCode.startsWith('220'))?.debit || 0;

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-700 whitespace-nowrap">
                            {entry.voucherNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-800 whitespace-nowrap">
                            {entry.referenceNumber || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-medium whitespace-nowrap">
                            {entry.vehiclePlate}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-800 max-w-xs truncate">
                            {entry.narration}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 whitespace-nowrap">
                            {entry.metadata?.liters ? `${entry.metadata.liters} L` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-rose-700 whitespace-nowrap">
                            {isFuelSlip ? formatINR(fuelAmount) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            {isSettlement ? formatINR(paidAmount) : '-'}
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

