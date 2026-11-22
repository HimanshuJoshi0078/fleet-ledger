import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  Building,
  Phone,
  MapPin,
  Calendar,
  FileText,
  DollarSign
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { Client } from '../../types/fleet';
import { calculateClientLedger } from '../../services/accountingEngine';
import { formatINR, formatMT, formatDate } from '../../services/formatters';
import { AddClientModal } from '../modals/AddClientModal';

interface ClientBiltyHubViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onTriggerVoucherWithType: (type: any, clientId?: string) => void;
  onAddClient?: (client: Client) => void;
}

export const ClientBiltyHubView: React.FC<ClientBiltyHubViewProps> = ({
  state,
  onOpenQuickVoucher,
  onTriggerVoucherWithType,
  onAddClient,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    state.clients[0]?.id || ''
  );
  const [isAddClientOpen, setIsAddClientOpen] = useState<boolean>(false);

  const effectiveClientId = selectedClientId && state.clients.some(c => c.id === selectedClientId)
    ? selectedClientId
    : (state.clients[0]?.id || '');

  const selectedClient = state.clients.find(c => c.id === effectiveClientId);
  const clientLedger = selectedClient
    ? calculateClientLedger(selectedClient, state.journalEntries)
    : null;

  // Transactions linked to this client
  const clientEntries = state.journalEntries.filter(
    e => e.clientId === effectiveClientId || (e.metadata?.clientName && selectedClient && e.metadata.clientName.toLowerCase() === (selectedClient.name || selectedClient.clientName || '').toLowerCase())
  ).sort((a, b) => b.date.localeCompare(a.date));

  const handleAddNewClient = (newClient: Client) => {
    if (onAddClient) {
      onAddClient(newClient);
    }
    setSelectedClientId(newClient.id);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Clients &amp; Freight Bilties (LR Receivable Ledger)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consignor accounts receivable, lorry receipt (LR) dispatches, tonnages, and payment collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded border border-slate-700 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>+ Add Client</span>
          </button>

          <button
            onClick={() => onTriggerVoucherWithType('FREIGHT_BILL', effectiveClientId)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>New Freight Bilty (LR)</span>
          </button>
        </div>
      </div>

      {/* Client / Party Summary Cards Grid */}
      {state.clients.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-300 p-8 text-center space-y-3">
          <Building className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Consignor / Client Accounts Registered</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add your consignor companies, brokers, or freight parties to manage lorry receipts (LR), billing, and outstanding receivables.
          </p>
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Client Party</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.clients.map(c => {
            const ldg = calculateClientLedger(c, state.journalEntries);
            const isSelected = effectiveClientId === c.id;
            const cName = c.name || c.clientName || 'Consignor Party';

            return (
              <div
                key={c.id}
                className={`bg-white rounded-lg border transition-all p-3.5 space-y-3 ${
                  isSelected
                    ? 'border-blue-600 shadow-md ring-1 ring-blue-500/20'
                    : 'border-slate-300 shadow-sm hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{cName}</span>
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {c.city && <span>{c.city}</span>}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </div>
                  {c.gstin && (
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                      {c.gstin}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-center font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-sans">Billed</span>
                    <span className="font-bold text-slate-800">{formatINR(ldg.totalFreightBilled)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-sans">Received</span>
                    <span className="font-bold text-emerald-700">{formatINR(ldg.totalPaymentsCollected)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-sans">Balance Due</span>
                    <span className="font-bold text-rose-700">{formatINR(ldg.currentBalance)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedClientId(c.id)}
                    className={`flex-1 py-1.5 px-2.5 rounded text-xs font-semibold border transition-colors min-h-[38px] ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? 'Viewing Ledger' : 'View Ledger'}
                  </button>
                  <button
                    onClick={() => onTriggerVoucherWithType('CLIENT_RECEIPT', c.id)}
                    className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold border border-blue-500 shadow-sm transition-colors min-h-[38px] flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Payment Receipt</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedClient && clientLedger && (
        <div className="space-y-4">
          {/* Client Master Profile Card */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 text-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedClient.name || selectedClient.clientName}</span>
                  {selectedClient.gstin && (
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      GSTIN: {selectedClient.gstin}
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                  {selectedClient.city && (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedClient.city}</span>
                      <span>|</span>
                    </>
                  )}
                  {selectedClient.phone && (
                    <>
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedClient.contactPerson ? `${selectedClient.contactPerson} (${selectedClient.phone})` : selectedClient.phone}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onTriggerVoucherWithType('FREIGHT_BILL', selectedClient.id)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>Create Bilty (LR)</span>
                </button>

                <button
                  onClick={() => onTriggerVoucherWithType('CLIENT_RECEIPT', selectedClient.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Record Payment Receipt</span>
                </button>
              </div>
            </div>

            {/* Financial Ledger Balance Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">Opening Freight Balance:</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {formatINR(clientLedger.openingBalance)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Total Freight Invoiced:</span>
                <span className="font-mono font-bold text-blue-700 text-xs">
                  {formatINR(clientLedger.totalFreightBilled)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Payments Collected:</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  {formatINR(clientLedger.totalPaymentsCollected)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Current Outstanding Due:</span>
                <span className="font-mono font-bold text-rose-700 text-xs">
                  {formatINR(clientLedger.currentBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Bilties and Payment History */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-3 font-semibold flex items-center justify-between">
              <span>FREIGHT BILTIES &amp; PAYMENT RECEIPTS: {selectedClient.name || selectedClient.clientName}</span>
              <span className="font-mono text-xs font-normal text-slate-300">
                {clientEntries.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Voucher #</th>
                    <th className="py-2 px-3">LR / Bilty #</th>
                    <th className="py-2 px-3">Vehicle</th>
                    <th className="py-2 px-3 font-sans">Route &amp; Cargo Details</th>
                    <th className="py-2 px-3 text-right">Cargo (MT)</th>
                    <th className="py-2 px-3 text-right">Freight Invoiced (₹)</th>
                    <th className="py-2 px-3 text-right">Payment Received (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 font-sans font-medium">
                        No transactions recorded for this client.
                      </td>
                    </tr>
                  ) : (
                    clientEntries.map(entry => {
                      const isFreightBill = entry.voucherType === 'FREIGHT_BILL';
                      const isReceipt = entry.voucherType === 'CLIENT_RECEIPT';
                      const freightAmount = entry.lines.find(l => l.accountCode.startsWith('41'))?.credit || 0;
                      const paidAmount = entry.lines.find(l => l.accountCode === '1400')?.credit || 0;

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-700 whitespace-nowrap">
                            {entry.voucherNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-800 whitespace-nowrap">
                            {entry.referenceNumber || entry.metadata?.biltyNumber || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-medium whitespace-nowrap">
                            {entry.vehiclePlate}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-800 max-w-xs truncate">
                            {entry.narration}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 whitespace-nowrap">
                            {entry.metadata?.cargoWeightMT ? formatMT(entry.metadata.cargoWeightMT) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-blue-800 whitespace-nowrap">
                            {isFreightBill ? formatINR(freightAmount) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            {isReceipt ? formatINR(paidAmount) : '-'}
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

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddNewClient}
        existingClients={state.clients}
      />
    </div>
  );
};
