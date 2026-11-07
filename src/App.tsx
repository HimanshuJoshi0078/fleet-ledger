import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { DaybookView } from './components/views/DaybookView';
import { TruckLedgerView } from './components/views/TruckLedgerView';
import { IncomeStatementView } from './components/views/IncomeStatementView';
import { BalanceSheetView } from './components/views/BalanceSheetView';
import { FleetMasterView } from './components/views/FleetMasterView';
import { DriverHubView } from './components/views/DriverHubView';
import { FuelPumpHubView } from './components/views/FuelPumpHubView';
import { ClientBiltyHubView } from './components/views/ClientBiltyHubView';
import { StaticPagesView } from './components/views/StaticPagesView';
import { QuickVoucherModal } from './components/modals/QuickVoucherModal';
import { PrintReportModal } from './components/modals/PrintReportModal';
import { BackupModal } from './components/modals/BackupModal';
import { AddTruckModal } from './components/modals/AddTruckModal';
import { AddDriverModal } from './components/modals/AddDriverModal';
import { DailyEntryModal } from './components/modals/DailyEntryModal';
import { BulkImportModal } from './components/modals/BulkImportModal';
import { loadInitialState, persistState, resetToZero, AppState } from './services/storage';
import { JournalEntry, VoucherType } from './types/accounting';
import { VehicleProfile, DriverProfile } from './types/fleet';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [voucherModalDefaultType, setVoucherModalDefaultType] = useState<VoucherType>('FREIGHT_BILL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isAddTruckOpen, setIsAddTruckOpen] = useState<boolean>(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState<boolean>(false);
  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);

  // Keyboard shortcut F2 to open Voucher Entry (classic Tally standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsVoucherModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save new journal entry
  const handleSaveEntry = (newEntry: JournalEntry) => {
    setState(prev => {
      const updatedEntries = [newEntry, ...prev.journalEntries];

      // Update vehicle odometer if provided
      let updatedVehicles = prev.vehicles;
      if (newEntry.metadata?.odometer && newEntry.vehiclePlate) {
        updatedVehicles = prev.vehicles.map(v => {
          if (v.plateNumber === newEntry.vehiclePlate && newEntry.metadata!.odometer! > v.currentOdometerKm) {
            return { ...v, currentOdometerKm: newEntry.metadata!.odometer! };
          }
          return v;
        });
      }

      const nextState: AppState = {
        ...prev,
        journalEntries: updatedEntries,
        vehicles: updatedVehicles,
      };
      persistState(nextState);
      return nextState;
    });
  };

  // Delete journal entry
  const handleDeleteEntry = (entryId: string) => {
    setState(prev => {
      const nextState: AppState = {
        ...prev,
        journalEntries: prev.journalEntries.filter(e => e.id !== entryId),
      };
      persistState(nextState);
      return nextState;
    });
  };

  // Update vehicle profile
  const handleUpdateVehicle = (updatedVehicle: VehicleProfile) => {
    setState(prev => {
      const nextState: AppState = {
        ...prev,
        vehicles: prev.vehicles.map(v => (v.plateNumber === updatedVehicle.plateNumber ? updatedVehicle : v)),
      };
      persistState(nextState);
      return nextState;
    });
  };

  // Add new truck profile & link to Chart of Accounts ensuring balanced sheet
  const handleAddTruck = (newTruck: VehicleProfile) => {
    setState(prev => {
      if (prev.vehicles.some(v => v.plateNumber === newTruck.plateNumber)) {
        return prev;
      }

      const updatedVehicles = [...prev.vehicles, newTruck];
      const isTruckA = prev.vehicles.length === 0;
      const assetCode = isTruckA ? '1601' : '1602';
      const deprCode = isTruckA ? '1701' : '1702';
      const loanCode = isTruckA ? '2101' : '2102';

      const netAssetValue = (newTruck.originalPurchaseCost || 0) - (newTruck.accumulatedDepreciation || 0);
      const loanPrincipal = newTruck.loanCurrentPrincipal || 0;
      const equityAddition = netAssetValue - loanPrincipal;

      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.code === assetCode) {
          return {
            ...acc,
            name: `Commercial Vehicle Asset : ${newTruck.plateNumber} (${newTruck.model.split('(')[0].trim()})`,
            openingBalance: newTruck.originalPurchaseCost || 0,
          };
        }
        if (acc.code === deprCode) {
          return {
            ...acc,
            name: `Accumulated Depreciation : ${newTruck.plateNumber}`,
            openingBalance: newTruck.accumulatedDepreciation || 0,
          };
        }
        if (acc.code === loanCode) {
          return {
            ...acc,
            name: (loanPrincipal > 0 && newTruck.financierName)
              ? `${newTruck.financierName} Loan : ${newTruck.plateNumber}`
              : `Vehicle Loan : ${newTruck.plateNumber}`,
            openingBalance: loanPrincipal,
          };
        }
        if (acc.code === '3100') {
          return {
            ...acc,
            openingBalance: (acc.openingBalance || 0) + equityAddition,
          };
        }
        return acc;
      });

      const nextState: AppState = {
        ...prev,
        vehicles: updatedVehicles,
        accounts: updatedAccounts,
      };
      persistState(nextState);
      return nextState;
    });
    setIsAddTruckOpen(false);
  };

  // Add new driver profile & assign to truck
  const handleAddDriver = (newDriver: DriverProfile) => {
    setState(prev => {
      const updatedDrivers = [...prev.drivers, newDriver];

      let updatedVehicles = prev.vehicles;
      if (newDriver.assignedPlateNumber) {
        updatedVehicles = prev.vehicles.map(v => {
          if (v.plateNumber === newDriver.assignedPlateNumber) {
            return { ...v, assignedDriverId: newDriver.id };
          }
          return v;
        });
      }

      const isDriver1 = prev.drivers.length === 0;
      const advanceCode = isDriver1 ? '1501' : '1502';
      const salaryCode = isDriver1 ? '2301' : '2302';

      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.code === advanceCode) {
          return {
            ...acc,
            name: `Driver Advance Receivable : ${newDriver.fullName}`,
            openingBalance: newDriver.currentAdvanceBalance || 0,
          };
        }
        if (acc.code === salaryCode) {
          return {
            ...acc,
            name: `Driver Salary Payable : ${newDriver.fullName}`,
          };
        }
        if (acc.code === '3100' && (newDriver.currentAdvanceBalance || 0) > 0) {
          return {
            ...acc,
            openingBalance: (acc.openingBalance || 0) + (newDriver.currentAdvanceBalance || 0),
          };
        }
        return acc;
      });

      const nextState: AppState = {
        ...prev,
        drivers: updatedDrivers,
        vehicles: updatedVehicles,
        accounts: updatedAccounts,
      };
      persistState(nextState);
      return nextState;
    });
    setIsAddDriverOpen(false);
  };

  // Save batch of entries from daily entry sheet
  const handleSaveDailyEntries = (entries: JournalEntry[]) => {
    setState(prev => {
      const updatedEntries = [...entries, ...prev.journalEntries];

      let updatedVehicles = prev.vehicles;
      for (const e of entries) {
        if (e.metadata?.odometer && e.vehiclePlate) {
          updatedVehicles = updatedVehicles.map(v => {
            if (v.plateNumber === e.vehiclePlate && e.metadata!.odometer! > v.currentOdometerKm) {
              return { ...v, currentOdometerKm: e.metadata!.odometer! };
            }
            return v;
          });
        }
      }

      const nextState: AppState = {
        ...prev,
        journalEntries: updatedEntries,
        vehicles: updatedVehicles,
      };
      persistState(nextState);
      return nextState;
    });
    setIsDailyEntryOpen(false);
  };

  // Import batch of entries from CSV / Excel / Tally
  const handleImportEntries = (entries: JournalEntry[]) => {
    setState(prev => {
      const updatedEntries = [...entries, ...prev.journalEntries];
      const nextState: AppState = {
        ...prev,
        journalEntries: updatedEntries,
      };
      persistState(nextState);
      return nextState;
    });
    setIsBulkImportOpen(false);
  };

  // Reset to clean zero baseline
  const handleResetToZero = () => {
    const fresh = resetToZero();
    setState(fresh);
  };

  // Trigger modal with prefilled voucher type
  const handleTriggerVoucherWithType = (type: VoucherType, _id?: string) => {
    setVoucherModalDefaultType(type);
    setIsVoucherModalOpen(true);
  };

  const truckAPlate = state.vehicles[0]?.plateNumber || 'Truck A';
  const truckBPlate = state.vehicles[1]?.plateNumber || 'Truck B';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-slate-700 selection:text-white">
      {/* Top ERP Header */}
      <Header
        state={state}
        onOpenQuickVoucher={() => {
          setVoucherModalDefaultType('FREIGHT_BILL');
          setIsVoucherModalOpen(true);
        }}
        onOpenPrintReport={() => setIsPrintModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left ERP Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          truckAPlate={truckAPlate}
          truckBPlate={truckBPlate}
        />

        {/* Center Content View Canvas */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('FREIGHT_BILL');
                setIsVoucherModalOpen(true);
              }}
              onSelectTab={setActiveTab}
              onOpenAddTruck={() => setIsAddTruckOpen(true)}
              onOpenDailyEntry={() => setIsDailyEntryOpen(true)}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
            />
          )}

          {activeTab === 'daybook' && (
            <DaybookView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('FREIGHT_BILL');
                setIsVoucherModalOpen(true);
              }}
              onDeleteEntry={handleDeleteEntry}
              onOpenDailyEntry={() => setIsDailyEntryOpen(true)}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
            />
          )}

          {activeTab === 'truck_ledger' && (
            <TruckLedgerView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('DIESEL_SLIP');
                setIsVoucherModalOpen(true);
              }}
            />
          )}

          {activeTab === 'income_statement' && (
            <IncomeStatementView
              state={state}
              onOpenPrintReport={() => setIsPrintModalOpen(true)}
            />
          )}

          {(activeTab === 'balance_sheet' || activeTab === 'trial_balance') && (
            <BalanceSheetView
              state={state}
              onOpenPrintReport={() => setIsPrintModalOpen(true)}
            />
          )}

          {activeTab === 'fleet_master' && (
            <FleetMasterView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('EMI_PAYMENT');
                setIsVoucherModalOpen(true);
              }}
              onUpdateVehicle={handleUpdateVehicle}
              onOpenAddTruck={() => setIsAddTruckOpen(true)}
            />
          )}

          {activeTab === 'driver_hub' && (
            <DriverHubView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('DRIVER_BHATTA');
                setIsVoucherModalOpen(true);
              }}
              onTriggerVoucherWithType={handleTriggerVoucherWithType}
              onOpenAddDriver={() => setIsAddDriverOpen(true)}
            />
          )}

          {activeTab === 'fuel_pumps' && (
            <FuelPumpHubView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('DIESEL_SLIP');
                setIsVoucherModalOpen(true);
              }}
              onTriggerVoucherWithType={handleTriggerVoucherWithType}
            />
          )}

          {activeTab === 'client_bilties' && (
            <ClientBiltyHubView
              state={state}
              onOpenQuickVoucher={() => {
                setVoucherModalDefaultType('FREIGHT_BILL');
                setIsVoucherModalOpen(true);
              }}
              onTriggerVoucherWithType={handleTriggerVoucherWithType}
            />
          )}

          {activeTab === 'static_pages' && (
            <StaticPagesView
              state={state}
              onResetToZero={handleResetToZero}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <QuickVoucherModal
        state={state}
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        onSaveEntry={handleSaveEntry}
        defaultVoucherType={voucherModalDefaultType}
      />

      <PrintReportModal
        state={state}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      <BackupModal
        state={state}
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onStateChange={newState => setState(newState)}
      />

      <AddTruckModal
        isOpen={isAddTruckOpen}
        onClose={() => setIsAddTruckOpen(false)}
        onAddTruck={handleAddTruck}
        existingPlates={state.vehicles.map(v => v.plateNumber)}
      />

      <AddDriverModal
        isOpen={isAddDriverOpen}
        onClose={() => setIsAddDriverOpen(false)}
        onAddDriver={handleAddDriver}
        availableTrucks={state.vehicles.map(v => ({ plateNumber: v.plateNumber, model: v.model }))}
      />

      <DailyEntryModal
        state={state}
        isOpen={isDailyEntryOpen}
        onClose={() => setIsDailyEntryOpen(false)}
        onSaveEntries={handleSaveDailyEntries}
      />

      <BulkImportModal
        state={state}
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportEntries={handleImportEntries}
      />
    </div>
  );
};

export default App;
