import React, { useState } from 'react';
import {
  Truck,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Shield,
  CreditCard,
  FileCheck,
  Fuel,
  Wrench
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { VehicleProfile } from '../../types/fleet';
import { formatINR, formatKm, formatDate } from '../../services/formatters';

interface FleetMasterViewProps {
  state: AppState;
  onOpenQuickVoucher: () => void;
  onUpdateVehicle: (vehicle: VehicleProfile) => void;
  onOpenAddTruck?: () => void;
}

export const FleetMasterView: React.FC<FleetMasterViewProps> = ({
  state,
  onOpenQuickVoucher,
  onUpdateVehicle,
  onOpenAddTruck,
}) => {
  const [editingPlate, setEditingPlate] = useState<string | null>(null);
  const [editOdometer, setEditOdometer] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<any>('ACTIVE_TRIP');
  const [editRoute, setEditRoute] = useState<string>('');

  const getDaysRemaining = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const today = new Date();
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleStartEdit = (v: VehicleProfile) => {
    setEditingPlate(v.plateNumber);
    setEditOdometer(v.currentOdometerKm);
    setEditStatus(v.operationalStatus);
    setEditRoute(v.currentRoute || '');
  };

  const handleSaveEdit = (v: VehicleProfile) => {
    const updated: VehicleProfile = {
      ...v,
      currentOdometerKm: editOdometer,
      operationalStatus: editStatus,
      currentRoute: editRoute,
    };
    onUpdateVehicle(updated);
    setEditingPlate(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Commercial Fleet &amp; Asset Master Data</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated vehicle capital assets, book depreciation schedules, loan principals, and compliance certificates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onOpenAddTruck && state.vehicles.length < 2 && (
            <button
              onClick={onOpenAddTruck}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Truck ({state.vehicles.length}/2)</span>
            </button>
          )}

          <button
            onClick={onOpenQuickVoucher}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded border border-slate-700 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Record Vehicle Transaction</span>
          </button>
        </div>
      </div>

      {/* 2 Dedicated Vehicle Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {state.vehicles.map((v, idx) => {
          const isEditing = editingPlate === v.plateNumber;
          const assignedDriver = state.drivers.find(d => d.id === v.assignedDriverId);
          const insDays = getDaysRemaining(v.insuranceExpiryDate);
          const permitDays = getDaysRemaining(v.nationalPermitExpiryDate);
          const fitnessDays = getDaysRemaining(v.fitnessCertificateExpiryDate);

          return (
            <div
              key={v.plateNumber}
              className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs flex flex-col justify-between"
            >
              <div>
                {/* Vehicle Header */}
                <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 rounded text-white font-mono font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-base tracking-tight">{v.plateNumber}</div>
                      <div className="text-[11px] text-slate-400">{v.model}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {v.operationalStatus}
                  </span>
                </div>

                <div className="p-4 space-y-3.5">
                  {/* Current Active Route & Driver */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Assigned Driver:</span>
                      <span className="font-bold text-slate-800">{assignedDriver?.fullName || 'Not assigned'} ({assignedDriver?.contactNumber})</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Current Corridor:</span>
                      <span className="font-medium text-slate-800 text-right">{v.currentRoute || 'Local corridor'}</span>
                    </div>
                  </div>

                  {/* Asset Value & Tally Depreciation */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider text-slate-500">
                      Vehicle Asset &amp; Book Depreciation
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Original Cost</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {formatINR(v.originalPurchaseCost, false)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Accumulated Dep.</span>
                        <span className="font-mono font-bold text-rose-700 text-xs">
                          -{formatINR(v.accumulatedDepreciation, false)}
                        </span>
                      </div>
                      <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 block">Net Book Value</span>
                        <span className="font-mono font-bold text-emerald-800 text-xs">
                          {formatINR(v.currentBookValue, false)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loan & Financing Profile */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider text-slate-500">
                      Vehicle Commercial Loan &amp; EMI Liability
                    </div>
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                        <span className="font-sans text-slate-600">Financier Institution:</span>
                        <span className="font-medium text-slate-900">{v.financierName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                        <span className="font-sans text-slate-600">Loan Account Number:</span>
                        <span className="text-slate-900 font-bold">{v.loanAccountNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                        <span className="font-sans text-slate-600">Principal Outstanding:</span>
                        <span className="font-bold text-slate-900">{formatINR(v.loanCurrentPrincipal)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 font-mono">
                        <span className="font-sans text-slate-600">Monthly EMI Installment:</span>
                        <span className="font-bold text-blue-700">
                          {formatINR(v.monthlyEMI)} (Due {v.emiDueDayOfMonth}th)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Expiry Deadlines */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider text-slate-500">
                      RTO &amp; Transport Compliance Tracker
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 rounded border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500 block">Comprehensive Insurance</span>
                        <span className="font-mono font-bold text-slate-800 block">{formatDate(v.insuranceExpiryDate)}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">{insDays} days left</span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500 block">National Permit (NP)</span>
                        <span className="font-mono font-bold text-slate-800 block">{formatDate(v.nationalPermitExpiryDate)}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">{permitDays} days left</span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500 block">Fitness Certificate</span>
                        <span className="font-mono font-bold text-slate-800 block">{formatDate(v.fitnessCertificateExpiryDate)}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">{fitnessDays} days left</span>
                      </div>
                    </div>
                  </div>

                  {/* Fastag & Odometer */}
                  <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-500 block font-sans">Fastag Tag ID</span>
                      <span className="font-bold text-slate-900">{v.fastagTagId}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-500 block font-sans">Current Odometer</span>
                      <span className="font-bold text-slate-900">{formatKm(v.currentOdometerKm)}</span>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditing && (
                    <div className="p-3 bg-blue-50/60 rounded border border-blue-200 space-y-2 mt-2">
                      <div className="font-bold text-blue-900 text-xs">Update Operational Status &amp; Odometer</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 text-[10px] mb-0.5">Odometer (km)</label>
                          <input
                            type="number"
                            value={editOdometer}
                            onChange={e => setEditOdometer(parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 text-[10px] mb-0.5">Status</label>
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value as any)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                          >
                            <option value="ACTIVE_TRIP">ACTIVE_TRIP</option>
                            <option value="LOADING">LOADING</option>
                            <option value="UNLOADING">UNLOADING</option>
                            <option value="WORKSHOP">WORKSHOP</option>
                            <option value="IDLE">IDLE</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[10px] mb-0.5">Current Route / Corridor</label>
                        <input
                          type="text"
                          value={editRoute}
                          onChange={e => setEditRoute(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingPlate(null)}
                          className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(v)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-mono">Gross Weight: {v.gvwrMT} MT</span>
                {!isEditing && (
                  <button
                    onClick={() => handleStartEdit(v)}
                    className="text-blue-700 hover:underline font-semibold"
                  >
                    Edit Status &amp; Odometer
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state: No trucks registered yet */}
        {state.vehicles.length === 0 && (
          <div className="col-span-full bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base">No Commercial Trucks Configured</div>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Configure your commercial trucks with license plates, asset values, loan EMIs, and compliance expiry dates.
              </p>
            </div>
            {onOpenAddTruck && (
              <button
                onClick={onOpenAddTruck}
                className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Add Primary Truck (RJ-xx-xx-xxxx)</span>
              </button>
            )}
          </div>
        )}

        {/* Exactly 1 truck registered: show slot card for second truck */}
        {state.vehicles.length === 1 && (
          <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Truck B Slot Available</div>
              <p className="text-xs text-slate-500 mt-0.5">Register your second commercial vehicle to complete the 2-truck fleet.</p>
            </div>
            {onOpenAddTruck && (
              <button
                onClick={onOpenAddTruck}
                className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Add Second Truck</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

