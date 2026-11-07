import React, { useState } from 'react';
import {
  Truck,
  Fuel,
  Receipt,
  Scale,
  Calendar,
  AlertCircle,
  FileCheck,
  CreditCard,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { generateIncomeStatement } from '../../services/accountingEngine';
import { formatINR, formatPercent, formatDate, formatMT, formatKm } from '../../services/formatters';

interface TruckLedgerViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
}

export const TruckLedgerView: React.FC<TruckLedgerViewProps> = ({
  state,
  onOpenQuickVoucher,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>(
    state.vehicles[0]?.plateNumber || 'RJ-14-GB-1001'
  );

  const { breakdowns, consolidated } = generateIncomeStatement(
    state.journalEntries,
    state.vehicles
  );

  const selectedVehicle = state.vehicles.find(v => v.plateNumber === selectedPlate);
  const selectedDriver = selectedVehicle
    ? state.drivers.find(d => d.id === selectedVehicle.assignedDriverId)
    : null;

  const currentBreakdown = selectedPlate === 'TOTAL'
    ? consolidated
    : breakdowns[selectedPlate] || consolidated;

  // Filter transactions tagged specifically to this truck
  const vehicleEntries = state.journalEntries.filter(
    e => (selectedPlate === 'TOTAL' ? true : e.vehiclePlate === selectedPlate)
  ).sort((a, b) => a.date.localeCompare(b.date)); // chronological for ledger

  // Calculate days to expiry
  const getDaysRemaining = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const today = new Date();
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const insDays = selectedVehicle ? getDaysRemaining(selectedVehicle.insuranceExpiryDate) : 0;
  const permitDays = selectedVehicle ? getDaysRemaining(selectedVehicle.nationalPermitExpiryDate) : 0;

  return (
    <div className="space-y-4">
      {/* Truck Selection Tab Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Per-Truck Financial Ledger &amp; Operating P&amp;L</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual vehicle profit and loss statements, direct operating cost analysis, and running general ledger
          </p>
        </div>

        {/* Vehicle Selection Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-300 w-full sm:w-auto">
          {state.vehicles.map(v => (
            <button
              key={v.plateNumber}
              onClick={() => setSelectedPlate(v.plateNumber)}
              className={`px-3.5 py-2 min-h-[42px] text-xs sm:text-sm font-mono font-bold rounded transition-colors flex items-center justify-center w-full sm:w-auto whitespace-nowrap ${
                selectedPlate === v.plateNumber
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              {v.plateNumber}
            </button>
          ))}
          <button
            onClick={() => setSelectedPlate('TOTAL')}
            className={`px-3.5 py-2 min-h-[42px] text-xs sm:text-sm font-bold rounded transition-colors flex items-center justify-center w-full sm:w-auto whitespace-nowrap ${
              selectedPlate === 'TOTAL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Consolidated (Both)
          </button>
        </div>
      </div>

      {/* Vehicle Specification & Compliance Banner (If single truck selected) */}
      {selectedVehicle && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 text-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded font-mono font-bold text-sm">
                {selectedVehicle.plateNumber}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{selectedVehicle.model}</div>
                <div className="text-slate-500 text-[11px] font-mono">
                  GVWR: {selectedVehicle.gvwrMT} MT | Model Year: {selectedVehicle.year} | Odometer: {formatKm(selectedVehicle.currentOdometerKm)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700">
                <span className="text-slate-500 mr-1">Driver:</span>
                <span className="font-semibold text-slate-900">{selectedDriver?.fullName || 'Assigned'}</span>
              </div>
              <div className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700 font-mono">
                <span className="text-slate-500 mr-1">Fastag:</span>
                <span className="font-semibold text-slate-900">{selectedVehicle.fastagTagId.slice(-8)}</span>
              </div>
            </div>
          </div>

          {/* Asset & Financing Master Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500 block">Original Cost:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatINR(selectedVehicle.originalPurchaseCost)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Accumulated Depreciation:</span>
              <span className="font-mono font-bold text-rose-700">
                -{formatINR(selectedVehicle.accumulatedDepreciation)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Current Net Book Value:</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatINR(selectedVehicle.currentBookValue)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Loan Principal Due:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatINR(selectedVehicle.loanCurrentPrincipal)}
              </span>
              <span className="text-[10px] text-slate-400 block font-sans">
                EMI: {formatINR(selectedVehicle.monthlyEMI)} / mo
              </span>
            </div>
          </div>

          {/* Compliance & Permit Countdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Insurance Policy:</span>
                <span className="font-semibold text-slate-800">{selectedVehicle.insurancePolicyNumber}</span>
              </div>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                {insDays} days left
              </span>
            </div>

            <div className="p-2 rounded border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">National Permit:</span>
                <span className="font-semibold text-slate-800">{selectedVehicle.nationalPermitNumber}</span>
              </div>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                {permitDays} days left
              </span>
            </div>

            <div className="p-2 rounded border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Financier Bank:</span>
                <span className="font-semibold text-slate-800">{selectedVehicle.financierName.split(' ')[0]} Bank</span>
              </div>
              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Due: {selectedVehicle.emiDueDayOfMonth}th of month
              </span>
            </div>
          </div>
        </div>
      )}

      {/* P&L Performance Grid for Selected Truck */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
        <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
          <span>OPERATING PROFIT &amp; LOSS BREAKDOWN: {currentBreakdown.vehicleName}</span>
          <span className="text-xs font-mono font-normal text-slate-300">
            Accounting Basis: Direct Double-Entry Postings
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue & Direct Trip Costs */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between">
              <span>FREIGHT REVENUE &amp; INFLOWS</span>
              <span className="font-mono text-emerald-700">{formatINR(currentBreakdown.totalRevenue)}</span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Gross Freight Invoiced (Bilties/LRs):</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(currentBreakdown.grossFreightRevenue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Detention, Halting &amp; Other Income:</span>
                <span className="font-mono text-slate-700">{formatINR(currentBreakdown.detentionAndOtherIncome)}</span>
              </div>
            </div>

            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 pt-2 flex justify-between">
              <span>DIRECT TRIP OPERATING EXPENSES</span>
              <span className="font-mono text-rose-700">{formatINR(currentBreakdown.totalDirectExpenses)}</span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <div>
                  <span>Diesel Fuel:</span>
                  <span className="text-slate-400 font-mono text-[10px] ml-1">
                    ({currentBreakdown.dieselLiters} Liters)
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-700">{formatINR(currentBreakdown.dieselExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Highway Fastag &amp; Toll Plazas:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.tollExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Driver Trip Bhatta (Food Allowance):</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.driverBhattaExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>En-route Minor Repairs &amp; Punctures:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.enrouteRepairsExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Loading / Unloading Hamali:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.loadingHamaliExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>State Border Green Tax &amp; Entry:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.borderGreenTaxExpense)}</span>
              </div>
            </div>

            {/* Contribution Margin / Gross Operating Profit */}
            <div className="bg-slate-100 p-2.5 rounded border border-slate-300 flex justify-between items-center font-bold">
              <span className="text-slate-900">Gross Operating Profit (Contribution):</span>
              <div className="text-right">
                <span className="font-mono text-sm text-emerald-800 block">
                  {formatINR(currentBreakdown.grossOperatingProfit)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  Margin: {formatPercent(currentBreakdown.grossOperatingMarginPercent)}
                </span>
              </div>
            </div>
          </div>

          {/* Fixed Overheads & Net Operating Profit */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between">
              <span>FIXED ALLOCATED OVERHEADS</span>
              <span className="font-mono text-slate-800">{formatINR(currentBreakdown.totalFixedOverheads)}</span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Driver Base Monthly Salary:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.driverBaseSalary)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Vehicle Loan Finance Interest:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.loanInterestExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Vehicle Insurance &amp; Permit Amortization:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.insuranceAmortization)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Fleet GPS Tracking &amp; Mobile Admin:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.adminGpsExpense)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Monthly Vehicle Depreciation:</span>
                <span className="font-mono text-slate-800">{formatINR(currentBreakdown.depreciationExpense)}</span>
              </div>
            </div>

            {/* Final Net Operating Profit */}
            <div className="bg-emerald-50 p-3.5 rounded border border-emerald-300 space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-950 text-sm">Net Operating Profit:</span>
                <span className="font-mono font-bold text-emerald-800 text-lg">
                  {formatINR(currentBreakdown.netOperatingProfit)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-emerald-900 border-t border-emerald-200 pt-1.5">
                <span>Net Operating Margin %:</span>
                <span className="font-mono font-bold">
                  {formatPercent(currentBreakdown.netOperatingMarginPercent)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Fuel Cost Ratio (Target &lt; 50%):</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatPercent(currentBreakdown.totalRevenue > 0 ? (currentBreakdown.dieselExpense / currentBreakdown.totalRevenue) * 100 : 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Running Ledger of Transactions for this vehicle */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
        <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
          <span>RUNNING GENERAL LEDGER: {selectedPlate}</span>
          <span className="text-xs font-mono font-normal text-slate-300">
            {vehicleEntries.length} Transactions Tagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Voucher #</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Reference</th>
                <th className="py-2 px-3">Narration</th>
                <th className="py-2 px-3 text-right">Debit / Cost (₹)</th>
                <th className="py-2 px-3 text-right">Credit / Freight (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {vehicleEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">
                    No transactions recorded for {selectedPlate}.
                  </td>
                </tr>
              ) : (
                vehicleEntries.map(entry => {
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
                      <td className="py-2 px-3 font-sans text-slate-600 whitespace-nowrap">
                        {entry.voucherType}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {entry.referenceNumber || '-'}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-800 max-w-xs truncate">
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
  );
};

