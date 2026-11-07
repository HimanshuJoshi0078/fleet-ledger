import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Truck,
  Fuel,
  Receipt,
  Utensils,
  Wrench,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { JournalEntry } from '../../types/accounting';
import { formatINR, generateNextVoucherNumber } from '../../services/formatters';

interface DailyEntryModalProps {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
  onSaveEntries: (entries: JournalEntry[]) => void;
  defaultTruckPlate?: string;
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  state,
  isOpen,
  onClose,
  onSaveEntries,
  defaultTruckPlate,
}) => {
  if (!isOpen) return null;

  const [selectedTruck, setSelectedTruck] = useState<string>(
    defaultTruckPlate || state.vehicles[0]?.plateNumber || ''
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [driverName, setDriverName] = useState<string>('');
  const [routeNotes, setRouteNotes] = useState<string>('');

  // Revenue
  const [hasRevenue, setHasRevenue] = useState<boolean>(true);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [clientName, setClientName] = useState<string>('');
  const [biltyNumber, setBiltyNumber] = useState<string>('');
  const [revenuePaymentMode, setRevenuePaymentMode] = useState<'BANK' | 'CASH' | 'CREDIT'>('CREDIT');

  // Fuel Expense
  const [fuelLiters, setFuelLiters] = useState<number>(0);
  const [fuelRate, setFuelRate] = useState<number>(90.5);
  const [pumpName, setPumpName] = useState<string>('');
  const [fuelPaymentMode, setFuelPaymentMode] = useState<'CREDIT' | 'CASH' | 'BANK'>('CREDIT');

  // Toll Expense
  const [tollAmount, setTollAmount] = useState<number>(0);
  const [tollPaymentMode, setTollPaymentMode] = useState<'FASTAG' | 'CASH' | 'BANK'>('FASTAG');

  // Bhatta Expense
  const [bhattaAmount, setBhattaAmount] = useState<number>(0);
  const [bhattaPaymentMode, setBhattaPaymentMode] = useState<'CASH' | 'BANK'>('CASH');

  // Maintenance Expense
  const [maintenanceAmount, setMaintenanceAmount] = useState<number>(0);
  const [maintenanceNotes, setMaintenanceNotes] = useState<string>('');
  const [maintenancePaymentMode, setMaintenancePaymentMode] = useState<'CASH' | 'BANK'>('CASH');

  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-sync assigned driver when truck changes
  useEffect(() => {
    const v = state.vehicles.find(veh => veh.plateNumber === selectedTruck);
    if (v && v.assignedDriverId) {
      const d = state.drivers.find(drv => drv.id === v.assignedDriverId);
      if (d) {
        setDriverName(d.fullName);
        setBhattaAmount(d.dailyBhattaRate || 350);
      }
    }
  }, [selectedTruck, state.vehicles, state.drivers]);

  const totalFuelAmount = Math.round(fuelLiters * fuelRate * 100) / 100;
  const totalExpenses =
    totalFuelAmount +
    Number(tollAmount || 0) +
    Number(bhattaAmount || 0) +
    Number(maintenanceAmount || 0);

  const netDailyProfit = (hasRevenue ? Number(freightAmount || 0) : 0) - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedTruck) {
      setErrorMessage('Please select a truck to record daily trip entries.');
      return;
    }

    const hasAnyRevenue = hasRevenue && Number(freightAmount) > 0;
    const hasAnyExpense = totalExpenses > 0;

    if (!hasAnyRevenue && !hasAnyExpense) {
      setErrorMessage('Please enter at least one revenue or expense item for this day.');
      return;
    }

    const createdEntries: JournalEntry[] = [];
    let voucherCounter = state.journalEntries.length;

    // Detect if Truck 1 or Truck 2
    const truckIndex = state.vehicles.findIndex(v => v.plateNumber === selectedTruck);
    const suffix = truckIndex === 1 ? '02' : '01'; // '01' for Truck A, '02' for Truck B

    const matchedDriver = state.drivers.find(d => d.fullName.toLowerCase() === driverName.toLowerCase()) ||
      state.drivers.find(d => d.assignedPlateNumber === selectedTruck);

    // 1. Revenue Entry
    if (hasAnyRevenue) {
      voucherCounter++;
      const revVoucher = generateNextVoucherNumber('LR', voucherCounter);
      const revAccountCode = suffix === '01' ? '4101' : '4102';
      const drAccountCode = revenuePaymentMode === 'CASH' ? '1100' : revenuePaymentMode === 'BANK' ? '1200' : '1400';
      const drAccountName = revenuePaymentMode === 'CASH'
        ? 'Cash in Hand (Fleet Operational Cash)'
        : revenuePaymentMode === 'BANK'
        ? 'Bank Fleet Current A/c'
        : 'Accounts Receivable (Client Freight Dues)';

      createdEntries.push({
        id: `VR-${Date.now()}-REV`,
        voucherNumber: revVoucher,
        date,
        voucherType: 'FREIGHT_BILL',
        vehiclePlate: selectedTruck,
        driverId: matchedDriver?.id,
        referenceNumber: biltyNumber || undefined,
        narration: `Freight revenue for ${selectedTruck}: ${clientName ? `Client ${clientName}` : 'Trip Load'}${routeNotes ? ` (${routeNotes})` : ''} [${revenuePaymentMode}]`,
        lines: [
          {
            accountCode: drAccountCode,
            accountName: drAccountName,
            debit: Number(freightAmount),
            credit: 0,
            notes: `Received via ${revenuePaymentMode}`,
          },
          {
            accountCode: revAccountCode,
            accountName: `Freight Revenue: ${selectedTruck}`,
            debit: 0,
            credit: Number(freightAmount),
            notes: `Freight billing for ${selectedTruck}`,
          },
        ],
        metadata: {
          biltyNumber: biltyNumber || undefined,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Fuel Expense Entry
    if (totalFuelAmount > 0) {
      voucherCounter++;
      const fuelVoucher = generateNextVoucherNumber('DS', voucherCounter);
      const fuelExpCode = suffix === '01' ? '5101' : '5102';
      const crCode = fuelPaymentMode === 'CASH' ? '1100' : fuelPaymentMode === 'BANK' ? '1200' : (suffix === '01' ? '2201' : '2202');
      const crName = fuelPaymentMode === 'CASH'
        ? 'Cash in Hand (Fleet Operational Cash)'
        : fuelPaymentMode === 'BANK'
        ? 'Bank Fleet Current A/c'
        : `Fuel Credit Payable (${pumpName || 'Fuel Pump'})`;

      createdEntries.push({
        id: `VR-${Date.now()}-FUEL`,
        voucherNumber: fuelVoucher,
        date,
        voucherType: 'DIESEL_SLIP',
        vehiclePlate: selectedTruck,
        driverId: matchedDriver?.id,
        narration: `Diesel fuel filled for ${selectedTruck}: ${fuelLiters} Ltr @ ₹${fuelRate}/Ltr ${pumpName ? `at ${pumpName}` : ''} [${fuelPaymentMode}]`,
        lines: [
          {
            accountCode: fuelExpCode,
            accountName: `Diesel Fuel Expense: ${selectedTruck}`,
            debit: totalFuelAmount,
            credit: 0,
            notes: `${fuelLiters} Liters @ Rs ${fuelRate}/Ltr`,
          },
          {
            accountCode: crCode,
            accountName: crName,
            debit: 0,
            credit: totalFuelAmount,
            notes: `Payment Mode: ${fuelPaymentMode}`,
          },
        ],
        metadata: {
          liters: fuelLiters,
          fuelRate,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Toll Entry
    if (Number(tollAmount) > 0) {
      voucherCounter++;
      const tollVoucher = generateNextVoucherNumber('FT', voucherCounter);
      const tollExpCode = suffix === '01' ? '5201' : '5202';
      const crCode = tollPaymentMode === 'CASH' ? '1100' : tollPaymentMode === 'BANK' ? '1200' : '1300';
      const crName = tollPaymentMode === 'CASH'
        ? 'Cash in Hand (Fleet Operational Cash)'
        : tollPaymentMode === 'BANK'
        ? 'Bank Fleet Current A/c'
        : 'Fastag Master Wallet (NHAI Fleet Pool)';

      createdEntries.push({
        id: `VR-${Date.now()}-TOLL`,
        voucherNumber: tollVoucher,
        date,
        voucherType: 'FASTAG_TOLL',
        vehiclePlate: selectedTruck,
        narration: `Highway toll & fastag deduction for ${selectedTruck} [${tollPaymentMode}]`,
        lines: [
          {
            accountCode: tollExpCode,
            accountName: `Toll & Fastag Expense: ${selectedTruck}`,
            debit: Number(tollAmount),
            credit: 0,
            notes: 'Highway toll',
          },
          {
            accountCode: crCode,
            accountName: crName,
            debit: 0,
            credit: Number(tollAmount),
            notes: `Disbursed via ${tollPaymentMode}`,
          },
        ],
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Driver Bhatta Entry
    if (Number(bhattaAmount) > 0) {
      voucherCounter++;
      const bhattaVoucher = generateNextVoucherNumber('BH', voucherCounter);
      const bhattaExpCode = suffix === '01' ? '5301' : '5302';
      const crCode = bhattaPaymentMode === 'CASH' ? '1100' : '1200';

      createdEntries.push({
        id: `VR-${Date.now()}-BHA`,
        voucherNumber: bhattaVoucher,
        date,
        voucherType: 'DRIVER_BHATTA',
        vehiclePlate: selectedTruck,
        driverId: matchedDriver?.id,
        narration: `Driver daily trip fooding bhatta for ${driverName || 'Driver'} on ${selectedTruck}`,
        lines: [
          {
            accountCode: bhattaExpCode,
            accountName: `Driver Trip Bhatta & Fooding: ${selectedTruck}`,
            debit: Number(bhattaAmount),
            credit: 0,
            notes: `Food allowance for ${driverName || 'Driver'}`,
          },
          {
            accountCode: crCode,
            accountName: bhattaPaymentMode === 'CASH' ? 'Cash in Hand (Fleet Operational Cash)' : 'Bank Fleet Current A/c',
            debit: 0,
            credit: Number(bhattaAmount),
            notes: `Paid in ${bhattaPaymentMode}`,
          },
        ],
        createdAt: new Date().toISOString(),
      });
    }

    // 5. Maintenance Entry
    if (Number(maintenanceAmount) > 0) {
      voucherCounter++;
      const maintVoucher = generateNextVoucherNumber('EX', voucherCounter);
      const repExpCode = suffix === '01' ? '5401' : '5402';
      const crCode = maintenancePaymentMode === 'CASH' ? '1100' : '1200';

      createdEntries.push({
        id: `VR-${Date.now()}-REP`,
        voucherNumber: maintVoucher,
        date,
        voucherType: 'MAINTENANCE_REPAIR',
        vehiclePlate: selectedTruck,
        driverId: matchedDriver?.id,
        narration: `En-route repairs & maintenance for ${selectedTruck}: ${maintenanceNotes || 'Tyre / Puncture repairs'}`,
        lines: [
          {
            accountCode: repExpCode,
            accountName: `En-route Repairs & Punctures: ${selectedTruck}`,
            debit: Number(maintenanceAmount),
            credit: 0,
            notes: maintenanceNotes || 'En-route repairs',
          },
          {
            accountCode: crCode,
            accountName: maintenancePaymentMode === 'CASH' ? 'Cash in Hand (Fleet Operational Cash)' : 'Bank Fleet Current A/c',
            debit: 0,
            credit: Number(maintenanceAmount),
            notes: `Paid via ${maintenancePaymentMode}`,
          },
        ],
        createdAt: new Date().toISOString(),
      });
    }

    onSaveEntries(createdEntries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-3xl max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base tracking-tight">DAILY TRIP &amp; EXPENSE ENTRY SHEET</span>
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

          {/* Top Bar: Select Truck, Date, Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-300">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Select Truck <span className="text-rose-600">*</span>
              </label>
              <select
                value={selectedTruck}
                onChange={e => setSelectedTruck(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs font-bold bg-white"
              >
                {state.vehicles.length === 0 ? (
                  <option value="">-- No trucks registered --</option>
                ) : (
                  state.vehicles.map(v => (
                    <option key={v.plateNumber} value={v.plateNumber}>
                      {v.plateNumber} ({v.model.split('(')[0]})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. Mohan Singh"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Corridor / Notes</label>
              <input
                type="text"
                placeholder="e.g. Jaipur to Mumbai"
                value={routeNotes}
                onChange={e => setRouteNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>

          {/* Section 1: Revenue / Freight */}
          <div className="bg-blue-50/50 p-3.5 rounded border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-blue-950 text-xs uppercase tracking-wider">
                  Freight Revenue / Inflow
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-blue-900 font-medium">
                <input
                  type="checkbox"
                  checked={hasRevenue}
                  onChange={e => setHasRevenue(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Include Freight</span>
              </label>
            </div>

            {hasRevenue && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Freight Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={freightAmount || ''}
                    onChange={e => setFreightAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold text-xs bg-white text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Mode</label>
                  <select
                    value={revenuePaymentMode}
                    onChange={e => setRevenuePaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="CREDIT">Credit (Receivable from Client)</option>
                    <option value="BANK">Bank Account (Direct RTGS / UPI)</option>
                    <option value="CASH">Cash in Hand (Advance / Spot Cash)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Client / Consignor</label>
                  <input
                    type="text"
                    placeholder="e.g. UltraTech Cement"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Bilty / LR #</label>
                  <input
                    type="text"
                    placeholder="e.g. LR-9841"
                    value={biltyNumber}
                    onChange={e => setBiltyNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Direct Operating Expenses */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase tracking-wider text-slate-500">
              Direct Trip Operating Expenses
            </div>

            {/* Fuel / Diesel Row */}
            <div className="bg-amber-50/40 p-3 rounded border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span>Diesel Fuel</span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-700">
                  Total Fuel: {formatINR(totalFuelAmount)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 text-[11px] mb-0.5">Liters Pumped</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={fuelLiters || ''}
                    onChange={e => setFuelLiters(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[11px] mb-0.5">Rate / Liter (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fuelRate}
                    onChange={e => setFuelRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[11px] mb-0.5">Fuel Payment Mode</label>
                  <select
                    value={fuelPaymentMode}
                    onChange={e => setFuelPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  >
                    <option value="CREDIT">Pump Credit (Payable to Pump)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Transfer / Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[11px] mb-0.5">Pump Station Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shri Ram IOCL"
                    value={pumpName}
                    onChange={e => setPumpName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Toll, Bhatta, Maintenance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Toll */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Highway Toll / Fastag</span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={tollAmount || ''}
                    onChange={e => setTollAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5">Deducted From</label>
                  <select
                    value={tollPaymentMode}
                    onChange={e => setTollPaymentMode(e.target.value as any)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                  >
                    <option value="FASTAG">Fastag Wallet</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Account</option>
                  </select>
                </div>
              </div>

              {/* Bhatta */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Driver Bhatta (Food)</span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={bhattaAmount || ''}
                    onChange={e => setBhattaAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5">Paid Via</label>
                  <select
                    value={bhattaPaymentMode}
                    onChange={e => setBhattaPaymentMode(e.target.value as any)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank / UPI Transfer</option>
                  </select>
                </div>
              </div>

              {/* Maintenance */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Wrench className="w-3.5 h-3.5 text-slate-600" />
                  <span>Repairs &amp; Punctures</span>
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={maintenanceAmount || ''}
                    onChange={e => setMaintenanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-0.5">Repair Note</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 tyre punctures"
                    value={maintenanceNotes}
                    onChange={e => setMaintenanceNotes(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Summary Box */}
          <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-slate-400 font-sans block text-[10px]">Total Revenue:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatINR(hasRevenue ? Number(freightAmount || 0) : 0)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-sans block text-[10px]">Direct Expenses:</span>
              <span className="font-bold text-rose-400 text-sm">
                {formatINR(totalExpenses)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 font-sans block text-[10px]">Net Trip Margin:</span>
              <span className={`font-bold text-sm ${netDailyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(netDailyProfit)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-300">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500 shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Post Daily Entries</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

