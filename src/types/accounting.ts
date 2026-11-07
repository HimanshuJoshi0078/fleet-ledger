export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type AccountSubCategory =
  | 'CURRENT_ASSET'
  | 'FIXED_ASSET'
  | 'CURRENT_LIABILITY'
  | 'LONG_TERM_LIABILITY'
  | 'CAPITAL'
  | 'RETAINED_EARNINGS'
  | 'DIRECT_INCOME'
  | 'INDIRECT_INCOME'
  | 'DIRECT_EXPENSE'
  | 'FIXED_OVERHEAD';

export interface Account {
  code: string; // e.g. "1100"
  name: string; // e.g. "Cash in Hand"
  category: AccountCategory;
  subCategory: AccountSubCategory;
  isVehicleSpecific?: boolean;
  vehiclePlate?: string; // Tagged to a specific truck, e.g. "RJ-14-GB-1001"
  description?: string;
  openingBalance: number; // Positive = normal balance (Dr for assets/expenses, Cr for liabilities/equity/revenue)
}

export type VoucherType =
  | 'FREIGHT_BILL'         // Freight billed to client against Bilty / LR
  | 'DIESEL_SLIP'          // Fuel purchase slip (credit or cash)
  | 'FASTAG_TOLL'          // Fastag toll deduction
  | 'FASTAG_RECHARGE'      // Fastag wallet recharge from bank
  | 'DRIVER_BHATTA'        // Daily fooding allowance paid to driver
  | 'DRIVER_ADVANCE'       // Advance loan given to driver
  | 'SALARY_ACCRUAL'       // Monthly driver salary expense recognition
  | 'SALARY_PAYMENT'       // Salary settlement after advance deduction
  | 'MAINTENANCE_REPAIR'   // Minor repairs, punctures, greasing, spare parts
  | 'EMI_PAYMENT'          // Monthly truck loan installment
  | 'CLIENT_RECEIPT'       // Freight payment received from client
  | 'PUMP_SETTLEMENT'      // Payment made to fuel pump against credit balance
  | 'JOURNAL_ENTRY';       // General double-entry journal voucher

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  voucherNumber: string; // e.g. "VR-2026-0089"
  date: string;          // ISO "YYYY-MM-DD"
  voucherType: VoucherType;
  vehiclePlate: string;  // "RJ-14-GB-1001", "RJ-14-GB-1002", or "COMPANY"
  driverId?: string;
  clientId?: string;
  pumpId?: string;
  referenceNumber?: string; // Bilty #, Fuel Slip #, Fastag Txn ID, Chq/UTR #
  narration: string;
  lines: JournalLine[];
  metadata?: {
    liters?: number;
    fuelRate?: number;
    odometer?: number;
    biltyNumber?: string;
    loadingPoint?: string;
    unloadingPoint?: string;
    cargoWeightMT?: number;
    freightRatePerMT?: number;
    tollPlazaName?: string;
    driverAdvanceDeducted?: number;
    loanPrincipalAmount?: number;
    loanInterestAmount?: number;
  };
  createdAt: string;
}

export interface TrialBalanceItem {
  code: string;
  name: string;
  category: AccountCategory;
  subCategory: AccountSubCategory;
  vehiclePlate?: string;
  openingBalance: number;
  debitTotal: number;
  creditTotal: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number; // Signed balance based on standard nature
}

export interface IncomeStatementBreakdown {
  vehiclePlate: string; // "RJ-14-GB-1001", "RJ-14-GB-1002", or "TOTAL"
  vehicleName: string;
  grossFreightRevenue: number;
  detentionAndOtherIncome: number;
  totalRevenue: number;

  // Direct Trip Expenses
  dieselExpense: number;
  dieselLiters: number;
  tollExpense: number;
  driverBhattaExpense: number;
  enrouteRepairsExpense: number;
  loadingHamaliExpense: number;
  borderGreenTaxExpense: number;
  totalDirectExpenses: number;

  grossOperatingProfit: number; // totalRevenue - totalDirectExpenses
  grossOperatingMarginPercent: number;

  // Fixed & Overheads
  driverBaseSalary: number;
  loanInterestExpense: number;
  insuranceAmortization: number;
  permitFitnessExpense: number;
  adminGpsExpense: number;
  depreciationExpense: number;
  totalFixedOverheads: number;

  netOperatingProfit: number; // grossOperatingProfit - totalFixedOverheads
  netOperatingMarginPercent: number;
}

export interface BalanceSheetData {
  asOfDate: string;
  assets: {
    fixedAssets: {
      vehiclesGrossValue: number;
      accumulatedDepreciation: number;
      vehiclesNetBookValue: number;
      details: { plate: string; gross: number; dep: number; net: number }[];
    };
    currentAssets: {
      cashInHand: number;
      bankBalance: number;
      fastagWallet: number;
      clientReceivables: number;
      driverAdvancesRecoverable: number;
      totalCurrentAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    longTermLiabilities: {
      vehicleLoansPayable: number;
      details: { plate: string; bank: string; balance: number }[];
    };
    currentLiabilities: {
      fuelPumpCreditsPayable: number;
      unpaidDriverSalaries: number;
      workshopVendorPayables: number;
      totalCurrentLiabilities: number;
    };
    totalLiabilities: number;
  };
  equity: {
    proprietorCapital: number;
    retainedEarningsOpening: number;
    currentPeriodNetProfit: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  difference: number; // Should be exactly 0
  isBalanced: boolean;
}

