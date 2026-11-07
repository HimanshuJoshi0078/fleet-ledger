import { VehicleProfile, DriverProfile, FuelPumpAccount, ClientProfile, FastagWalletState } from '../types/fleet';
import { JournalEntry } from '../types/accounting';

// Clean runtime state ready for real production business entry
export const INITIAL_VEHICLES: VehicleProfile[] = [];

export const INITIAL_DRIVERS: DriverProfile[] = [];

export const INITIAL_FUEL_PUMPS: FuelPumpAccount[] = [];

export const INITIAL_CLIENTS: ClientProfile[] = [];

export const INITIAL_FASTAG_WALLET: FastagWalletState = {
  walletId: 'FASTAG-CORP-IDBI-001',
  bankProvider: 'Commercial Fleet Fastag Pool',
  currentBalance: 0,
  lowBalanceThreshold: 5000,
  lastRechargedDate: '',
  linkedTags: [],
};

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];

// Optional benchmark sample data for reference or manual testing
export const SAMPLE_BENCHMARK_VEHICLES: VehicleProfile[] = [
  {
    id: 'TRUCK-01',
    plateNumber: 'RJ-14-GB-1001',
    model: 'Tata Signa 4825.T (16 Wheeler Multi-Axle)',
    gvwrMT: 43.5,
    year: 2023,
    assignedDriverId: 'DRV-01',
    originalPurchaseCost: 4450000,
    accumulatedDepreciation: 780000,
    currentBookValue: 3670000,
    financierName: 'HDFC Bank Transport Finance',
    loanAccountNumber: 'HDFC-CV-882190',
    loanOriginalPrincipal: 3200000,
    loanCurrentPrincipal: 1980000,
    monthlyEMI: 78500,
    emiDueDayOfMonth: 10,
    insurancePolicyNumber: 'NIA-CV-9910482',
    insuranceExpiryDate: '2027-02-28',
    nationalPermitNumber: 'NP-RJ-2023-8841',
    nationalPermitExpiryDate: '2027-06-15',
    fitnessCertificateExpiryDate: '2027-03-20',
    fastagTagId: '34161FA820993188',
    currentOdometerKm: 148220,
    operationalStatus: 'ACTIVE_TRIP',
    currentRoute: 'Jaipur - Ahmedabad - Bhiwandi',
  },
  {
    id: 'TRUCK-02',
    plateNumber: 'RJ-14-GB-1002',
    model: 'Ashok Leyland 3520 (12 Wheeler Multi-Axle)',
    gvwrMT: 35.0,
    year: 2024,
    assignedDriverId: 'DRV-02',
    originalPurchaseCost: 3820000,
    accumulatedDepreciation: 420000,
    currentBookValue: 3400000,
    financierName: 'ICICI Bank Commercial Vehicle Finance',
    loanAccountNumber: 'ICICI-CV-440129',
    loanOriginalPrincipal: 2800000,
    loanCurrentPrincipal: 2240000,
    monthlyEMI: 67200,
    emiDueDayOfMonth: 15,
    insurancePolicyNumber: 'ICICI-LOMB-772183',
    insuranceExpiryDate: '2027-10-10',
    nationalPermitNumber: 'NP-RJ-2024-1192',
    nationalPermitExpiryDate: '2027-08-30',
    fitnessCertificateExpiryDate: '2027-05-15',
    fastagTagId: '34161FA820993199',
    currentOdometerKm: 86410,
    operationalStatus: 'LOADING',
    currentRoute: 'Nimbahera Cement Belt - Delhi NCR',
  },
];

export const SAMPLE_BENCHMARK_DRIVERS: DriverProfile[] = [
  {
    id: 'DRV-01',
    fullName: 'Mohan Singh',
    licenseNumber: 'RJ-14-20120048211 (Heavy Transport Commercial)',
    contactNumber: '+91 98290 14820',
    assignedPlateNumber: 'RJ-14-GB-1001',
    baseMonthlySalary: 22000,
    currentAdvanceBalance: 4500,
    unpaidSalaryBalance: 22000,
    dailyBhattaRate: 350,
    joiningDate: '2023-04-01',
    emergencyContact: '+91 94140 33819',
  },
  {
    id: 'DRV-02',
    fullName: 'Rajesh Sharma',
    licenseNumber: 'RJ-14-20160091823 (Heavy Transport Commercial)',
    contactNumber: '+91 94140 88219',
    assignedPlateNumber: 'RJ-14-GB-1002',
    baseMonthlySalary: 20000,
    currentAdvanceBalance: 3000,
    unpaidSalaryBalance: 20000,
    dailyBhattaRate: 350,
    joiningDate: '2024-02-15',
    emergencyContact: '+91 98281 77291',
  },
];
