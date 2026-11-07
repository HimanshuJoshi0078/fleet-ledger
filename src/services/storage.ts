import { Account, JournalEntry } from '../types/accounting';
import { VehicleProfile, DriverProfile, FuelPumpAccount, ClientProfile, FastagWalletState } from '../types/fleet';
import { STANDARD_CHART_OF_ACCOUNTS } from '../constants/chartOfAccounts';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_FUEL_PUMPS,
  INITIAL_CLIENTS,
  INITIAL_FASTAG_WALLET,
  INITIAL_JOURNAL_ENTRIES,
  SAMPLE_BENCHMARK_VEHICLES,
  SAMPLE_BENCHMARK_DRIVERS,
} from '../constants/initialData';

const STORAGE_KEYS = {
  ACCOUNTS: 'fleetledger_accounts_v2',
  VEHICLES: 'fleetledger_vehicles_v2',
  DRIVERS: 'fleetledger_drivers_v2',
  PUMPS: 'fleetledger_pumps_v2',
  CLIENTS: 'fleetledger_clients_v2',
  FASTAG: 'fleetledger_fastag_v2',
  ENTRIES: 'fleetledger_entries_v2',
};

export interface AppState {
  accounts: Account[];
  vehicles: VehicleProfile[];
  drivers: DriverProfile[];
  pumps: FuelPumpAccount[];
  clients: ClientProfile[];
  fastagWallet: FastagWalletState;
  journalEntries: JournalEntry[];
}

export function loadInitialState(): AppState {
  try {
    const rawAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const rawVehicles = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    const rawDrivers = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    const rawPumps = localStorage.getItem(STORAGE_KEYS.PUMPS);
    const rawClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    const rawFastag = localStorage.getItem(STORAGE_KEYS.FASTAG);
    const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);

    return {
      accounts: rawAccounts ? JSON.parse(rawAccounts) : STANDARD_CHART_OF_ACCOUNTS,
      vehicles: rawVehicles ? JSON.parse(rawVehicles) : INITIAL_VEHICLES,
      drivers: rawDrivers ? JSON.parse(rawDrivers) : INITIAL_DRIVERS,
      pumps: rawPumps ? JSON.parse(rawPumps) : INITIAL_FUEL_PUMPS,
      clients: rawClients ? JSON.parse(rawClients) : INITIAL_CLIENTS,
      fastagWallet: rawFastag ? JSON.parse(rawFastag) : INITIAL_FASTAG_WALLET,
      journalEntries: rawEntries ? JSON.parse(rawEntries) : INITIAL_JOURNAL_ENTRIES,
    };
  } catch (err) {
    console.error('Failed to parse local storage, loading clean state', err);
    return {
      accounts: STANDARD_CHART_OF_ACCOUNTS,
      vehicles: INITIAL_VEHICLES,
      drivers: INITIAL_DRIVERS,
      pumps: INITIAL_FUEL_PUMPS,
      clients: INITIAL_CLIENTS,
      fastagWallet: INITIAL_FASTAG_WALLET,
      journalEntries: INITIAL_JOURNAL_ENTRIES,
    };
  }
}

export function persistState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(state.accounts));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(state.vehicles));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(state.drivers));
    localStorage.setItem(STORAGE_KEYS.PUMPS, JSON.stringify(state.pumps));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(state.clients));
    localStorage.setItem(STORAGE_KEYS.FASTAG, JSON.stringify(state.fastagWallet));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.journalEntries));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

/**
 * Resets the runtime state to an absolute clean zero state (blank database).
 */
export function resetToZero(): AppState {
  localStorage.clear();
  const cleanAccounts = STANDARD_CHART_OF_ACCOUNTS.map(a => ({ ...a, openingBalance: 0 }));
  const cleanState: AppState = {
    accounts: cleanAccounts,
    vehicles: [],
    drivers: [],
    pumps: [],
    clients: [],
    fastagWallet: {
      walletId: 'FASTAG-CORP-POOL',
      bankProvider: 'Commercial Fleet Fastag Pool',
      currentBalance: 0,
      lowBalanceThreshold: 5000,
      lastRechargedDate: '',
      linkedTags: [],
    },
    journalEntries: [],
  };
  persistState(cleanState);
  return cleanState;
}

/**
 * Optional benchmark data loader for testing or demonstration.
 */
export function loadBenchmarkDemo(): AppState {
  const benchmarkAccounts = STANDARD_CHART_OF_ACCOUNTS.map(a => {
    if (a.code === '1100') return { ...a, openingBalance: 48500 };
    if (a.code === '1200') return { ...a, openingBalance: 325400 };
    if (a.code === '1300') return { ...a, openingBalance: 14200 };
    if (a.code === '1400') return { ...a, openingBalance: 390500 };
    if (a.code === '1501') return { ...a, openingBalance: 4500 };
    if (a.code === '1502') return { ...a, openingBalance: 3000 };
    if (a.code === '1601') return { ...a, openingBalance: 4450000 };
    if (a.code === '1602') return { ...a, openingBalance: 3820000 };
    if (a.code === '1691') return { ...a, openingBalance: -780000 };
    if (a.code === '1692') return { ...a, openingBalance: -420000 };
    if (a.code === '2101') return { ...a, openingBalance: 1980000 };
    if (a.code === '2102') return { ...a, openingBalance: 2240000 };
    if (a.code === '2201') return { ...a, openingBalance: 74800 };
    if (a.code === '2202') return { ...a, openingBalance: 58350 };
    if (a.code === '2301') return { ...a, openingBalance: 22000 };
    if (a.code === '2302') return { ...a, openingBalance: 20000 };
    if (a.code === '2400') return { ...a, openingBalance: 18450 };
    if (a.code === '3100') return { ...a, openingBalance: 2500000 };
    if (a.code === '3200') return { ...a, openingBalance: 942500 };
    return a;
  });

  const demoState: AppState = {
    accounts: benchmarkAccounts,
    vehicles: SAMPLE_BENCHMARK_VEHICLES,
    drivers: SAMPLE_BENCHMARK_DRIVERS,
    pumps: [
      {
        id: 'PUMP-01',
        pumpName: 'Shri Ram Petroleum (IOCL Dealer)',
        oilCompany: 'IOCL',
        location: 'NH-48 Jaipur - Ajmer Expressway, Km 32',
        contactPerson: 'Kailash Choudhary',
        phone: '+91 98290 55120',
        creditLimit: 250000,
        currentOutstandingPayable: 74800,
      },
      {
        id: 'PUMP-02',
        pumpName: 'Karni Kripa Fuel Point (BPCL Dealer)',
        oilCompany: 'BPCL',
        location: 'Kishangarh Marble Toll Plaza Bypass',
        contactPerson: 'Suresh Gurjar',
        phone: '+91 94140 66782',
        creditLimit: 200000,
        currentOutstandingPayable: 58350,
      },
    ],
    clients: [
      {
        id: 'CLI-01',
        clientName: 'UltraTech Cement Ltd (Kotputli Unit)',
        gstin: '08AAACU1234F1Z8',
        contactPerson: 'Ravi Teja',
        phone: '+91 98291 10022',
        city: 'Kotputli / Shambhupura',
        standardPaymentTermsDays: 15,
        currentReceivableBalance: 142000,
      },
      {
        id: 'CLI-02',
        clientName: 'Wonder Cement Limited (Nimbahera)',
        gstin: '08AABCB9876E1Z2',
        contactPerson: 'Mahesh Joshi',
        phone: '+91 94140 44321',
        city: 'Nimbahera',
        standardPaymentTermsDays: 15,
        currentReceivableBalance: 118500,
      },
    ],
    fastagWallet: {
      walletId: 'FASTAG-CORP-IDBI-00918',
      bankProvider: 'IDBI Bank Commercial Fleet Fastag Pool',
      currentBalance: 14200,
      lowBalanceThreshold: 5000,
      lastRechargedDate: '2026-11-01',
      linkedTags: [
        { plateNumber: 'RJ-14-GB-1001', tagId: '34161FA820993188', status: 'ACTIVE' },
        { plateNumber: 'RJ-14-GB-1002', tagId: '34161FA820993199', status: 'ACTIVE' },
      ],
    },
    journalEntries: [],
  };

  persistState(demoState);
  return demoState;
}

export function exportBackupJSON(state: AppState): string {
  return JSON.stringify(
    {
      app: 'FLEETLEDGER_ERP',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      payload: state,
    },
    null,
    2
  );
}

export function importBackupJSON(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed.payload || !Array.isArray(parsed.payload.journalEntries)) {
    throw new Error('Invalid backup file format. Missing core ledger payload.');
  }
  const state: AppState = {
    accounts: parsed.payload.accounts || STANDARD_CHART_OF_ACCOUNTS,
    vehicles: parsed.payload.vehicles || [],
    drivers: parsed.payload.drivers || [],
    pumps: parsed.payload.pumps || [],
    clients: parsed.payload.clients || [],
    fastagWallet: parsed.payload.fastagWallet || INITIAL_FASTAG_WALLET,
    journalEntries: parsed.payload.journalEntries || [],
  };
  persistState(state);
  return state;
}
