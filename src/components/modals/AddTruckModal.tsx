import React, { useState } from 'react';
import {
  X,
  Truck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Building,
  CreditCard,
  FileCheck
} from 'lucide-react';
import { VehicleProfile } from '../../types/fleet';
import { isValidLicensePlate, normalizeLicensePlate, formatINR } from '../../services/formatters';

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTruck: (truck: VehicleProfile) => void;
  existingPlates: string[];
}

export const AddTruckModal: React.FC<AddTruckModalProps> = ({
  isOpen,
  onClose,
  onAddTruck,
  existingPlates,
}) => {
  if (!isOpen) return null;

  const [plateNumber, setPlateNumber] = useState<string>('');
  const [model, setModel] = useState<string>('Tata Signa 4825.T (16 Wheeler Multi-Axle)');
  const [gvwrMT, setGvwrMT] = useState<number>(43.5);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [originalPurchaseCost, setOriginalPurchaseCost] = useState<number>(4200000);
  const [accumulatedDepreciation, setAccumulatedDepreciation] = useState<number>(0);
  const [currentOdometerKm, setCurrentOdometerKm] = useState<number>(1000);

  // Financing / Loan
  const [hasLoan, setHasLoan] = useState<boolean>(true);
  const [financierName, setFinancierName] = useState<string>('HDFC Bank Transport Finance');
  const [loanAccountNumber, setLoanAccountNumber] = useState<string>('HDFC-CV-' + Math.floor(100000 + Math.random() * 900000));
  const [loanCurrentPrincipal, setLoanCurrentPrincipal] = useState<number>(2500000);
  const [monthlyEMI, setMonthlyEMI] = useState<number>(68000);
  const [emiDueDayOfMonth, setEmiDueDayOfMonth] = useState<number>(10);

  // Compliance
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState<string>('POL-' + Math.floor(1000000 + Math.random() * 9000000));
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>('2027-11-30');
  const [nationalPermitNumber, setNationalPermitNumber] = useState<string>('NP-RJ-' + Math.floor(1000 + Math.random() * 9000));
  const [nationalPermitExpiryDate, setNationalPermitExpiryDate] = useState<string>('2027-12-31');
  const [fitnessCertificateExpiryDate, setFitnessCertificateExpiryDate] = useState<string>('2027-10-31');
  const [fastagTagId, setFastagTagId] = useState<string>('34161FA8' + Math.floor(10000000 + Math.random() * 90000000));

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const formattedPlate = normalizeLicensePlate(plateNumber);
    if (!formattedPlate || !isValidLicensePlate(formattedPlate)) {
      setErrorMessage('Please enter a valid commercial vehicle license plate (e.g., RJ-14-EA-1234).');
      return;
    }

    if (existingPlates.map(p => p.toUpperCase()).includes(formattedPlate.toUpperCase())) {
      setErrorMessage(`Truck with license plate ${formattedPlate} already exists in fleet master.`);
      return;
    }

    if (originalPurchaseCost <= 0) {
      setErrorMessage('Initial capitalized asset value must be greater than zero.');
      return;
    }

    const currentBookValue = Math.max(0, originalPurchaseCost - accumulatedDepreciation);

    const newVehicle: VehicleProfile = {
      id: `TRUCK-${Date.now()}`,
      plateNumber: formattedPlate,
      model: model.trim() || 'Commercial Multi-Axle Truck',
      gvwrMT: Number(gvwrMT) || 40.0,
      year: Number(year) || new Date().getFullYear(),
      assignedDriverId: '',
      originalPurchaseCost: Number(originalPurchaseCost),
      accumulatedDepreciation: Number(accumulatedDepreciation) || 0,
      currentBookValue,
      financierName: hasLoan ? (financierName.trim() || 'Commercial Bank') : '',
      loanAccountNumber: hasLoan ? (loanAccountNumber.trim() || 'N/A') : '',
      loanOriginalPrincipal: hasLoan ? Number(loanCurrentPrincipal) : 0,
      loanCurrentPrincipal: hasLoan ? Number(loanCurrentPrincipal) : 0,
      monthlyEMI: hasLoan ? Number(monthlyEMI) : 0,
      emiDueDayOfMonth: hasLoan ? Number(emiDueDayOfMonth) : 1,
      insurancePolicyNumber: insurancePolicyNumber.trim() || 'N/A',
      insuranceExpiryDate: insuranceExpiryDate || '2027-12-31',
      nationalPermitNumber: nationalPermitNumber.trim() || 'N/A',
      nationalPermitExpiryDate: nationalPermitExpiryDate || '2027-12-31',
      fitnessCertificateExpiryDate: fitnessCertificateExpiryDate || '2027-12-31',
      fastagTagId: fastagTagId.trim() || 'N/A',
      currentOdometerKm: Number(currentOdometerKm) || 0,
      operationalStatus: 'IDLE',
      currentRoute: 'Depot / Yard',
    };

    onAddTruck(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base tracking-tight">ADD COMMERCIAL TRUCK TO FLEET</span>
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

          {/* Section 1: Identification & Model */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase tracking-wider text-slate-500">
              1. Vehicle Identification &amp; Specifications
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  License Plate Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. RJ-14-EA-1234"
                  value={plateNumber}
                  onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs uppercase bg-white focus:outline-none focus:border-blue-600 font-bold"
                />
                <span className="text-[10px] text-slate-500">Format: State Code - RTO - Series - Number</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Model &amp; Axle Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Signa 4825.T / Ashok Leyland 3520"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">GVWR (Gross Weight in MT)</label>
                <input
                  type="number"
                  step="0.5"
                  value={gvwrMT}
                  onChange={e => setGvwrMT(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Manufacturing Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value) || 2024)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Odometer (Km)</label>
                <input
                  type="number"
                  value={currentOdometerKm}
                  onChange={e => setCurrentOdometerKm(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Asset Book Value */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase tracking-wider text-slate-500">
              2. Fixed Asset Valuation (Tally Book Value)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Capitalized Acquisition Value (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  value={originalPurchaseCost}
                  onChange={e => setOriginalPurchaseCost(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold text-xs bg-white text-emerald-800"
                />
                <span className="text-[10px] text-slate-500">Initial gross truck block for balance sheet</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Accumulated Depreciation so far (₹)
                </label>
                <input
                  type="number"
                  value={accumulatedDepreciation}
                  onChange={e => setAccumulatedDepreciation(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
                <span className="text-[10px] text-slate-500">Leave 0 if brand new vehicle</span>
              </div>
            </div>
          </div>

          {/* Section 3: Financing / Loan Details */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                3. Vehicle Financing &amp; Loan Liability
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={hasLoan}
                  onChange={e => setHasLoan(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Vehicle is Financed (Active Loan)</span>
              </label>
            </div>

            {hasLoan && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Financier Bank / Institution</label>
                  <input
                    type="text"
                    value={financierName}
                    onChange={e => setFinancierName(e.target.value)}
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Loan Account Number</label>
                  <input
                    type="text"
                    value={loanAccountNumber}
                    onChange={e => setLoanAccountNumber(e.target.value)}
                    placeholder="e.g. HDFC-CV-882190"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Outstanding Principal Due (₹)</label>
                  <input
                    type="number"
                    value={loanCurrentPrincipal}
                    onChange={e => setLoanCurrentPrincipal(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Monthly EMI Amount (₹)</label>
                  <input
                    type="number"
                    value={monthlyEMI}
                    onChange={e => setMonthlyEMI(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">EMI Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={emiDueDayOfMonth}
                    onChange={e => setEmiDueDayOfMonth(parseInt(e.target.value) || 10)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fastag Tag ID</label>
                  <input
                    type="text"
                    value={fastagTagId}
                    onChange={e => setFastagTagId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Compliance Certificates */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase tracking-wider text-slate-500">
              4. RTO Compliance Expiry Dates
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={insuranceExpiryDate}
                  onChange={e => setInsuranceExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">National Permit Expiry Date</label>
                <input
                  type="date"
                  value={nationalPermitExpiryDate}
                  onChange={e => setNationalPermitExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Fitness Certificate Expiry Date</label>
                <input
                  type="date"
                  value={fitnessCertificateExpiryDate}
                  onChange={e => setFitnessCertificateExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-300">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500 shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Truck Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

