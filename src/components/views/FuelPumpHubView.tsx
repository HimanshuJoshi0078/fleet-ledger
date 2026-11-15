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
import { JournalEntry } from '../../types/accounting';
import { calculatePumpLedger, calculateFleetFuelMileage } from '../../services/accountingEngine';
import { formatINR, formatPercent, formatDate, generateNextVoucherNumber } from '../../services/formatters';

interface FuelPumpHubViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onTriggerVoucherWithType: (type: any, pumpId?: string) => void;
  onSaveEntry?: (entry: JournalEntry) => void;
}

export const FuelPumpHubView: React.FC<FuelPumpHubViewProps> = ({
  state,
  onOpenQuickVoucher,
  onTriggerVoucherWithType,
  onSaveEntry,
}) => {
  const [selectedPumpId, setSelectedPumpId] = useState<string>(
    state.pumps[0]?.id || ''
  );

  // Quick Slip Inline Entry State
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickPlate, setQuickPlate] = useState(state.vehicles[0]?.plateNumber || '');
  const [quickLiters, setQuickLiters] = useState<number>(0);
  const [quickRate, setQuickRate] = useState<number>(90.5);
  const [quickOdometer, setQuickOdometer] = useState<string>('');
  const [quickPaymentMode, setQuickPaymentMode] = useState<'CREDIT' | 'CASH' | 'BANK'>('CREDIT');
  const [quickSlipNo, setQuickSlipNo] = useState<string>('');

  const selectedPump = state.pumps.find(p => p.id === selectedPumpId);
  const pumpLedger = selectedPump
    ? calculatePumpLedger(selectedPump, state.journalEntries)
    : null;

  const mileageMetrics = calculateFleetFuelMileage(state.journalEntries);

  // Transactions tagged to this pump
  const pumpEntries = state.journalEntries.filter(
    e => e.pumpId === selectedPumpId
  ).sort((a, b) => b.date.localeCompare(a.date));

  const handleQuickSlipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPump || quickLiters <= 0) return;

    const truckIndex = state.vehicles.findIndex(v => v.plateNumber === quickPlate);
    const safeIndex = truckIndex >= 0 ? truckIndex : 0;
    const suffix = String(safeIndex + 1).padStart(2, '0');
    const totalAmount = Math.round(quickLiters * quickRate * 100) / 100;

    const voucherNumber = generateNextVoucherNumber('DS', state.journalEntries.length + 1);
    const fuelExpCode = `51${suffix}`;
    const crCode =
      quickPaymentMode === 'CASH'
        ? '1100'
        : quickPaymentMode === 'BANK'
        ? '1200'
        : selectedPump.id === 'PUMP-01'
        ? '2201'
        : selectedPump.id === 'PUMP-02'
        ? '2202'
        : `22${suffix}`;

    const crName =
      quickPaymentMode === 'CASH'
        ? 'Cash in Hand (Fleet Operational Cash)'
        : quickPaymentMode === 'BANK'
        ? 'Bank Fleet Current A/c'
        : `Fuel Credit Payable (${selectedPump.pumpName})`;

    const newEntry: JournalEntry = {
      id: `VR-${Date.now()}-PUMP-FUEL`,
      voucherNumber,
      date: quickDate,
      voucherType: 'DIESEL_SLIP',
      vehiclePlate: quickPlate,
      pumpId: selectedPump.id,
      referenceNumber: quickSlipNo || undefined,
      narration: `Diesel fuel filled for ${quickPlate}: ${quickLiters} Ltr @ ₹${quickRate}/Ltr at ${selectedPump.pumpName} [${quickPaymentMode}]`,
      lines: [
        {
          accountCode: fuelExpCode,
          accountName: `Diesel Fuel Expense: ${quickPlate}`,
          debit: totalAmount,
          credit: 0,
          notes: `${quickLiters} Liters @ Rs ${quickRate}/Ltr`,
        },
        {
          accountCode: crCode,
          accountName: crName,
          debit: 0,
          credit: totalAmount,
          notes: `Payment Mode: ${quickPaymentMode}`,
        },
      ],
      metadata: {
        liters: quickLiters,
        fuelRate: quickRate,
        odometer: quickOdometer ? Number(quickOdometer) : undefined,
      },
      createdAt: new Date().toISOString(),
    };

    if (onSaveEntry) {
      onSaveEntry(newEntry);
    }
    setQuickLiters(0);
    setQuickOdometer('');
    setQuickSlipNo('');
    setIsQuickEntryOpen(false);
  };

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
          onClick={() => setIsQuickEntryOpen(prev => !prev)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>{isQuickEntryOpen ? 'Close Slip Form' : 'New Fuel Slip'}</span>
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
                  onClick={() => setIsQuickEntryOpen(prev => !prev)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>{isQuickEntryOpen ? 'Hide Entry Form' : 'Add Fuel Slip'}</span>
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

          {/* Direct Fuel Slip Entry Form */}
          {isQuickEntryOpen && (
            <div className="bg-white rounded-lg border border-amber-300 shadow-sm p-4 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span>Direct Fuel Slip Entry : {selectedPump.pumpName}</span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-700">
                  Total Fuel: {formatINR(quickLiters * quickRate)}
                </span>
              </div>

              <form onSubmit={handleQuickSlipSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                  <div>
                    <label className="block text-slate-700 text-[11px] mb-0.5">Date</label>
                    <input
                      type="date"
                      value={quickDate}
                      onChange={e => setQuickDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[11px] mb-0.5">Commercial Truck</label>
                    <select
                      value={quickPlate}
                      onChange={e => setQuickPlate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                      required
                    >
                      {state.vehicles.map(v => (
                        <option key={v.plateNumber} value={v.plateNumber}>
                          {v.plateNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[11px] mb-0.5">Liters Pumped</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={quickLiters || ''}
                      onChange={e => setQuickLiters(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[11px] mb-0.5">Rate / Liter (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={quickRate}
                      onChange={e => setQuickRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[11px] mb-0.5">Odometer (KM)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="e.g. 148500"
                      value={quickOdometer}
                      onChange={e => setQuickOdometer(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[11px] mb-0.5">Payment Mode</label>
                    <select
                      value={quickPaymentMode}
                      onChange={e => setQuickPaymentMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                    >
                      <option value="CREDIT">Pump Credit (Payable to Pump)</option>
                      <option value="CASH">Cash in Hand</option>
                      <option value="BANK">Bank Transfer / Card</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="Slip / Receipt # (optional, e.g. SLIP-84920)"
                    value={quickSlipNo}
                    onChange={e => setQuickSlipNo(e.target.value)}
                    className="w-full sm:w-72 px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsQuickEntryOpen(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs min-h-[38px] w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs min-h-[38px] w-full sm:w-auto"
                    >
                      Save Fuel Slip
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

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
                    <th className="py-2 px-3 text-right">Liters / Mileage</th>
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
                      const mileageMetric = mileageMetrics.metricsByEntryId[entry.id];

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
                            {entry.metadata?.liters ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-semibold">{entry.metadata.liters} L</span>
                                {mileageMetric?.kmpl ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    {mileageMetric.kmpl.toFixed(2)} KMPL
                                  </span>
                                ) : entry.metadata?.odometer ? (
                                  <span className="font-mono text-[9px] text-slate-400">
                                    {entry.metadata.odometer} KM
                                  </span>
                                ) : null}
                              </div>
                            ) : '-'}
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

