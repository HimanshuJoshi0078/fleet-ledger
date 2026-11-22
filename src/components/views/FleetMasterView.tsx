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
  Wrench,
  Pencil
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { VehicleProfile, TruckStatus } from '../../types/fleet';
import { getComplianceAlerts, calculateFleetFuelMileage } from '../../services/accountingEngine';
import { formatINR, formatKm, formatDate, formatKMPL } from '../../services/formatters';
import { EditTruckModal } from '../modals/EditTruckModal';

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
  const [editingTruckModal, setEditingTruckModal] = useState<VehicleProfile | null>(null);
  const [editingPlate, setEditingPlate] = useState<string | null>(null);
  const [editOdometer, setEditOdometer] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<any>('ACTIVE_TRIP');
  const [editRoute, setEditRoute] = useState<string>('');
  const [editInsurance, setEditInsurance] = useState<string>('');
  const [editFitness, setEditFitness] = useState<string>('');
  const [editPermit, setEditPermit] = useState<string>('');
  const [editPuc, setEditPuc] = useState<string>('');
  const [editRoadTax, setEditRoadTax] = useState<string>('');

  const alerts = getComplianceAlerts(state.vehicles);
  const mileageMetrics = calculateFleetFuelMileage(state.journalEntries);

  const handleStatusChange = (v: VehicleProfile, newStatus: TruckStatus) => {
    const updated: VehicleProfile = {
      ...v,
      operationalStatus: newStatus,
      status: newStatus,
    };
    onUpdateVehicle(updated);
  };

  const getDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return null;
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
    setEditInsurance(v.insuranceExpiryDate || '');
    setEditFitness(v.fitnessCertificateExpiryDate || '');
    setEditPermit(v.nationalPermitExpiryDate || '');
    setEditPuc(v.pucExpiryDate || '');
    setEditRoadTax(v.roadTaxExpiryDate || '');
  };

  const handleSaveEdit = (v: VehicleProfile) => {
    const updated: VehicleProfile = {
      ...v,
      currentOdometerKm: editOdometer,
      operationalStatus: editStatus,
      currentRoute: editRoute,
      insuranceExpiryDate: editInsurance || v.insuranceExpiryDate,
      fitnessCertificateExpiryDate: editFitness || v.fitnessCertificateExpiryDate,
      nationalPermitExpiryDate: editPermit || v.nationalPermitExpiryDate,
      pucExpiryDate: editPuc || v.pucExpiryDate,
      roadTaxExpiryDate: editRoadTax || v.roadTaxExpiryDate,
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
          {onOpenAddTruck && (
            <button
              onClick={onOpenAddTruck}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded border border-blue-500 transition-colors shadow-sm min-h-[42px] w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Commercial Truck</span>
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

      {/* Compliance Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-300 shadow-sm overflow-hidden text-xs">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Fleet Document Compliance Alerts ({alerts.length})</span>
            </div>
            <span className="text-[11px] font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-semibold">
              Action Required
            </span>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {alerts.map((alert, idx) => {
                const isExpired = alert.daysRemaining < 0;
                return (
                  <div
                    key={`${alert.vehiclePlate}-${alert.documentType}-${idx}`}
                    className={`p-2.5 rounded border flex flex-col justify-between ${
                      isExpired
                        ? 'bg-rose-50/60 border-rose-300 text-rose-950'
                        : 'bg-amber-50/60 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs">{alert.vehiclePlate}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isExpired
                            ? 'bg-rose-200 text-rose-900 border border-rose-300'
                            : 'bg-amber-200 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isExpired ? 'EXPIRED' : 'EXPIRING SOON'}
                      </span>
                    </div>
                    <div className="font-medium text-xs text-slate-800">{alert.documentName}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">
                      <span>Expiry: {formatDate(alert.expiryDate)}</span>
                      <span className={`font-mono font-bold ${isExpired ? 'text-rose-700' : 'text-amber-800'}`}>
                        {isExpired
                          ? `Overdue: ${Math.abs(alert.daysRemaining)} days`
                          : `In ${alert.daysRemaining} days`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2 Dedicated Vehicle Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {state.vehicles.map((v, idx) => {
          const isEditing = editingPlate === v.plateNumber;
          const assignedDriver = state.drivers.find(d => d.id === v.assignedDriverId);
          const insDays = getDaysRemaining(v.insuranceExpiryDate);
          const permitDays = getDaysRemaining(v.nationalPermitExpiryDate);
          const fitnessDays = getDaysRemaining(v.fitnessCertificateExpiryDate);
          const pucDays = getDaysRemaining(v.pucExpiryDate);
          const roadTaxDays = getDaysRemaining(v.roadTaxExpiryDate);
          const avgKmpl = mileageMetrics.averageKmplByPlate[v.plateNumber];
          const truckStatus: TruckStatus =
            v.status ||
            (v.operationalStatus === 'DECOMMISSIONED'
              ? 'DECOMMISSIONED'
              : v.operationalStatus === 'WORKSHOP' || v.operationalStatus === 'MAINTENANCE'
              ? 'MAINTENANCE'
              : 'ACTIVE');

          return (
            <div
              key={v.plateNumber}
              className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs flex flex-col justify-between"
            >
              <div>
                {/* Vehicle Header */}
                <div className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 rounded text-white font-mono font-bold flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-base tracking-tight">{v.plateNumber}</div>
                      <div className="text-[11px] text-slate-400">{v.model}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Interactive Truck Status Selector */}
                    <select
                      value={truckStatus}
                      onChange={e => handleStatusChange(v, e.target.value as TruckStatus)}
                      className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded border cursor-pointer focus:outline-none ${
                        truckStatus === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                          : truckStatus === 'MAINTENANCE'
                          ? 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900'
                          : 'bg-rose-950 text-rose-300 border-rose-700 hover:bg-rose-900'
                      }`}
                      title="Change Truck Operational Status"
                    >
                      <option value="ACTIVE" className="bg-slate-900 text-emerald-300">ACTIVE</option>
                      <option value="MAINTENANCE" className="bg-slate-900 text-amber-300">MAINTENANCE</option>
                      <option value="DECOMMISSIONED" className="bg-slate-900 text-rose-300">DECOMMISSIONED</option>
                    </select>

                    {/* Edit Truck Details Button */}
                    <button
                      onClick={() => setEditingTruckModal(v)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      title="Edit Truck Details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {/* Insurance */}
                      <div className={`p-2 rounded border ${
                        insDays !== null && insDays < 0
                          ? 'border-rose-300 bg-rose-50/50'
                          : insDays !== null && insDays <= 15
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <span className="text-[10px] text-slate-500 block">Insurance</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {v.insuranceExpiryDate ? formatDate(v.insuranceExpiryDate) : 'Not set'}
                        </span>
                        <span className={`text-[10px] font-medium block ${
                          insDays === null
                            ? 'text-slate-400'
                            : insDays < 0
                            ? 'text-rose-700 font-bold'
                            : insDays <= 15
                            ? 'text-amber-800 font-bold'
                            : 'text-emerald-700'
                        }`}>
                          {insDays === null
                            ? 'N/A'
                            : insDays < 0
                            ? `Overdue: ${Math.abs(insDays)}d`
                            : `${insDays} days left`}
                        </span>
                      </div>

                      {/* Fitness */}
                      <div className={`p-2 rounded border ${
                        fitnessDays !== null && fitnessDays < 0
                          ? 'border-rose-300 bg-rose-50/50'
                          : fitnessDays !== null && fitnessDays <= 15
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <span className="text-[10px] text-slate-500 block">Fitness</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {v.fitnessCertificateExpiryDate ? formatDate(v.fitnessCertificateExpiryDate) : 'Not set'}
                        </span>
                        <span className={`text-[10px] font-medium block ${
                          fitnessDays === null
                            ? 'text-slate-400'
                            : fitnessDays < 0
                            ? 'text-rose-700 font-bold'
                            : fitnessDays <= 15
                            ? 'text-amber-800 font-bold'
                            : 'text-emerald-700'
                        }`}>
                          {fitnessDays === null
                            ? 'N/A'
                            : fitnessDays < 0
                            ? `Overdue: ${Math.abs(fitnessDays)}d`
                            : `${fitnessDays} days left`}
                        </span>
                      </div>

                      {/* Permit */}
                      <div className={`p-2 rounded border ${
                        permitDays !== null && permitDays < 0
                          ? 'border-rose-300 bg-rose-50/50'
                          : permitDays !== null && permitDays <= 15
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <span className="text-[10px] text-slate-500 block">National Permit</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {v.nationalPermitExpiryDate ? formatDate(v.nationalPermitExpiryDate) : 'Not set'}
                        </span>
                        <span className={`text-[10px] font-medium block ${
                          permitDays === null
                            ? 'text-slate-400'
                            : permitDays < 0
                            ? 'text-rose-700 font-bold'
                            : permitDays <= 15
                            ? 'text-amber-800 font-bold'
                            : 'text-emerald-700'
                        }`}>
                          {permitDays === null
                            ? 'N/A'
                            : permitDays < 0
                            ? `Overdue: ${Math.abs(permitDays)}d`
                            : `${permitDays} days left`}
                        </span>
                      </div>

                      {/* PUC */}
                      <div className={`p-2 rounded border ${
                        pucDays !== null && pucDays < 0
                          ? 'border-rose-300 bg-rose-50/50'
                          : pucDays !== null && pucDays <= 15
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <span className="text-[10px] text-slate-500 block">Pollution (PUC)</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {v.pucExpiryDate ? formatDate(v.pucExpiryDate) : 'Not set'}
                        </span>
                        <span className={`text-[10px] font-medium block ${
                          pucDays === null
                            ? 'text-slate-400'
                            : pucDays < 0
                            ? 'text-rose-700 font-bold'
                            : pucDays <= 15
                            ? 'text-amber-800 font-bold'
                            : 'text-emerald-700'
                        }`}>
                          {pucDays === null
                            ? 'N/A'
                            : pucDays < 0
                            ? `Overdue: ${Math.abs(pucDays)}d`
                            : `${pucDays} days left`}
                        </span>
                      </div>

                      {/* Road Tax */}
                      <div className={`p-2 rounded border ${
                        roadTaxDays !== null && roadTaxDays < 0
                          ? 'border-rose-300 bg-rose-50/50'
                          : roadTaxDays !== null && roadTaxDays <= 15
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <span className="text-[10px] text-slate-500 block">Road Tax</span>
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {v.roadTaxExpiryDate ? formatDate(v.roadTaxExpiryDate) : 'Not set'}
                        </span>
                        <span className={`text-[10px] font-medium block ${
                          roadTaxDays === null
                            ? 'text-slate-400'
                            : roadTaxDays < 0
                            ? 'text-rose-700 font-bold'
                            : roadTaxDays <= 15
                            ? 'text-amber-800 font-bold'
                            : 'text-emerald-700'
                        }`}>
                          {roadTaxDays === null
                            ? 'N/A'
                            : roadTaxDays < 0
                            ? `Overdue: ${Math.abs(roadTaxDays)}d`
                            : `${roadTaxDays} days left`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fastag, Odometer & Mileage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-500 block font-sans">Fastag Tag ID</span>
                      <span className="font-bold text-slate-900 text-xs truncate block">{v.fastagTagId}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                      <span className="text-[10px] text-slate-500 block font-sans">Current Odometer</span>
                      <span className="font-bold text-slate-900 text-xs">{formatKm(v.currentOdometerKm)}</span>
                    </div>
                    <div className="bg-blue-50/50 p-2 rounded border border-blue-200 font-mono">
                      <span className="text-[10px] text-blue-900 block font-sans font-semibold">Average Fuel Mileage</span>
                      <span className="font-bold text-blue-900 text-xs">
                        {avgKmpl ? formatKMPL(avgKmpl) : 'Pending 2+ slips'}
                      </span>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditing && (
                    <div className="p-3 bg-blue-50/60 rounded border border-blue-200 space-y-3 mt-2">
                      <div className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-1">
                        Update Status, Odometer &amp; Document Expiry Dates
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                        <div>
                          <label className="block text-slate-600 text-[10px] mb-0.5">Current Route / Corridor</label>
                          <input
                            type="text"
                            value={editRoute}
                            onChange={e => setEditRoute(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Document Renewal Expiry Dates
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                          <div>
                            <label className="block text-slate-600 text-[10px] mb-0.5">Insurance Expiry</label>
                            <input
                              type="date"
                              value={editInsurance}
                              onChange={e => setEditInsurance(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 text-[10px] mb-0.5">Fitness Expiry</label>
                            <input
                              type="date"
                              value={editFitness}
                              onChange={e => setEditFitness(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 text-[10px] mb-0.5">National Permit</label>
                            <input
                              type="date"
                              value={editPermit}
                              onChange={e => setEditPermit(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 text-[10px] mb-0.5">PUC (Pollution)</label>
                            <input
                              type="date"
                              value={editPuc}
                              onChange={e => setEditPuc(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 text-[10px] mb-0.5">Road Tax</label>
                            <input
                              type="date"
                              value={editRoadTax}
                              onChange={e => setEditRoadTax(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-blue-200">
                        <button
                          onClick={() => setEditingPlate(null)}
                          className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded text-slate-700 min-h-[36px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(v)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded min-h-[36px]"
                        >
                          Save Changes
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

        {/* Additional vehicle slot card */}
        {state.vehicles.length > 0 && onOpenAddTruck && (
          <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px]">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Add Commercial Truck</div>
              <p className="text-xs text-slate-500 mt-0.5">Register an additional vehicle profile with asset cost, loan details, and compliance records.</p>
            </div>
            <button
              onClick={onOpenAddTruck}
              className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Add Vehicle</span>
            </button>
          </div>
        )}
      </div>

      <EditTruckModal
        isOpen={!!editingTruckModal}
        onClose={() => setEditingTruckModal(null)}
        truck={editingTruckModal}
        onSaveTruck={onUpdateVehicle}
      />
    </div>
  );
};

