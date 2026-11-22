import React, { useState } from 'react';
import {
  X,
  Truck,
  AlertTriangle,
  Building,
  CreditCard,
  FileCheck
} from 'lucide-react';
import { VehicleProfile, TruckStatus } from '../../types/fleet';
import { formatINR } from '../../services/formatters';

interface EditTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  truck: VehicleProfile | null;
  onSaveTruck: (updated: VehicleProfile) => void;
}

export const EditTruckModal: React.FC<EditTruckModalProps> = ({
  isOpen,
  onClose,
  truck,
  onSaveTruck,
}) => {
  if (!isOpen || !truck) return null;

  const currentStatus: TruckStatus =
    truck.status ||
    (truck.operationalStatus === 'DECOMMISSIONED'
      ? 'DECOMMISSIONED'
      : truck.operationalStatus === 'WORKSHOP' || truck.operationalStatus === 'MAINTENANCE'
      ? 'MAINTENANCE'
      : 'ACTIVE');

  const [status, setStatus] = useState<TruckStatus>(currentStatus);
  const [model, setModel] = useState<string>(truck.model);
  const [currentBookValue, setCurrentBookValue] = useState<number>(truck.currentBookValue);
  const [loanCurrentPrincipal, setLoanCurrentPrincipal] = useState<number>(truck.loanCurrentPrincipal);
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>(truck.insuranceExpiryDate || '');
  const [fitnessCertificateExpiryDate, setFitnessCertificateExpiryDate] = useState<string>(truck.fitnessCertificateExpiryDate || '');
  const [nationalPermitExpiryDate, setNationalPermitExpiryDate] = useState<string>(truck.nationalPermitExpiryDate || '');
  const [pucExpiryDate, setPucExpiryDate] = useState<string>(truck.pucExpiryDate || '');
  const [roadTaxExpiryDate, setRoadTaxExpiryDate] = useState<string>(truck.roadTaxExpiryDate || '');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!model.trim()) {
      setErrorMessage('Make and Model is required.');
      return;
    }

    const updated: VehicleProfile = {
      ...truck,
      model: model.trim(),
      operationalStatus: status,
      status,
      currentBookValue: Number(currentBookValue) || 0,
      loanCurrentPrincipal: Number(loanCurrentPrincipal) || 0,
      insuranceExpiryDate,
      fitnessCertificateExpiryDate,
      nationalPermitExpiryDate,
      pucExpiryDate: pucExpiryDate || undefined,
      roadTaxExpiryDate: roadTaxExpiryDate || undefined,
    };

    onSaveTruck(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <div>
              <span className="font-bold text-base tracking-tight">EDIT TRUCK DETAILS</span>
              <span className="ml-2 font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-blue-300 font-semibold border border-slate-700">
                {truck.plateNumber}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identification & Status */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Truck Profile &amp; Operational Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Make / Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                  placeholder="e.g. Tata Signa 4825.T"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TruckStatus)}
                  className={`w-full px-2.5 py-1.5 rounded border font-semibold text-xs ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : status === 'MAINTENANCE'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="ACTIVE">ACTIVE (Operational / Available)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Workshop / Inactive)</option>
                  <option value="DECOMMISSIONED">DECOMMISSIONED (Sold / Retired)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Valuation & Loan */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Asset Book Value &amp; Loan Liability</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Current Book Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={currentBookValue || ''}
                  onChange={e => setCurrentBookValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Current Asset: {formatINR(currentBookValue)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Loan Principal Remaining (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={loanCurrentPrincipal || ''}
                  onChange={e => setLoanCurrentPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Outstanding: {formatINR(loanCurrentPrincipal)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Document Renewal Expiry Dates */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>Transport &amp; RTO Compliance Expiry Dates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={insuranceExpiryDate}
                  onChange={e => setInsuranceExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Fitness Certificate Expiry</label>
                <input
                  type="date"
                  value={fitnessCertificateExpiryDate}
                  onChange={e => setFitnessCertificateExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">National/State Permit Expiry</label>
                <input
                  type="date"
                  value={nationalPermitExpiryDate}
                  onChange={e => setNationalPermitExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">PUC (Pollution) Expiry</label>
                <input
                  type="date"
                  value={pucExpiryDate}
                  onChange={e => setPucExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Road Tax Token Expiry</label>
                <input
                  type="date"
                  value={roadTaxExpiryDate}
                  onChange={e => setRoadTaxExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold min-h-[42px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm min-h-[42px] w-full sm:w-auto"
            >
              Save Truck Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
