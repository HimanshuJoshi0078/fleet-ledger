import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Trash2
} from 'lucide-react';
import { AppState, exportBackupJSON, importBackupJSON, resetToZero, loadBenchmarkDemo } from '../../services/storage';

interface BackupModalProps {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
  onStateChange: (newState: AppState) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  state,
  isOpen,
  onClose,
  onStateChange,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDownloadBackup = () => {
    try {
      const json = exportBackupJSON(state);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FleetLedger_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMessage('Backup JSON successfully downloaded.');
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage('Failed to generate backup: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const restored = importBackupJSON(content);
        onStateChange(restored);
        setSuccessMessage('Ledger state restored successfully from backup file.');
        setErrorMessage('');
      } catch (err: any) {
        setErrorMessage('Failed to import backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleClearToZero = () => {
    if (window.confirm('WIPE ALL DATA: Are you sure you want to clear all data? This will wipe all trucks, drivers, clients, pumps, and transactions back to an absolute clean 0 state.')) {
      const fresh = resetToZero();
      onStateChange(fresh);
      setSuccessMessage('Clean zero state restored. All records cleared (0 records).');
      setErrorMessage('');
    }
  };

  const handleLoadDemo = () => {
    if (window.confirm('Load benchmark sample dataset for testing?')) {
      const demo = loadBenchmarkDemo();
      onStateChange(demo);
      setSuccessMessage('Benchmark demo data loaded.');
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg flex flex-col text-slate-900 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-base tracking-tight">DATA MANAGEMENT &amp; BACKUP</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
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

          <p className="text-slate-600 leading-relaxed">
            All fleet transactions and ledger accounts are persisted in your browser's local database. You can export a full JSON backup for safe keeping, restore backups, or reset database state.
          </p>

          {/* Action 1: Export JSON */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900">Export Ledger State (JSON)</div>
              <div className="text-[11px] text-slate-500">
                Downloads complete chart of accounts and {state.journalEntries.length} journal transactions.
              </div>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-sm text-xs sm:text-sm w-full sm:w-auto whitespace-nowrap"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span>Export</span>
            </button>
          </div>

          {/* Action 2: Import JSON */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900">Restore from Backup (JSON)</div>
              <div className="text-[11px] text-slate-500">
                Select a previously exported FleetLedger backup file to restore.
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 min-h-[42px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-sm text-xs sm:text-sm w-full sm:w-auto whitespace-nowrap"
              >
                <Upload className="w-4 h-4 flex-shrink-0" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Action 3: Clear All Data / Reset to Zero */}
          <div className="bg-rose-50/60 p-3.5 rounded border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-rose-950">Clear All Data (Reset to Zero)</div>
              <div className="text-[11px] text-slate-600">
                Wipes all trucks, drivers, and transactions to start completely clean (0 records).
              </div>
            </div>
            <button
              onClick={handleClearToZero}
              className="px-4 py-2 min-h-[42px] bg-rose-700 hover:bg-rose-800 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-sm text-xs sm:text-sm w-full sm:w-auto whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span>Clear to Zero</span>
            </button>
          </div>

          {/* Action 4: Load Benchmark Demo Data */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-700">Load Benchmark Sample Data</div>
              <div className="text-[11px] text-slate-500">
                Optional: Populates standard 2-truck reference dataset for testing.
              </div>
            </div>
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2 min-h-[42px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded text-xs sm:text-sm w-full sm:w-auto flex items-center justify-center whitespace-nowrap"
            >
              Load Demo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 rounded-b-lg border-t border-slate-300 flex justify-end w-full">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 min-h-[42px] text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded border border-slate-300 flex items-center justify-center whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
