export type TruckStatus = 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export interface VehicleProfile {
  id: string;
  plateNumber: string; // e.g. "RJ-14-GB-1001"
  model: string;       // e.g. "Tata Signa 4825.T (16 Wheeler)"
  gvwrMT: number;      // e.g. 43.5
  year: number;        // e.g. 2023
  assignedDriverId: string;
  originalPurchaseCost: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  financierName: string; // e.g. "HDFC Bank Transport Finance"
  loanAccountNumber: string;
  loanOriginalPrincipal: number;
  loanCurrentPrincipal: number;
  monthlyEMI: number;
  emiDueDayOfMonth: number; // e.g. 10
  insurancePolicyNumber: string;
  insuranceExpiryDate: string; // "YYYY-MM-DD"
  nationalPermitNumber: string;
  nationalPermitExpiryDate: string;
  fitnessCertificateExpiryDate: string;
  pucExpiryDate?: string;      // "YYYY-MM-DD"
  roadTaxExpiryDate?: string;  // "YYYY-MM-DD"
  fastagTagId: string;
  currentOdometerKm: number;
  operationalStatus: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED' | 'ACTIVE_TRIP' | 'LOADING' | 'UNLOADING' | 'WORKSHOP' | 'IDLE';
  status?: TruckStatus;
  currentRoute?: string;
}

export interface DriverProfile {
  id: string;
  fullName: string;
  licenseNumber: string;
  contactNumber: string;
  assignedPlateNumber: string;
  baseMonthlySalary: number;
  currentAdvanceBalance: number; // Money owed by driver back to company
  unpaidSalaryBalance: number;    // Accrued salary not yet paid out
  dailyBhattaRate: number;       // Standard fooding allowance per day
  joiningDate: string;
  emergencyContact: string;
}

export interface FuelPumpAccount {
  id: string;
  pumpName: string;
  oilCompany: 'IOCL' | 'BPCL' | 'HPCL' | 'RELIANCE' | 'NAYARA';
  location: string;
  contactPerson: string;
  phone: string;
  creditLimit: number;
  currentOutstandingPayable: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  openingBalance: number;
  createdAt: string;
  // Backward compatibility fields
  clientName?: string;
  city?: string;
  contactPerson?: string;
  standardPaymentTermsDays?: number;
  currentReceivableBalance?: number;
}

export type ClientProfile = Client;

export interface FastagWalletState {
  walletId: string;
  bankProvider: string; // e.g. "IDBI Bank Fleet Program"
  currentBalance: number;
  lowBalanceThreshold: number;
  lastRechargedDate: string;
  linkedTags: {
    plateNumber: string;
    tagId: string;
    status: 'ACTIVE' | 'LOW_BALANCE' | 'BLACKLISTED';
  }[];
}

