import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  MapPin,
  AlertTriangle,
  Receipt,
  FileCheck
} from 'lucide-react';
import { Client } from '../../types/fleet';
import { formatINR } from '../../services/formatters';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: Client) => void;
  existingClients: Client[];
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  existingClients,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Client / Company name is required.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Contact phone number is required.');
      return;
    }

    const isDuplicate = existingClients.some(
      c => (c.name || c.clientName || '').toLowerCase().trim() === cleanName.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage(`A client with the name "${cleanName}" already exists.`);
      return;
    }

    const newClient: Client = {
      id: `CLI-${Date.now()}`,
      name: cleanName,
      clientName: cleanName,
      phone: phone.trim(),
      contactPerson: contactPerson.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      address: address.trim() || undefined,
      city: address.trim() || undefined,
      openingBalance: Number(openingBalance) || 0,
      currentReceivableBalance: Number(openingBalance) || 0,
      createdAt: new Date().toISOString().split('T')[0],
      standardPaymentTermsDays: 15,
    };

    onAddClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-lg my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold tracking-tight">Register New Consignor / Client Party</h2>
              <p className="text-xs text-slate-400">Add corporate or broker account for freight billing and payment tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Client / Company Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. UltraTech Cement Ltd or Shree Transport Corp"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 font-medium text-xs bg-white text-slate-900"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contact Phone <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="+91 98291 00000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded border border-slate-300 font-mono text-xs bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contact Person (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Logistics Manager / Dispatch"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="08AAACU1234F1Z8"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs uppercase bg-white text-slate-900"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  City / Dispatch Station
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Kotputli / Jaipur"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded border border-slate-300 text-xs bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Opening Receivable Balance (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={openingBalance || ''}
                  onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs bg-white text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Amount previously owed by client prior to starting entries in FleetLedger: {formatINR(openingBalance)}
              </p>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs sm:text-sm min-h-[42px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs sm:text-sm min-h-[42px] shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>Save Consignor Party</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
