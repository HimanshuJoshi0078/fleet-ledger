import React, { useState } from 'react';
import {
  BookOpen,
  Filter,
  Search,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  Truck,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { JournalEntry, VoucherType } from '../../types/accounting';
import { formatINR, formatDate } from '../../services/formatters';

interface DaybookViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onDeleteEntry: (id: string) => void;
  onOpenBulkImport?: () => void;
  onOpenDailyEntry?: () => void;
}

export const DaybookView: React.FC<DaybookViewProps> = ({
  state,
  onOpenQuickVoucher,
  onDeleteEntry,
  onOpenBulkImport,
  onOpenDailyEntry,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = state.journalEntries.filter(entry => {
    if (selectedPlate !== 'ALL' && entry.vehiclePlate !== selectedPlate) return false;
    if (selectedType !== 'ALL' && entry.voucherType !== selectedType) return false;
    if (startDate && entry.date < startDate) return false;
    if (endDate && entry.date > endDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVoucher = entry.voucherNumber.toLowerCase().includes(q);
      const matchNarration = entry.narration.toLowerCase().includes(q);
      const matchRef = entry.referenceNumber?.toLowerCase().includes(q) || false;
      const matchPlate = entry.vehiclePlate.toLowerCase().includes(q);
      if (!matchVoucher && !matchNarration && !matchRef && !matchPlate) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Totals for filtered view
  const totalDebits = filteredEntries.reduce(
    (sum, e) => sum + e.lines.reduce((s, l) => s + (l.debit || 0), 0),
    0
  );
  const totalCredits = filteredEntries.reduce(
    (sum, e) => sum + e.lines.reduce((s, l) => s + (l.credit || 0), 0),
    0
  );

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Date', 'Voucher Number', 'Voucher Type', 'Vehicle Tag', 'Reference', 'Narration', 'Account Code', 'Account Name', 'Debit (INR)', 'Credit (INR)'];
    const rows: string[][] = [];

    for (const entry of filteredEntries) {
      for (const line of entry.lines) {
        rows.push([
          entry.date,
          `"${entry.voucherNumber}"`,
          `"${entry.voucherType}"`,
          `"${entry.vehiclePlate}"`,
          `"${entry.referenceNumber || ''}"`,
          `"${entry.narration.replace(/"/g, '""')}"`,
          `"${line.accountCode}"`,
          `"${line.accountName.replace(/"/g, '""')}"`,
          String(line.debit || 0),
          String(line.credit || 0),
        ]);
      }
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FleetLedger_Daybook_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const voucherTypeLabels: Record<string, string> = {
    FREIGHT_BILL: 'Freight Bill',
    DIESEL_SLIP: 'Diesel Slip',
    FASTAG_TOLL: 'Fastag Toll',
    FASTAG_RECHARGE: 'Fastag Recharge',
    DRIVER_BHATTA: 'Driver Bhatta',
    DRIVER_ADVANCE: 'Driver Advance',
    SALARY_ACCRUAL: 'Salary Accrual',
    SALARY_PAYMENT: 'Salary Settlement',
    MAINTENANCE_REPAIR: 'Repairs & Tyres',
    EMI_PAYMENT: 'Loan EMI',
    CLIENT_RECEIPT: 'Client Receipt',
    PUMP_SETTLEMENT: 'Pump Settlement',
    JOURNAL_ENTRY: 'Journal Voucher',
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Daily Daybook &amp; Transaction Journal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade double-entry transaction journal with per-truck tagging and balanced Dr/Cr ledger lines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded border border-slate-700 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenQuickVoucher}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Add Voucher</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Truck Selector */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Vehicle Tag</label>
            <select
              value={selectedPlate}
              onChange={e => setSelectedPlate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-slate-50"
            >
              <option value="ALL">All Vehicles &amp; Company</option>
              {state.vehicles.map(v => (
                <option key={v.plateNumber} value={v.plateNumber}>
                  {v.plateNumber} : {v.model.split('(')[0]}
                </option>
              ))}
              <option value="COMPANY">COMPANY (Consolidated Only)</option>
            </select>
          </div>

          {/* Voucher Type */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Voucher Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-slate-50"
            >
              <option value="ALL">All Voucher Types</option>
              <option value="FREIGHT_BILL">Freight Bill (LR)</option>
              <option value="DIESEL_SLIP">Diesel Fuel Slip</option>
              <option value="FASTAG_TOLL">Fastag Toll Deduction</option>
              <option value="FASTAG_RECHARGE">Fastag Recharge</option>
              <option value="DRIVER_BHATTA">Driver Bhatta (Fooding)</option>
              <option value="DRIVER_ADVANCE">Driver Advance</option>
              <option value="SALARY_PAYMENT">Salary Settlement</option>
              <option value="MAINTENANCE_REPAIR">Repairs &amp; Tyres</option>
              <option value="EMI_PAYMENT">Loan EMI</option>
              <option value="CLIENT_RECEIPT">Client Freight Receipt</option>
              <option value="PUMP_SETTLEMENT">Pump Settlement</option>
              <option value="JOURNAL_ENTRY">Manual Journal Voucher</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-slate-50"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-slate-50"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Search Narration / Ref</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Voucher #, LR, Pump..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded border border-slate-300 text-xs bg-slate-50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500 font-medium">Quick Filters:</span>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-2.5 py-1.5 min-h-[36px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            All Dates
          </button>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-2.5 py-1.5 min-h-[36px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date();
              const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
              setStartDate(firstDay);
              setEndDate('');
            }}
            className="px-2.5 py-1.5 min-h-[36px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            Current Month (Nov 2026)
          </button>
          <span className="text-slate-400 ml-auto font-mono">
            Showing {filteredEntries.length} of {state.journalEntries.length} records
          </span>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-[11px] border-b border-slate-800">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Vehicle Tag</th>
                <th className="py-2.5 px-3">Reference / Slip</th>
                <th className="py-2.5 px-3">Transaction Narration</th>
                <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                <th className="py-2.5 px-3 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                      <span className="text-slate-700 font-semibold text-sm">No transactions found</span>
                      <span className="text-xs text-slate-500 max-w-sm">
                        Use "Daily Sheet Entry", "Bulk Import / Sync", or "Add Voucher" to record real logistics activity.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const isExpanded = expandedRowId === entry.id;
                  const totalDr = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
                  const totalCr = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : entry.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-700" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {entry.voucherNumber}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                            {voucherTypeLabels[entry.voucherType] || entry.voucherType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap font-medium">
                          {entry.vehiclePlate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {entry.referenceNumber || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-sm truncate font-sans">
                          {entry.narration}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          {formatINR(totalDr)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {formatINR(totalCr)}
                        </td>
                        <td
                          className="py-2.5 px-3 text-center"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete voucher ${entry.voucherNumber}? This will reverse all ledger postings.`)) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Double-Entry Ledger Lines View */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-slate-300">
                          <td colSpan={10} className="p-3 pl-10">
                            <div className="bg-white rounded border border-slate-300 p-3 shadow-inner">
                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-200 pb-1.5">
                                <span>Double-Entry Postings (Tally Journal Lines)</span>
                                <span className="font-mono text-slate-500 font-normal">
                                  Balance Check: {totalDr === totalCr ? 'Strictly Balanced' : 'Imbalanced!'}
                                </span>
                              </div>

                              <table className="w-full text-left font-mono text-[11px] border-collapse">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-100 text-[10px]">
                                    <th className="py-1 px-2">Account Code</th>
                                    <th className="py-1 px-2">Account Head Description</th>
                                    <th className="py-1 px-2">Line Note / Detail</th>
                                    <th className="py-1 px-2 text-right">Debit (₹)</th>
                                    <th className="py-1 px-2 text-right">Credit (₹)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {entry.lines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="py-1.5 px-2 font-bold text-slate-700">
                                        {line.accountCode}
                                      </td>
                                      <td className="py-1.5 px-2 font-sans font-medium text-slate-900">
                                        {line.accountName}
                                      </td>
                                      <td className="py-1.5 px-2 font-sans text-slate-600">
                                        {line.notes || '-'}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-semibold text-rose-700">
                                        {line.debit > 0 ? formatINR(line.debit) : '-'}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-semibold text-emerald-700">
                                        {line.credit > 0 ? formatINR(line.credit) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-slate-300 font-bold bg-slate-50 text-slate-900">
                                    <td colSpan={3} className="py-1.5 px-2 text-right font-sans">
                                      Voucher Total:
                                    </td>
                                    <td className="py-1.5 px-2 text-right text-rose-700">
                                      {formatINR(totalDr)}
                                    </td>
                                    <td className="py-1.5 px-2 text-right text-emerald-700">
                                      {formatINR(totalCr)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>

                              {/* Additional metadata tags if available */}
                              {entry.metadata && (
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] font-mono text-slate-600">
                                  {entry.metadata.biltyNumber && (
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      Bilty: {entry.metadata.biltyNumber}
                                    </span>
                                  )}
                                  {entry.metadata.cargoWeightMT && (
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      Weight: {entry.metadata.cargoWeightMT} MT @ ₹{entry.metadata.freightRatePerMT}/MT
                                    </span>
                                  )}
                                  {entry.metadata.liters && (
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      Fuel: {entry.metadata.liters} Ltr @ ₹{entry.metadata.fuelRate}/Ltr
                                    </span>
                                  )}
                                  {entry.metadata.odometer && (
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      Odometer: {entry.metadata.odometer} km
                                    </span>
                                  )}
                                  {entry.metadata.tollPlazaName && (
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      Plaza: {entry.metadata.tollPlazaName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-mono font-bold text-slate-900 text-xs">
                  <td colSpan={7} className="py-2.5 px-3 text-right font-sans">
                    Total Transactions ({filteredEntries.length}):
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700">
                    {formatINR(totalDebits)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {formatINR(totalCredits)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

