import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  AlertTriangle,
  Phone,
  Truck,
  Building
} from 'lucide-react';
import { DriverProfile } from '../../types/fleet';
import { formatINR } from '../../services/formatters';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDriver: (driver: DriverProfile) => void;
  availableTrucks: { plateNumber: string; model: string }[];
}

export const AddDriverModal: React.FC<AddDriverModalProps> = ({
  isOpen,
  onClose,
  onAddDriver,
  availableTrucks,
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [assignedPlateNumber, setAssignedPlateNumber] = useState<string>(
    availableTrucks[0]?.plateNumber || ''
  );
  const [baseMonthlySalary, setBaseMonthlySalary] = useState<number>(22000);
  const [dailyBhattaRate, setDailyBhattaRate] = useState<number>(350);
  const [currentAdvanceBalance, setCurrentAdvanceBalance] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Driver full name is required.');
      return;
    }

    if (!contactNumber.trim()) {
      setErrorMessage('Driver phone contact number is required.');
      return;
    }

    if (!licenseNumber.trim()) {
      setErrorMessage('Driving License number is required for transport compliance.');
      return;
    }

    const newDriver: DriverProfile = {
      id: `DRV-${Date.now()}`,
      fullName: fullName.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      contactNumber: contactNumber.trim(),
      assignedPlateNumber: assignedPlateNumber.trim() || 'UNASSIGNED',
      baseMonthlySalary: Number(baseMonthlySalary) || 20000,
      currentAdvanceBalance: Number(currentAdvanceBalance) || 0,
      unpaidSalaryBalance: 0,
      dailyBhattaRate: Number(dailyBhattaRate) || 350,
      joiningDate: new Date().toISOString().split('T')[0],
      emergencyContact: emergencyContact.trim() || 'N/A',
    };

    onAddDriver(newDriver);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base tracking-tight">ADD DRIVER PROFILE</span>
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

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mohan Singh"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-600 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Primary Phone Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98290 12345"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                placeholder="e.g. Brother - Ram Singh"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Commercial Driving License # <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RJ-14-2015009821"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value.toUpperCase())}
                required
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs uppercase bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Truck
              </label>
              <select
                value={assignedPlateNumber}
                onChange={e => setAssignedPlateNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
              >
                <option value="">-- Unassigned / Pool Driver --</option>
                {availableTrucks.map(t => (
                  <option key={t.plateNumber} value={t.plateNumber}>
                    {t.plateNumber} : {t.model.split('(')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Base Monthly Salary (₹)</label>
              <input
                type="number"
                value={baseMonthlySalary}
                onChange={e => setBaseMonthlySalary(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold text-xs bg-white text-blue-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Daily Fooding Bhatta (₹)</label>
              <input
                type="number"
                value={dailyBhattaRate}
                onChange={e => setDailyBhattaRate(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Starting Advance Due (₹)</label>
              <input
                type="number"
                value={currentAdvanceBalance}
                onChange={e => setCurrentAdvanceBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white text-rose-700"
              />
            </div>
          </div>

          {/* Footer */}
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
              <span>Save Driver Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

