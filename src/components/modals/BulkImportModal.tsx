import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Truck,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppState } from '../../services/storage';
import { JournalEntry } from '../../types/accounting';
import { isValidLicensePlate, normalizeLicensePlate, formatINR, generateNextVoucherNumber } from '../../services/formatters';

interface BulkImportModalProps {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
  onImportEntries: (entries: JournalEntry[]) => void;
}

interface ParsedImportRow {
  rowNumber: number;
  date: string;
  truckPlate: string;
  driverName: string;
  entryType: 'Revenue' | 'Expense' | string;
  category: 'Fuel' | 'Toll' | 'Salary' | 'Freight' | 'Bhatta' | 'Maintenance' | string;
  amount: number;
  paymentMode: 'Cash' | 'Bank' | 'Credit' | 'Fastag' | string;
  notes: string;
  isValid: boolean;
  validationError?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  state,
  isOpen,
  onClose,
  onImportEntries,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const registeredPlates = state.vehicles.map(v => v.plateNumber.toUpperCase());
  const samplePlateA = state.vehicles[0]?.plateNumber || 'RJ-14-GB-1001';
  const samplePlateB = state.vehicles[1]?.plateNumber || 'RJ-14-GB-1002';

  // 1. Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Date',
      'Truck_Plate',
      'Driver_Name',
      'Entry_Type',
      'Category',
      'Amount',
      'Payment_Mode',
      'Notes',
    ];

    const today = new Date().toISOString().split('T')[0];
    const sampleRows = [
      [today, samplePlateA, 'Mohan Singh', 'Revenue', 'Freight', 45000, 'Credit', 'UltraTech Cement dispatch Bilty #LR-8821'],
      [today, samplePlateA, 'Mohan Singh', 'Expense', 'Fuel', 18500, 'Credit', '200 Liters Diesel at Shri Ram IOCL'],
      [today, samplePlateA, 'Mohan Singh', 'Expense', 'Toll', 2450, 'Fastag', 'Fastag toll plaza auto-debit on NH-48'],
      [today, samplePlateA, 'Mohan Singh', 'Expense', 'Bhatta', 1400, 'Cash', 'Driver 4 days food allowance'],
      [today, samplePlateB, 'Rajesh Sharma', 'Revenue', 'Freight', 52000, 'Bank', 'Wonder Cement freight RTGS payment'],
      [today, samplePlateB, 'Rajesh Sharma', 'Expense', 'Fuel', 21000, 'Cash', 'Cash diesel purchase on bypass'],
      [today, samplePlateB, 'Rajesh Sharma', 'Expense', 'Maintenance', 1200, 'Cash', 'En-route tyre puncture and greasing'],
    ];

    const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fleetledger_import_template_${samplePlateA}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse uploaded file (.xlsx, .xls, .csv, or Tally XML)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');
    setSuccessMessage('');
    setParsedRows([]);

    const reader = new FileReader();

    // Check if XML
    if (file.name.endsWith('.xml')) {
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          parseTallyXML(text);
        } catch (err: any) {
          setErrorMessage('Failed to parse Tally XML file: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      // Use XLSX parser for .xlsx, .xls, and .csv
      reader.onload = event => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rawTable: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          parseTableData(rawTable);
        } catch (err: any) {
          setErrorMessage('Failed to read file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Parse tabular data
  const parseTableData = (table: any[][]) => {
    if (!table || table.length < 2) {
      setErrorMessage('The uploaded file does not contain enough data rows.');
      return;
    }

    // Find header indices
    const headerRow = table[0].map(h => String(h || '').trim().toLowerCase().replace(/[\s_-]+/g, ''));
    const dateIdx = headerRow.findIndex(h => h.includes('date'));
    const plateIdx = headerRow.findIndex(h => h.includes('truck') || h.includes('plate') || h.includes('vehicle'));
    const driverIdx = headerRow.findIndex(h => h.includes('driver'));
    const typeIdx = headerRow.findIndex(h => h.includes('entry') || h.includes('type'));
    const catIdx = headerRow.findIndex(h => h.includes('cat') || h.includes('head') || h.includes('account'));
    const amountIdx = headerRow.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('credit') || h.includes('value'));
    const modeIdx = headerRow.findIndex(h => h.includes('mode') || h.includes('payment') || h.includes('bank') || h.includes('cash'));
    const notesIdx = headerRow.findIndex(h => h.includes('note') || h.includes('narration') || h.includes('desc') || h.includes('ref'));

    if (amountIdx === -1) {
      setErrorMessage('Missing "Amount" column in the uploaded file header.');
      return;
    }

    const rows: ParsedImportRow[] = [];

    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (!row || row.every((c: any) => c === '' || c === undefined || c === null)) continue;

      const rawDate = dateIdx !== -1 ? String(row[dateIdx] || '').trim() : '';
      const rawPlate = plateIdx !== -1 ? String(row[plateIdx] || '').trim() : '';
      const rawDriver = driverIdx !== -1 ? String(row[driverIdx] || '').trim() : '';
      const rawType = typeIdx !== -1 ? String(row[typeIdx] || '').trim() : '';
      const rawCat = catIdx !== -1 ? String(row[catIdx] || '').trim() : '';
      const rawAmount = amountIdx !== -1 ? parseFloat(String(row[amountIdx]).replace(/[^0-9.-]/g, '')) : 0;
      const rawMode = modeIdx !== -1 ? String(row[modeIdx] || '').trim() : 'Bank';
      const rawNotes = notesIdx !== -1 ? String(row[notesIdx] || '').trim() : '';

      // Validate Date
      let parsedDate = rawDate;
      if (typeof row[dateIdx] === 'number') {
        // Excel serial date number
        try {
          const dateObj = XLSX.SSF.parse_date_code(row[dateIdx]);
          parsedDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
        } catch {
          parsedDate = new Date().toISOString().split('T')[0];
        }
      } else if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      } else if (!rawDate) {
        parsedDate = new Date().toISOString().split('T')[0];
      }

      // Format plate
      const normalizedPlate = normalizeLicensePlate(rawPlate);

      // Validation
      let isValid = true;
      let validationError = '';

      if (isNaN(rawAmount) || rawAmount <= 0) {
        isValid = false;
        validationError = 'Amount must be greater than zero.';
      } else if (registeredPlates.length > 0 && !registeredPlates.includes(normalizedPlate.toUpperCase())) {
        isValid = false;
        validationError = `Truck plate "${normalizedPlate}" does not match any registered truck (${registeredPlates.join(', ')}).`;
      }

      // Normalize category
      let category = rawCat || 'Freight';
      const catLower = rawCat.toLowerCase();
      let entryType = rawType;

      if (catLower.includes('fuel') || catLower.includes('diesel') || catLower.includes('gas')) {
        category = 'Fuel';
        entryType = 'Expense';
      } else if (catLower.includes('toll') || catLower.includes('fastag')) {
        category = 'Toll';
        entryType = 'Expense';
      } else if (catLower.includes('salary') || catLower.includes('wages')) {
        category = 'Salary';
        entryType = 'Expense';
      } else if (catLower.includes('bhatta') || catLower.includes('food')) {
        category = 'Bhatta';
        entryType = 'Expense';
      } else if (catLower.includes('repair') || catLower.includes('maint') || catLower.includes('puncture')) {
        category = 'Maintenance';
        entryType = 'Expense';
      } else if (catLower.includes('freight') || catLower.includes('revenue') || catLower.includes('bilty') || catLower.includes('lr')) {
        category = 'Freight';
        entryType = 'Revenue';
      } else if (!entryType) {
        entryType = 'Expense';
      }

      rows.push({
        rowNumber: i + 1,
        date: parsedDate,
        truckPlate: normalizedPlate,
        driverName: rawDriver,
        entryType: entryType || 'Expense',
        category,
        amount: Math.abs(rawAmount) || 0,
        paymentMode: rawMode || 'Bank',
        notes: rawNotes || `${category} entry imported from file`,
        isValid,
        validationError,
      });
    }

    setParsedRows(rows);
    if (rows.length === 0) {
      setErrorMessage('No valid transaction rows found in the uploaded file.');
    }
  };

  // Parse Tally XML export
  const parseTallyXML = (xmlText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const vouchers = xmlDoc.getElementsByTagName('VOUCHER');

      if (!vouchers || vouchers.length === 0) {
        setErrorMessage('No <VOUCHER> elements found in Tally XML file.');
        return;
      }

      const rows: ParsedImportRow[] = [];

      for (let i = 0; i < vouchers.length; i++) {
        const v = vouchers[i];
        const rawDate = v.getElementsByTagName('DATE')[0]?.textContent || '';
        const rawNarration = v.getElementsByTagName('NARRATION')[0]?.textContent || '';
        const vType = v.getElementsByTagName('VOUCHERTYPENAME')[0]?.textContent || '';
        const amountStr = v.getElementsByTagName('AMOUNT')[0]?.textContent || '0';
        const rawAmount = Math.abs(parseFloat(amountStr)) || 0;

        let parsedDate = new Date().toISOString().split('T')[0];
        if (rawDate && rawDate.length === 8) {
          parsedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
        }

        // Try extracting truck plate from narration
        let detectedPlate = registeredPlates[0] || samplePlateA;
        for (const p of registeredPlates) {
          if (rawNarration.toUpperCase().includes(p)) {
            detectedPlate = p;
            break;
          }
        }

        rows.push({
          rowNumber: i + 1,
          date: parsedDate,
          truckPlate: detectedPlate,
          driverName: '',
          entryType: vType.toLowerCase().includes('sales') || vType.toLowerCase().includes('receipt') ? 'Revenue' : 'Expense',
          category: vType.toLowerCase().includes('sales') ? 'Freight' : 'Fuel',
          amount: rawAmount,
          paymentMode: 'Bank',
          notes: rawNarration || `Tally voucher ${vType}`,
          isValid: rawAmount > 0,
          validationError: rawAmount <= 0 ? 'Amount is zero' : undefined,
        });
      }

      setParsedRows(rows);
    } catch (err: any) {
      setErrorMessage('XML parsing error: ' + err.message);
    }
  };

  // 3. Process & Import Valid Rows into Double-Entry Journal
  const handleImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('No valid rows available to import.');
      return;
    }

    const newEntries: JournalEntry[] = [];
    let counter = state.journalEntries.length;

    for (const row of validRows) {
      counter++;
      const truckIndex = state.vehicles.findIndex(
        v => v.plateNumber.toUpperCase() === row.truckPlate.toUpperCase()
      );
      const suffix = truckIndex === 1 ? '02' : '01';
      const targetPlate = row.truckPlate;

      const pMode = row.paymentMode.toUpperCase();

      if (row.category === 'Freight' || row.entryType === 'Revenue') {
        const voucherNo = generateNextVoucherNumber('LR', counter);
        const drCode = pMode.includes('CASH') ? '1100' : pMode.includes('CREDIT') ? '1400' : '1200';
        const drName = drCode === '1100'
          ? 'Cash in Hand (Fleet Operational Cash)'
          : drCode === '1400'
          ? 'Accounts Receivable (Client Freight Dues)'
          : 'Bank Fleet Current A/c';

        const crCode = suffix === '01' ? '4101' : '4102';

        newEntries.push({
          id: `VR-IMP-${Date.now()}-${counter}`,
          voucherNumber: voucherNo,
          date: row.date,
          voucherType: 'FREIGHT_BILL',
          vehiclePlate: targetPlate,
          narration: row.notes || `Freight billing for ${targetPlate}`,
          lines: [
            { accountCode: drCode, accountName: drName, debit: row.amount, credit: 0, notes: `Imported via ${row.paymentMode}` },
            { accountCode: crCode, accountName: `Freight Revenue: ${targetPlate}`, debit: 0, credit: row.amount, notes: 'Freight billing' },
          ],
          createdAt: new Date().toISOString(),
        });
      } else if (row.category === 'Fuel') {
        const voucherNo = generateNextVoucherNumber('DS', counter);
        const drCode = suffix === '01' ? '5101' : '5102';
        const crCode = pMode.includes('CASH') ? '1100' : pMode.includes('CREDIT') ? (suffix === '01' ? '2201' : '2202') : '1200';
        const crName = crCode === '1100'
          ? 'Cash in Hand (Fleet Operational Cash)'
          : crCode.startsWith('22')
          ? 'Fuel Credit Payable (Pump Account)'
          : 'Bank Fleet Current A/c';

        newEntries.push({
          id: `VR-IMP-${Date.now()}-${counter}`,
          voucherNumber: voucherNo,
          date: row.date,
          voucherType: 'DIESEL_SLIP',
          vehiclePlate: targetPlate,
          narration: row.notes || `Diesel fuel expense for ${targetPlate}`,
          lines: [
            { accountCode: drCode, accountName: `Diesel Fuel Expense: ${targetPlate}`, debit: row.amount, credit: 0, notes: 'Diesel expense' },
            { accountCode: crCode, accountName: crName, debit: 0, credit: row.amount, notes: `Paid via ${row.paymentMode}` },
          ],
          createdAt: new Date().toISOString(),
        });
      } else if (row.category === 'Toll') {
        const voucherNo = generateNextVoucherNumber('FT', counter);
        const drCode = suffix === '01' ? '5201' : '5202';
        const crCode = pMode.includes('CASH') ? '1100' : pMode.includes('BANK') ? '1200' : '1300';
        const crName = crCode === '1300' ? 'Fastag Master Wallet (NHAI Fleet Pool)' : crCode === '1100' ? 'Cash in Hand' : 'Bank Fleet Current A/c';

        newEntries.push({
          id: `VR-IMP-${Date.now()}-${counter}`,
          voucherNumber: voucherNo,
          date: row.date,
          voucherType: 'FASTAG_TOLL',
          vehiclePlate: targetPlate,
          narration: row.notes || `Highway toll & fastag deduction for ${targetPlate}`,
          lines: [
            { accountCode: drCode, accountName: `Toll & Fastag Expense: ${targetPlate}`, debit: row.amount, credit: 0, notes: 'Highway toll' },
            { accountCode: crCode, accountName: crName, debit: 0, credit: row.amount, notes: `Payment mode ${row.paymentMode}` },
          ],
          createdAt: new Date().toISOString(),
        });
      } else if (row.category === 'Salary') {
        const voucherNo = generateNextVoucherNumber('SP', counter);
        const drCode = suffix === '01' ? '6101' : '6102';
        const crCode = pMode.includes('CASH') ? '1100' : '1200';

        newEntries.push({
          id: `VR-IMP-${Date.now()}-${counter}`,
          voucherNumber: voucherNo,
          date: row.date,
          voucherType: 'SALARY_PAYMENT',
          vehiclePlate: targetPlate,
          narration: row.notes || `Driver salary disbursement for ${targetPlate}`,
          lines: [
            { accountCode: drCode, accountName: `Driver Monthly Base Salary: ${targetPlate}`, debit: row.amount, credit: 0, notes: 'Salary expense' },
            { accountCode: crCode, accountName: crCode === '1100' ? 'Cash in Hand' : 'Bank Fleet Current A/c', debit: 0, credit: row.amount, notes: 'Disbursed' },
          ],
          createdAt: new Date().toISOString(),
        });
      } else if (row.category === 'Bhatta') {
        const voucherNo = generateNextVoucherNumber('BH', counter);
        const drCode = suffix === '01' ? '5301' : '5302';
        const crCode = pMode.includes('BANK') ? '1200' : '1100';

        newEntries.push({
          id: `VR-IMP-${Date.now()}-${counter}`,
          voucherNumber: voucherNo,
          date: row.date,
          voucherType: 'DRIVER_BHATTA',
          vehiclePlate: targetPlate,
          narration: row.notes || `Driver fooding bhatta allowance for ${targetPlate}`,
          lines: [
            { accountCode: drCode, accountName: `Driver Trip Bhatta & Fooding: ${targetPlate}`, debit: row.amount, credit: 0, notes: 'Fooding bhatta' },
            { accountCode: crCode, accountName: crCode === '1100' ? 'Cash in Hand' : 'Bank Fleet Current A/c', debit: 0, credit: row.amount, notes: 'Paid in cash' },
          ],
          createdAt: new Date().toISOString(),
        });
      } else {
        // Maintenance / General Expense
        const voucherNo = generateNextVoucherNumber('EX', counter);
        const drCode = suffix === '01' ? '5401' : '5402';
        const crCode = pMode.includes('CREDIT') ? '2400' : pMode.includes('BANK') ? '1200' : '1100';

        newEntries.push({
          id: `VR-IMP-${Date.now()}-${counter}`,
          voucherNumber: voucherNo,
          date: row.date,
          voucherType: 'MAINTENANCE_REPAIR',
          vehiclePlate: targetPlate,
          narration: row.notes || `En-route repairs & maintenance for ${targetPlate}`,
          lines: [
            { accountCode: drCode, accountName: `En-route Repairs & Punctures: ${targetPlate}`, debit: row.amount, credit: 0, notes: 'Repairs' },
            { accountCode: crCode, accountName: crCode === '2400' ? 'Trade & Workshop Payables' : crCode === '1200' ? 'Bank Fleet Current A/c' : 'Cash in Hand', debit: 0, credit: row.amount, notes: 'Paid' },
          ],
          createdAt: new Date().toISOString(),
        });
      }
    }

    onImportEntries(newEntries);
    setSuccessMessage(`Successfully imported and synchronized ${newEntries.length} double-entry transactions!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-900 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base tracking-tight">BULK IMPORT &amp; TALLY SYNC MODULE</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Template Download */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Step 1: Download Standard CSV Template</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Exact Columns: [Date, Truck_Plate, Driver_Name, Entry_Type, Category, Amount, Payment_Mode, Notes]
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded border border-slate-700 flex items-center gap-1.5 shadow-sm text-xs self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls, .xml"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <div className="font-bold text-slate-800 text-xs">
                {fileName ? `Selected File: ${fileName}` : 'Choose CSV, Excel (.xlsx/.xls), or Tally XML Export'}
              </div>
              <p className="text-[11px] text-slate-500 max-w-md">
                Upload your transport transactions. Rows will be automatically validated against your registered trucks' license plates.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm text-xs"
              >
                Browse File
              </button>
            </div>
          </div>

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs">
                  Parsed Data Rows ({parsedRows.length} total)
                </div>
                <div className="flex gap-2 text-[11px] font-mono">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {invalidCount} Discrepancies
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded max-h-56">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[10px]">
                      <th className="p-1.5 text-center">Row</th>
                      <th className="p-1.5">Date</th>
                      <th className="p-1.5">Truck Plate</th>
                      <th className="p-1.5">Type</th>
                      <th className="p-1.5">Category</th>
                      <th className="p-1.5 text-right">Amount (₹)</th>
                      <th className="p-1.5">Mode</th>
                      <th className="p-1.5">Notes</th>
                      <th className="p-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-1.5 text-center text-slate-400">{r.rowNumber}</td>
                        <td className="p-1.5 whitespace-nowrap">{r.date}</td>
                        <td className="p-1.5 font-bold whitespace-nowrap">{r.truckPlate}</td>
                        <td className="p-1.5 font-sans whitespace-nowrap">{r.entryType}</td>
                        <td className="p-1.5 font-sans font-semibold text-blue-700 whitespace-nowrap">{r.category}</td>
                        <td className="p-1.5 text-right font-bold text-slate-900 whitespace-nowrap">{formatINR(r.amount)}</td>
                        <td className="p-1.5 font-sans whitespace-nowrap">{r.paymentMode}</td>
                        <td className="p-1.5 font-sans text-slate-600 max-w-xs truncate">{r.notes}</td>
                        <td className="p-1.5 text-center whitespace-nowrap">
                          {r.isValid ? (
                            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              Valid
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[10px] font-bold" title={r.validationError}>
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-100 rounded-b-lg border-t border-slate-300">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold text-xs"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleImport}
              disabled={validCount === 0}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded shadow-sm text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Import &amp; Synchronize {validCount} Entries</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

