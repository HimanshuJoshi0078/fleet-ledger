import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Fuel,
  CreditCard,
  Utensils,
  UserCheck,
  Wrench,
  Building,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { AppState } from '../../services/storage';
import { VoucherType, JournalLine, JournalEntry } from '../../types/accounting';
import { formatINR, generateNextVoucherNumber } from '../../services/formatters';

interface QuickVoucherModalProps {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
  onSaveEntry: (entry: JournalEntry) => void;
  defaultVoucherType?: VoucherType;
}

export const QuickVoucherModal: React.FC<QuickVoucherModalProps> = ({
  state,
  isOpen,
  onClose,
  onSaveEntry,
  defaultVoucherType = 'FREIGHT_BILL',
}) => {
  if (!isOpen) return null;

  const [activeType, setActiveType] = useState<VoucherType>(defaultVoucherType);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehiclePlate, setVehiclePlate] = useState<string>(state.vehicles[0]?.plateNumber || '');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [narration, setNarration] = useState<string>('');

  // Domain-specific fields
  // Freight Bilty
  const [clientId, setClientId] = useState<string>(state.clients[0]?.id || '');
  const [biltyNumber, setBiltyNumber] = useState<string>('LR-' + Math.floor(1000 + Math.random() * 9000));
  const [loadingPoint, setLoadingPoint] = useState<string>('Kotputli Cement Hub');
  const [unloadingPoint, setUnloadingPoint] = useState<string>('Ahmedabad Warehouse');
  const [cargoWeightMT, setCargoWeightMT] = useState<number>(35.0);
  const [freightRatePerMT, setFreightRatePerMT] = useState<number>(2400);

  // Diesel Fuel Slip
  const [pumpId, setPumpId] = useState<string>(state.pumps[0]?.id || '');
  const [fuelLiters, setFuelLiters] = useState<number>(250);
  const [fuelRate, setFuelRate] = useState<number>(90.5);
  const [fuelPaymentMode, setFuelPaymentMode] = useState<'CREDIT' | 'CASH' | 'BANK'>('CREDIT');
  const [fuelSlipNo, setFuelSlipNo] = useState<string>('SLIP-' + Math.floor(10000 + Math.random() * 90000));
  const [odometer, setOdometer] = useState<number>(148500);

  // Fastag
  const [fastagAction, setFastagAction] = useState<'TOLL' | 'RECHARGE'>('TOLL');
  const [tollAmount, setTollAmount] = useState<number>(1850);
  const [tollPlazaName, setTollPlazaName] = useState<string>('Shahjahanpur Toll Plaza NH-48');

  // Driver Bhatta / Advance / Salary
  const [driverId, setDriverId] = useState<string>(state.drivers[0]?.id || '');
  const [bhattaAmount, setBhattaAmount] = useState<number>(1400);
  const [bhattaPaymentMode, setBhattaPaymentMode] = useState<'CASH' | 'BANK'>('CASH');
  const [driverAdvanceAmount, setDriverAdvanceAmount] = useState<number>(3000);
  const [advanceReason, setAdvanceReason] = useState<string>('Family medical advance');
  const [salaryGrossAmount, setSalaryGrossAmount] = useState<number>(22000);
  const [salaryAdvanceDeduction, setSalaryAdvanceDeduction] = useState<number>(4500);

  // Maintenance & Repairs
  const [repairAmount, setRepairAmount] = useState<number>(1800);
  const [repairType, setRepairType] = useState<string>('Tyre Vulcanizing & Greasing');

  // EMI
  const [emiPrincipal, setEmiPrincipal] = useState<number>(62300);
  const [emiInterest, setEmiInterest] = useState<number>(16200);

  // Client Receipt
  const [clientReceiptAmount, setClientReceiptAmount] = useState<number>(75000);
  const [receiptPaymentMode, setReceiptPaymentMode] = useState<'BANK' | 'CASH'>('BANK');

  // Pump Settlement
  const [pumpSettlementAmount, setPumpSettlementAmount] = useState<number>(50000);

  // Custom Multi-Row Journal
  const [customLines, setCustomLines] = useState<JournalLine[]>([
    { accountCode: '1100', accountName: 'Cash in Hand (Fleet Operational Cash)', debit: 5000, credit: 0, notes: '' },
    { accountCode: '1200', accountName: 'HDFC Fleet Current A/c (50200049281720)', debit: 0, credit: 5000, notes: '' },
  ]);

  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle building double-entry journal lines dynamically based on activeType
  const handleSave = () => {
    setErrorMessage('');
    let lines: JournalLine[] = [];
    let autoNarration = narration.trim();
    let autoRef = referenceNumber.trim();
    let meta: JournalEntry['metadata'] = {};

    const isTruckA = state.vehicles.length > 0 ? (vehiclePlate === state.vehicles[0]?.plateNumber) : true;
    const truckSuffix = isTruckA ? '1001' : '1002';

    if (activeType === 'FREIGHT_BILL') {
      const totalFreight = cargoWeightMT * freightRatePerMT;
      if (totalFreight <= 0) {
        setErrorMessage('Cargo weight and freight rate must be greater than zero.');
        return;
      }
      const client = state.clients.find(c => c.id === clientId);
      const revenueCode = isTruckA ? '4101' : '4102';
      const revenueAcc = state.accounts.find(a => a.code === revenueCode);

      lines = [
        {
          accountCode: '1400',
          accountName: 'Accounts Receivable (Client Freight Dues)',
          debit: totalFreight,
          credit: 0,
          notes: `Bilty freight due from ${client?.clientName || 'Client'}`,
        },
        {
          accountCode: revenueCode,
          accountName: revenueAcc?.name || `Freight Revenue: ${vehiclePlate}`,
          debit: 0,
          credit: totalFreight,
          notes: `${cargoWeightMT} MT @ Rs ${freightRatePerMT}/MT: ${loadingPoint} to ${unloadingPoint}`,
        },
      ];

      autoRef = autoRef || biltyNumber;
      if (!autoNarration) {
        autoNarration = `Freight billed to ${client?.clientName || 'Client'} for ${cargoWeightMT} MT @ ${freightRatePerMT}/MT on LR #${biltyNumber} (${loadingPoint} to ${unloadingPoint})`;
      }
      meta = {
        biltyNumber,
        loadingPoint,
        unloadingPoint,
        cargoWeightMT,
        freightRatePerMT,
      };
    } else if (activeType === 'DIESEL_SLIP') {
      const totalCost = Math.round(fuelLiters * fuelRate * 100) / 100;
      if (totalCost <= 0) {
        setErrorMessage('Fuel liters and rate must be greater than zero.');
        return;
      }
      const fuelExpCode = isTruckA ? '5101' : '5102';
      const fuelExpAcc = state.accounts.find(a => a.code === fuelExpCode);
      const pump = state.pumps.find(p => p.id === pumpId);

      let creditAccountCode = '2201';
      let creditAccountName = 'Fuel Credit Payable: Shri Ram Petroleum IOCL';

      if (fuelPaymentMode === 'CREDIT') {
        if (pumpId === 'PUMP-02') {
          creditAccountCode = '2202';
          creditAccountName = 'Fuel Credit Payable: Karni Kripa Fuel Point BPCL';
        }
      } else if (fuelPaymentMode === 'CASH') {
        creditAccountCode = '1100';
        creditAccountName = 'Cash in Hand (Fleet Operational Cash)';
      } else {
        creditAccountCode = '1200';
        creditAccountName = 'HDFC Fleet Current A/c (50200049281720)';
      }

      lines = [
        {
          accountCode: fuelExpCode,
          accountName: fuelExpAcc?.name || `Diesel Fuel Expense: ${vehiclePlate}`,
          debit: totalCost,
          credit: 0,
          notes: `${fuelLiters} Ltr @ Rs ${fuelRate}/Ltr at ${pump?.pumpName}`,
        },
        {
          accountCode: creditAccountCode,
          accountName: creditAccountName,
          debit: 0,
          credit: totalCost,
          notes: `Fuel slip #${fuelSlipNo} (${fuelPaymentMode})`,
        },
      ];

      autoRef = autoRef || fuelSlipNo;
      if (!autoNarration) {
        autoNarration = `Diesel filled at ${pump?.pumpName || 'Pump'}: ${fuelLiters} Liters @ ${fuelRate}/Ltr (${fuelPaymentMode})`;
      }
      meta = {
        liters: fuelLiters,
        fuelRate,
        odometer,
      };
    } else if (activeType === 'FASTAG_TOLL') {
      if (fastagAction === 'TOLL') {
        if (tollAmount <= 0) {
          setErrorMessage('Toll amount must be greater than zero.');
          return;
        }
        const tollExpCode = isTruckA ? '5201' : '5202';
        const tollExpAcc = state.accounts.find(a => a.code === tollExpCode);

        lines = [
          {
            accountCode: tollExpCode,
            accountName: tollExpAcc?.name || `Toll & Fastag Expense: ${vehiclePlate}`,
            debit: tollAmount,
            credit: 0,
            notes: `Fastag plaza deduction at ${tollPlazaName}`,
          },
          {
            accountCode: '1300',
            accountName: 'Fastag Master Wallet (IDBI/NHAI Fleet Pool)',
            debit: 0,
            credit: tollAmount,
            notes: 'Auto-debit from central Fastag pool wallet',
          },
        ];

        if (!autoNarration) {
          autoNarration = `Fastag toll auto-debit for ${vehiclePlate} at ${tollPlazaName}`;
        }
        meta = { tollPlazaName };
      } else {
        // Fastag Recharge
        if (tollAmount <= 0) {
          setErrorMessage('Recharge amount must be greater than zero.');
          return;
        }
        lines = [
          {
            accountCode: '1300',
            accountName: 'Fastag Master Wallet (IDBI/NHAI Fleet Pool)',
            debit: tollAmount,
            credit: 0,
            notes: 'Fastag pool wallet balance replenishment',
          },
          {
            accountCode: '1200',
            accountName: 'HDFC Fleet Current A/c (50200049281720)',
            debit: 0,
            credit: tollAmount,
            notes: 'Netbanking transfer to Fastag wallet',
          },
        ];

        if (!autoNarration) {
          autoNarration = `Fastag master pool wallet recharge from HDFC Current Account`;
        }
      }
    } else if (activeType === 'DRIVER_BHATTA') {
      if (bhattaAmount <= 0) {
        setErrorMessage('Bhatta amount must be greater than zero.');
        return;
      }
      const bhattaExpCode = isTruckA ? '5301' : '5302';
      const bhattaExpAcc = state.accounts.find(a => a.code === bhattaExpCode);
      const driver = state.drivers.find(d => d.id === driverId);

      const creditCode = bhattaPaymentMode === 'CASH' ? '1100' : '1200';
      const creditName = bhattaPaymentMode === 'CASH' ? 'Cash in Hand (Fleet Operational Cash)' : 'HDFC Fleet Current A/c (50200049281720)';

      lines = [
        {
          accountCode: bhattaExpCode,
          accountName: bhattaExpAcc?.name || `Driver Trip Bhatta & Fooding: ${vehiclePlate}`,
          debit: bhattaAmount,
          credit: 0,
          notes: `Food allowance for ${driver?.fullName || 'Driver'}`,
        },
        {
          accountCode: creditCode,
          accountName: creditName,
          debit: 0,
          credit: bhattaAmount,
          notes: `Paid in ${bhattaPaymentMode}`,
        },
      ];

      if (!autoNarration) {
        autoNarration = `Trip bhatta (daily food allowance) paid to driver ${driver?.fullName || 'Driver'}`;
      }
    } else if (activeType === 'DRIVER_ADVANCE') {
      if (driverAdvanceAmount <= 0) {
        setErrorMessage('Advance amount must be greater than zero.');
        return;
      }
      const driver = state.drivers.find(d => d.id === driverId);
      const advAccountCode = driverId === 'DRV-01' ? '1501' : '1502';
      const advAccount = state.accounts.find(a => a.code === advAccountCode);

      lines = [
        {
          accountCode: advAccountCode,
          accountName: advAccount?.name || `Driver Advance Recoverable: ${driver?.fullName}`,
          debit: driverAdvanceAmount,
          credit: 0,
          notes: advanceReason || 'Personal salary advance',
        },
        {
          accountCode: '1100',
          accountName: 'Cash in Hand (Fleet Operational Cash)',
          debit: 0,
          credit: driverAdvanceAmount,
          notes: 'Cash handed over from drawer',
        },
      ];

      if (!autoNarration) {
        autoNarration = `Personal salary advance given to driver ${driver?.fullName || 'Driver'}: ${advanceReason}`;
      }
    } else if (activeType === 'SALARY_PAYMENT') {
      const netPayable = salaryGrossAmount - salaryAdvanceDeduction;
      if (salaryGrossAmount <= 0 || netPayable < 0) {
        setErrorMessage('Gross salary must exceed recoverable advance deduction.');
        return;
      }
      const driver = state.drivers.find(d => d.id === driverId);
      const salaryPayableCode = driverId === 'DRV-01' ? '2301' : '2302';
      const advanceCode = driverId === 'DRV-01' ? '1501' : '1502';
      const salaryExpCode = driverId === 'DRV-01' ? '6101' : '6102';

      // Record settlement:
      // Dr Driver Base Salary Expense (or Dr Salary Payable)
      // Cr Driver Advance (deduction)
      // Cr Bank / Cash (net cash paid)
      lines = [
        {
          accountCode: salaryExpCode,
          accountName: state.accounts.find(a => a.code === salaryExpCode)?.name || 'Driver Monthly Base Salary',
          debit: salaryGrossAmount,
          credit: 0,
          notes: `Gross salary for ${driver?.fullName}`,
        },
        {
          accountCode: advanceCode,
          accountName: state.accounts.find(a => a.code === advanceCode)?.name || 'Driver Advance Recoverable',
          debit: 0,
          credit: salaryAdvanceDeduction,
          notes: 'Recovery of outstanding cash advance',
        },
        {
          accountCode: '1200',
          accountName: 'HDFC Fleet Current A/c (50200049281720)',
          debit: 0,
          credit: netPayable,
          notes: 'Net salary disbursed via bank transfer',
        },
      ];

      meta = { driverAdvanceDeducted: salaryAdvanceDeduction };
      if (!autoNarration) {
        autoNarration = `Monthly salary settlement for ${driver?.fullName || 'Driver'} (Gross: ${salaryGrossAmount}, Advance Deducted: ${salaryAdvanceDeduction}, Net Paid: ${netPayable})`;
      }
    } else if (activeType === 'MAINTENANCE_REPAIR') {
      if (repairAmount <= 0) {
        setErrorMessage('Repair amount must be greater than zero.');
        return;
      }
      const repExpCode = isTruckA ? '5401' : '5402';
      const repExpAcc = state.accounts.find(a => a.code === repExpCode);

      lines = [
        {
          accountCode: repExpCode,
          accountName: repExpAcc?.name || `En-route Repairs & Punctures: ${vehiclePlate}`,
          debit: repairAmount,
          credit: 0,
          notes: repairType,
        },
        {
          accountCode: '1100',
          accountName: 'Cash in Hand (Fleet Operational Cash)',
          debit: 0,
          credit: repairAmount,
          notes: 'Reimbursed in cash to driver/mechanic',
        },
      ];

      if (!autoNarration) {
        autoNarration = `En-route repairs & maintenance for ${vehiclePlate}: ${repairType}`;
      }
    } else if (activeType === 'EMI_PAYMENT') {
      const totalEMI = emiPrincipal + emiInterest;
      if (totalEMI <= 0) {
        setErrorMessage('EMI principal and interest must be greater than zero.');
        return;
      }
      const loanLiabilityCode = isTruckA ? '2101' : '2102';
      const loanInterestCode = isTruckA ? '6201' : '6202';

      lines = [
        {
          accountCode: loanLiabilityCode,
          accountName: state.accounts.find(a => a.code === loanLiabilityCode)?.name || 'Vehicle Loan Principal',
          debit: emiPrincipal,
          credit: 0,
          notes: 'Reduction of vehicle loan liability',
        },
        {
          accountCode: loanInterestCode,
          accountName: state.accounts.find(a => a.code === loanInterestCode)?.name || 'Vehicle Loan Finance Interest',
          debit: emiInterest,
          credit: 0,
          notes: 'Finance interest component of EMI',
        },
        {
          accountCode: '1200',
          accountName: 'HDFC Fleet Current A/c (50200049281720)',
          debit: 0,
          credit: totalEMI,
          notes: 'Auto-debit for monthly EMI',
        },
      ];

      meta = {
        loanPrincipalAmount: emiPrincipal,
        loanInterestAmount: emiInterest,
      };
      if (!autoNarration) {
        autoNarration = `Monthly loan installment for ${vehiclePlate} (Principal: ${emiPrincipal}, Interest: ${emiInterest})`;
      }
    } else if (activeType === 'CLIENT_RECEIPT') {
      if (clientReceiptAmount <= 0) {
        setErrorMessage('Receipt amount must be greater than zero.');
        return;
      }
      const client = state.clients.find(c => c.id === clientId);
      const debitCode = receiptPaymentMode === 'BANK' ? '1200' : '1100';
      const debitName = receiptPaymentMode === 'BANK' ? 'HDFC Fleet Current A/c (50200049281720)' : 'Cash in Hand (Fleet Operational Cash)';

      lines = [
        {
          accountCode: debitCode,
          accountName: debitName,
          debit: clientReceiptAmount,
          credit: 0,
          notes: `Freight payment collected via ${receiptPaymentMode}`,
        },
        {
          accountCode: '1400',
          accountName: 'Accounts Receivable (Client Freight Dues)',
          debit: 0,
          credit: clientReceiptAmount,
          notes: `Payment against pending dues from ${client?.clientName}`,
        },
      ];

      if (!autoNarration) {
        autoNarration = `Freight dues receipt from ${client?.clientName || 'Client'} via ${receiptPaymentMode}`;
      }
    } else if (activeType === 'PUMP_SETTLEMENT') {
      if (pumpSettlementAmount <= 0) {
        setErrorMessage('Settlement amount must be greater than zero.');
        return;
      }
      const pump = state.pumps.find(p => p.id === pumpId);
      const creditPayableCode = pumpId === 'PUMP-01' ? '2201' : '2202';

      lines = [
        {
          accountCode: creditPayableCode,
          accountName: state.accounts.find(a => a.code === creditPayableCode)?.name || 'Fuel Credit Payable',
          debit: pumpSettlementAmount,
          credit: 0,
          notes: `Settlement of diesel credit for ${pump?.pumpName}`,
        },
        {
          accountCode: '1200',
          accountName: 'HDFC Fleet Current A/c (50200049281720)',
          debit: 0,
          credit: pumpSettlementAmount,
          notes: 'Bank transfer payment to petrol pump',
        },
      ];

      if (!autoNarration) {
        autoNarration = `Fuel credit bill settlement payment to ${pump?.pumpName || 'Fuel Pump'} from HDFC Bank`;
      }
    } else if (activeType === 'JOURNAL_ENTRY') {
      // Validate custom lines
      let totalDr = 0;
      let totalCr = 0;
      for (const l of customLines) {
        totalDr += l.debit || 0;
        totalCr += l.credit || 0;
      }
      if (Math.abs(totalDr - totalCr) > 0.01) {
        setErrorMessage(`Double-entry out of balance: Total Debits (${formatINR(totalDr)}) must equal Total Credits (${formatINR(totalCr)}). Difference: ${formatINR(Math.abs(totalDr - totalCr))}`);
        return;
      }
      if (totalDr <= 0) {
        setErrorMessage('Journal entries must have a positive transaction amount.');
        return;
      }
      lines = customLines;
      if (!autoNarration) {
        autoNarration = 'General double-entry adjustment voucher';
      }
    }

    // Verify lines balance strictly
    const sumDebits = lines.reduce((acc, l) => acc + (l.debit || 0), 0);
    const sumCredits = lines.reduce((acc, l) => acc + (l.credit || 0), 0);

    if (Math.abs(sumDebits - sumCredits) > 0.05) {
      setErrorMessage(`Accounting imbalance detected: Debits (${sumDebits}) != Credits (${sumCredits})`);
      return;
    }

    const newVoucherNumber = generateNextVoucherNumber('VR', state.journalEntries.length);

    const newEntry: JournalEntry = {
      id: `VR-${Date.now()}`,
      voucherNumber: newVoucherNumber,
      date,
      voucherType: activeType,
      vehiclePlate: (activeType === 'CLIENT_RECEIPT' || activeType === 'PUMP_SETTLEMENT' || (activeType === 'FASTAG_TOLL' && fastagAction === 'RECHARGE')) ? 'COMPANY' : vehiclePlate,
      driverId: (activeType === 'DRIVER_BHATTA' || activeType === 'DRIVER_ADVANCE' || activeType === 'SALARY_PAYMENT') ? driverId : undefined,
      clientId: (activeType === 'FREIGHT_BILL' || activeType === 'CLIENT_RECEIPT') ? clientId : undefined,
      pumpId: (activeType === 'DIESEL_SLIP' || activeType === 'PUMP_SETTLEMENT') ? pumpId : undefined,
      referenceNumber: autoRef || undefined,
      narration: autoNarration,
      lines,
      metadata: Object.keys(meta).length > 0 ? meta : undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveEntry(newEntry);
    onClose();
  };

  const voucherTypesList: { id: VoucherType; label: string; icon: any }[] = [
    { id: 'FREIGHT_BILL', label: 'Freight Bill (LR)', icon: Receipt },
    { id: 'DIESEL_SLIP', label: 'Diesel Fuel Slip', icon: Fuel },
    { id: 'FASTAG_TOLL', label: 'Fastag & Toll', icon: CreditCard },
    { id: 'DRIVER_BHATTA', label: 'Driver Bhatta', icon: Utensils },
    { id: 'DRIVER_ADVANCE', label: 'Driver Advance', icon: UserCheck },
    { id: 'SALARY_PAYMENT', label: 'Salary Settlement', icon: Building },
    { id: 'MAINTENANCE_REPAIR', label: 'Repairs & Tyres', icon: Wrench },
    { id: 'EMI_PAYMENT', label: 'Truck Loan EMI', icon: ArrowRightLeft },
    { id: 'CLIENT_RECEIPT', label: 'Client Receipt', icon: CheckCircle2 },
    { id: 'PUMP_SETTLEMENT', label: 'Pay Fuel Pump', icon: Building },
    { id: 'JOURNAL_ENTRY', label: 'Tally Journal (Dr/Cr)', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight">DOUBLE-ENTRY VOUCHER ENTRY</span>
            <span className="text-xs font-mono bg-blue-600 px-2 py-0.5 rounded text-white font-medium">
              Tally-Standard
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Type Tabs */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex flex-wrap gap-1.5 overflow-x-auto">
          {voucherTypesList.map(item => {
            const Icon = item.icon;
            const isSelected = activeType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveType(item.id);
                  setErrorMessage('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-3.5 py-2 rounded text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Common Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Entry Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Vehicle Tag (License Plate)
              </label>
              <select
                value={vehiclePlate}
                onChange={e => setVehiclePlate(e.target.value)}
                disabled={activeType === 'CLIENT_RECEIPT' || activeType === 'PUMP_SETTLEMENT' || (activeType === 'FASTAG_TOLL' && fastagAction === 'RECHARGE')}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-blue-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                {state.vehicles.map(v => (
                  <option key={v.plateNumber} value={v.plateNumber}>
                    {v.plateNumber} : {v.model.split('(')[0]}
                  </option>
                ))}
                <option value="COMPANY">COMPANY (Consolidated Fleet)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Reference / Bill / Slip #
              </label>
              <input
                type="text"
                placeholder="e.g. LR-9821, SLIP-4401"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* DYNAMIC FORM PER VOUCHER TYPE */}

          {/* 1. FREIGHT BILL */}
          {activeType === 'FREIGHT_BILL' && (
            <div className="space-y-3 bg-blue-50/50 p-3.5 rounded border border-blue-200 text-xs">
              <div className="font-semibold text-blue-900 flex items-center justify-between">
                <span>FREIGHT BILTY / LORRY RECEIPT (LR) BILLING</span>
                <span className="font-mono text-emerald-700 font-bold text-sm">
                  Total Freight: {formatINR(cargoWeightMT * freightRatePerMT)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Client / Consignor</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.clientName} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Bilty / LR Number</label>
                  <input
                    type="text"
                    value={biltyNumber}
                    onChange={e => setBiltyNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Origin (Loading)</label>
                  <input
                    type="text"
                    value={loadingPoint}
                    onChange={e => setLoadingPoint(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Destination</label>
                  <input
                    type="text"
                    value={unloadingPoint}
                    onChange={e => setUnloadingPoint(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Cargo Weight (MT)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cargoWeightMT}
                    onChange={e => setCargoWeightMT(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Freight Rate (₹ / MT)</label>
                  <input
                    type="number"
                    value={freightRatePerMT}
                    onChange={e => setFreightRatePerMT(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Tally posting preview */}
              <div className="bg-white p-2.5 rounded border border-slate-300 text-[11px] font-mono space-y-1">
                <div className="text-slate-500 font-sans font-semibold text-[10px] uppercase">
                  Automated Double-Entry Posting Preview:
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Dr Accounts Receivable (Client Freight Dues) [1400]:</span>
                  <span className="font-bold text-blue-700">{formatINR(cargoWeightMT * freightRatePerMT)}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span className="pl-4">Cr Freight Revenue ({vehiclePlate}) [{state.vehicles[0]?.plateNumber === vehiclePlate ? '4101' : '4102'}]:</span>
                  <span className="font-bold text-emerald-700">{formatINR(cargoWeightMT * freightRatePerMT)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. DIESEL FUEL SLIP */}
          {activeType === 'DIESEL_SLIP' && (
            <div className="space-y-3 bg-amber-50/50 p-3.5 rounded border border-amber-200 text-xs">
              <div className="font-semibold text-amber-950 flex items-between justify-between">
                <span>DIESEL FUEL ENTRY (PER-TRUCK FUEL EXPENSE)</span>
                <span className="font-mono text-rose-700 font-bold text-sm">
                  Total Cost: {formatINR(fuelLiters * fuelRate)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Fuel Pump Station</label>
                  <select
                    value={pumpId}
                    onChange={e => setPumpId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.pumps.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.pumpName} ({p.location.split(',')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                  <select
                    value={fuelPaymentMode}
                    onChange={e => setFuelPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="CREDIT">Pump Credit (Payable to Petrol Pump)</option>
                    <option value="CASH">Cash in Hand (Operational Cash)</option>
                    <option value="BANK">HDFC Bank Direct Transfer / Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Pump Slip Receipt #</label>
                  <input
                    type="text"
                    value={fuelSlipNo}
                    onChange={e => setFuelSlipNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Fuel Quantity (Liters)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={fuelLiters}
                    onChange={e => setFuelLiters(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Fuel Rate (₹ / Liter)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fuelRate}
                    onChange={e => setFuelRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Odometer (Km)</label>
                  <input
                    type="number"
                    value={odometer}
                    onChange={e => setOdometer(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-300 text-[11px] font-mono space-y-1">
                <div className="text-slate-500 font-sans font-semibold text-[10px] uppercase">
                  Posting Preview:
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>Dr Diesel Fuel Expense ({vehiclePlate}) [{state.vehicles[0]?.plateNumber === vehiclePlate ? '5101' : '5102'}]:</span>
                  <span className="font-bold text-rose-700">{formatINR(fuelLiters * fuelRate)}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span className="pl-4">
                    Cr {fuelPaymentMode === 'CREDIT' ? 'Fuel Credit Payable (Petrol Pump)' : fuelPaymentMode === 'CASH' ? 'Cash in Hand [1100]' : 'HDFC Bank [1200]'}:
                  </span>
                  <span className="font-bold text-slate-700">{formatINR(fuelLiters * fuelRate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. FASTAG & TOLL */}
          {activeType === 'FASTAG_TOLL' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
              <div className="flex gap-4 border-b border-slate-200 pb-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="fastagAction"
                    checked={fastagAction === 'TOLL'}
                    onChange={() => setFastagAction('TOLL')}
                    className="text-blue-600"
                  />
                  <span>Toll Plaza Auto-Deduction (Expense)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="fastagAction"
                    checked={fastagAction === 'RECHARGE'}
                    onChange={() => setFastagAction('RECHARGE')}
                    className="text-blue-600"
                  />
                  <span>Fastag Pool Wallet Top-Up (From Bank)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {fastagAction === 'TOLL' ? 'Toll Deduction Amount (₹)' : 'Recharge Top-Up Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={tollAmount}
                    onChange={e => setTollAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>

                {fastagAction === 'TOLL' && (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Toll Plaza Name / NH Stretch</label>
                    <input
                      type="text"
                      value={tollPlazaName}
                      onChange={e => setTollPlazaName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. DRIVER BHATTA */}
          {activeType === 'DRIVER_BHATTA' && (
            <div className="space-y-3 bg-emerald-50/40 p-3.5 rounded border border-emerald-200 text-xs">
              <div className="font-semibold text-emerald-950">
                DRIVER DAILY BHATTA (FOODING ALLOWANCE PER TRIP)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Driver Profile</label>
                  <select
                    value={driverId}
                    onChange={e => setDriverId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.assignedPlateNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Bhatta Amount (₹)</label>
                  <input
                    type="number"
                    value={bhattaAmount}
                    onChange={e => setBhattaAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Disbursed From</label>
                  <select
                    value={bhattaPaymentMode}
                    onChange={e => setBhattaPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="CASH">Cash in Hand (Operational Petty Cash)</option>
                    <option value="BANK">HDFC Bank (Direct UPI Transfer)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. DRIVER ADVANCE */}
          {activeType === 'DRIVER_ADVANCE' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900">
                DRIVER PERSONAL CASH ADVANCE (RECOVERABLE ASSET)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Driver Recipient</label>
                  <select
                    value={driverId}
                    onChange={e => setDriverId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} (Advance Balance: {formatINR(d.currentAdvanceBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Advance Amount (₹)</label>
                  <input
                    type="number"
                    value={driverAdvanceAmount}
                    onChange={e => setDriverAdvanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Purpose / Note</label>
                  <input
                    type="text"
                    value={advanceReason}
                    onChange={e => setAdvanceReason(e.target.value)}
                    placeholder="e.g. Festival advance, emergency"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. SALARY SETTLEMENT */}
          {activeType === 'SALARY_PAYMENT' && (
            <div className="space-y-3 bg-blue-50/40 p-3.5 rounded border border-blue-200 text-xs">
              <div className="font-semibold text-blue-900 flex justify-between">
                <span>MONTHLY DRIVER SALARY SETTLEMENT &amp; ADVANCE RECOVERY</span>
                <span className="font-mono text-emerald-800 font-bold">
                  Net Disbursed: {formatINR(salaryGrossAmount - salaryAdvanceDeduction)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Driver Profile</label>
                  <select
                    value={driverId}
                    onChange={e => {
                      setDriverId(e.target.value);
                      const d = state.drivers.find(drv => drv.id === e.target.value);
                      if (d) {
                        setSalaryGrossAmount(d.baseMonthlySalary);
                        setSalaryAdvanceDeduction(d.currentAdvanceBalance);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} (Base: {formatINR(d.baseMonthlySalary)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={salaryGrossAmount}
                    onChange={e => setSalaryGrossAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Advance Deducted (₹)</label>
                  <input
                    type="number"
                    value={salaryAdvanceDeduction}
                    onChange={e => setSalaryAdvanceDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono text-rose-700 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. MAINTENANCE & REPAIRS */}
          {activeType === 'MAINTENANCE_REPAIR' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900">
                EN-ROUTE TYRE, PUNCTURE &amp; WORKSHOP REPAIR EXPENSE
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Expense Description</label>
                  <input
                    type="text"
                    value={repairType}
                    onChange={e => setRepairType(e.target.value)}
                    placeholder="e.g. 2 Punctures + Grease pack, air pipe replacement"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Amount Paid in Cash (₹)</label>
                  <input
                    type="number"
                    value={repairAmount}
                    onChange={e => setRepairAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. EMI PAYMENT */}
          {activeType === 'EMI_PAYMENT' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900 flex justify-between">
                <span>COMMERCIAL VEHICLE LOAN EMI DEBIT</span>
                <span className="font-mono text-slate-900 font-bold">
                  Total EMI: {formatINR(emiPrincipal + emiInterest)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Principal Repayment (₹)</label>
                  <input
                    type="number"
                    value={emiPrincipal}
                    onChange={e => setEmiPrincipal(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Reduces vehicle loan principal balance</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Interest Component (₹)</label>
                  <input
                    type="number"
                    value={emiInterest}
                    onChange={e => setEmiInterest(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Charged as monthly finance overhead</span>
                </div>
              </div>
            </div>
          )}

          {/* 9. CLIENT FREIGHT RECEIPT */}
          {activeType === 'CLIENT_RECEIPT' && (
            <div className="space-y-3 bg-emerald-50/40 p-3.5 rounded border border-emerald-200 text-xs">
              <div className="font-semibold text-emerald-950">
                CLIENT FREIGHT INVOICE PAYMENT COLLECTION
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Client / Consignor</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.clientName} (Dues: {formatINR(c.currentReceivableBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Amount Collected (₹)</label>
                  <input
                    type="number"
                    value={clientReceiptAmount}
                    onChange={e => setClientReceiptAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Received In</label>
                  <select
                    value={receiptPaymentMode}
                    onChange={e => setReceiptPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="BANK">HDFC Bank Current A/c (RTGS / NEFT / IMPS)</option>
                    <option value="CASH">Cash in Hand (Counter Cash)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 10. PUMP SETTLEMENT */}
          {activeType === 'PUMP_SETTLEMENT' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900">
                PAYMENT TO DIESEL PUMP (CREDIT CLEARANCE)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Petrol Pump</label>
                  <select
                    value={pumpId}
                    onChange={e => setPumpId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {state.pumps.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.pumpName} (Balance: {formatINR(p.currentOutstandingPayable)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={pumpSettlementAmount}
                    onChange={e => setPumpSettlementAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 11. GENERAL TALLY JOURNAL (MULTI-ROW) */}
          {activeType === 'JOURNAL_ENTRY' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  MANUAL DOUBLE-ENTRY JOURNAL LINES
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomLines([
                      ...customLines,
                      { accountCode: '1100', accountName: 'Cash in Hand (Fleet Operational Cash)', debit: 0, credit: 0 },
                    ]);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2">
                {customLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-300">
                    <select
                      value={line.accountCode}
                      onChange={e => {
                        const code = e.target.value;
                        const acc = state.accounts.find(a => a.code === code);
                        const updated = [...customLines];
                        updated[idx].accountCode = code;
                        updated[idx].accountName = acc?.name || '';
                        setCustomLines(updated);
                      }}
                      className="w-1/2 px-2 py-1 border border-slate-300 rounded text-xs"
                    >
                      {state.accounts.map(a => (
                        <option key={a.code} value={a.code}>
                          [{a.code}] {a.name}
                        </option>
                      ))}
                    </select>

                    <div className="w-1/4">
                      <input
                        type="number"
                        placeholder="Debit (₹)"
                        value={line.debit || ''}
                        onChange={e => {
                          const updated = [...customLines];
                          updated[idx].debit = parseFloat(e.target.value) || 0;
                          if (updated[idx].debit > 0) updated[idx].credit = 0;
                          setCustomLines(updated);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div className="w-1/4">
                      <input
                        type="number"
                        placeholder="Credit (₹)"
                        value={line.credit || ''}
                        onChange={e => {
                          const updated = [...customLines];
                          updated[idx].credit = parseFloat(e.target.value) || 0;
                          if (updated[idx].credit > 0) updated[idx].debit = 0;
                          setCustomLines(updated);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    {customLines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomLines(customLines.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Balance Check */}
              <div className="flex justify-between items-center text-xs font-mono font-bold pt-2 border-t border-slate-300">
                <span>Total Debit: {formatINR(customLines.reduce((s, l) => s + (l.debit || 0), 0))}</span>
                <span>Total Credit: {formatINR(customLines.reduce((s, l) => s + (l.credit || 0), 0))}</span>
              </div>
            </div>
          )}

          {/* Narration Field */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Voucher Narration / Audit Note
            </label>
            <input
              type="text"
              placeholder="Leave blank to auto-generate standard narration, or enter specific transaction notes"
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-slate-100 rounded-b-lg border-t border-slate-300 w-full">
          <div className="text-[11px] text-slate-500 font-mono text-center sm:text-left">
            Voucher automatically posts balanced Dr/Cr lines into the general ledger
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 min-h-[42px] text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200 rounded border border-slate-300 flex items-center justify-center transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-5 py-2 min-h-[42px] text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded border border-blue-500 shadow-sm flex items-center justify-center transition-colors whitespace-nowrap"
            >
              Post Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

