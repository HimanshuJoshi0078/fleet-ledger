import { Account, JournalEntry, TrialBalanceItem, IncomeStatementBreakdown, BalanceSheetData } from '../types/accounting';
import { VehicleProfile, DriverProfile, FuelPumpAccount, ClientProfile } from '../types/fleet';

export interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export function filterEntriesByDate(entries: JournalEntry[], filter?: DateFilter): JournalEntry[] {
  if (!filter || (!filter.startDate && !filter.endDate)) return entries;
  return entries.filter(entry => {
    if (filter.startDate && entry.date < filter.startDate) return false;
    if (filter.endDate && entry.date > filter.endDate) return false;
    return true;
  });
}

/**
 * Computes Trial Balance across all accounts.
 * Standard accounting rule:
 * For Asset & Expense accounts: Normal Balance is Debit (Opening + Debits - Credits)
 * For Liability, Equity & Revenue accounts: Normal Balance is Credit (Opening + Credits - Debits)
 */
export function generateTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  dateFilter?: DateFilter
): { items: TrialBalanceItem[]; totalDebits: number; totalCredits: number; isBalanced: boolean } {
  const filteredEntries = filterEntriesByDate(entries, dateFilter);

  // Accumulate debit and credit movements per account code
  const debitSums: Record<string, number> = {};
  const creditSums: Record<string, number> = {};

  for (const entry of filteredEntries) {
    for (const line of entry.lines) {
      debitSums[line.accountCode] = (debitSums[line.accountCode] || 0) + (line.debit || 0);
      creditSums[line.accountCode] = (creditSums[line.accountCode] || 0) + (line.credit || 0);
    }
  }

  let grandDebit = 0;
  let grandCredit = 0;

  const items: TrialBalanceItem[] = accounts.map(acc => {
    const dSum = debitSums[acc.code] || 0;
    const cSum = creditSums[acc.code] || 0;

    let closingDebit = 0;
    let closingCredit = 0;
    let netBalance = 0;

    const isDebitNormal = acc.category === 'ASSET' || acc.category === 'EXPENSE';

    if (isDebitNormal) {
      // Net Debit position
      const balance = acc.openingBalance + dSum - cSum;
      netBalance = balance;
      if (balance >= 0) {
        closingDebit = balance;
      } else {
        closingCredit = Math.abs(balance);
      }
    } else {
      // Net Credit position
      const balance = acc.openingBalance + cSum - dSum;
      netBalance = balance;
      if (balance >= 0) {
        closingCredit = balance;
      } else {
        closingDebit = Math.abs(balance);
      }
    }

    grandDebit += closingDebit;
    grandCredit += closingCredit;

    return {
      code: acc.code,
      name: acc.name,
      category: acc.category,
      subCategory: acc.subCategory,
      vehiclePlate: acc.vehiclePlate,
      openingBalance: acc.openingBalance,
      debitTotal: dSum,
      creditTotal: cSum,
      closingDebit,
      closingCredit,
      netBalance,
    };
  });

  const isBalanced = Math.abs(grandDebit - grandCredit) < 0.01;

  return {
    items,
    totalDebits: grandDebit,
    totalCredits: grandCredit,
    isBalanced,
  };
}

/**
 * Generates Comparative Income Statement (P&L) broken down by truck and enterprise total.
 */
export function generateIncomeStatement(
  entries: JournalEntry[],
  vehicles: VehicleProfile[],
  dateFilter?: DateFilter
): {
  breakdowns: Record<string, IncomeStatementBreakdown>;
  consolidated: IncomeStatementBreakdown;
} {
  const filteredEntries = filterEntriesByDate(entries, dateFilter);

  const initBreakdown = (plate: string, name: string): IncomeStatementBreakdown => ({
    vehiclePlate: plate,
    vehicleName: name,
    grossFreightRevenue: 0,
    detentionAndOtherIncome: 0,
    totalRevenue: 0,
    dieselExpense: 0,
    dieselLiters: 0,
    tollExpense: 0,
    driverBhattaExpense: 0,
    enrouteRepairsExpense: 0,
    loadingHamaliExpense: 0,
    borderGreenTaxExpense: 0,
    totalDirectExpenses: 0,
    grossOperatingProfit: 0,
    grossOperatingMarginPercent: 0,
    driverBaseSalary: 0,
    loanInterestExpense: 0,
    insuranceAmortization: 0,
    permitFitnessExpense: 0,
    adminGpsExpense: 0,
    depreciationExpense: 0,
    totalFixedOverheads: 0,
    netOperatingProfit: 0,
    netOperatingMarginPercent: 0,
  });

  const breakdowns: Record<string, IncomeStatementBreakdown> = {};
  for (const v of vehicles) {
    breakdowns[v.plateNumber] = initBreakdown(v.plateNumber, `${v.plateNumber} (${v.model.split('(')[0].trim()})`);
  }

  const consolidated = initBreakdown('TOTAL', 'Consolidated Fleet Enterprise');

  // Process all journal lines
  const v1Plate = vehicles[0]?.plateNumber;
  const v2Plate = vehicles[1]?.plateNumber;

  for (const entry of filteredEntries) {
    const plate = entry.vehiclePlate;
    const targetBreakdown = breakdowns[plate] ||
      (entry.lines.some(l => l.accountCode.endsWith('01')) && v1Plate ? breakdowns[v1Plate] : undefined) ||
      (entry.lines.some(l => l.accountCode.endsWith('02')) && v2Plate ? breakdowns[v2Plate] : undefined);

    for (const line of entry.lines) {
      const code = line.accountCode;

      // Revenue: Credit lines in 4000 series
      if (line.credit > 0 && code.startsWith('4')) {
        if (code === '4200') {
          if (targetBreakdown) targetBreakdown.detentionAndOtherIncome += line.credit;
          consolidated.detentionAndOtherIncome += line.credit;
        } else {
          if (targetBreakdown) {
            targetBreakdown.grossFreightRevenue += line.credit;
          } else if (code === '4101' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].grossFreightRevenue += line.credit;
          } else if (code === '4102' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].grossFreightRevenue += line.credit;
          }
          consolidated.grossFreightRevenue += line.credit;
        }
      }

      // Expenses: Debit lines in 5000 (Direct) & 6000 (Fixed)
      if (line.debit > 0) {
        // Diesel: 5101, 5102
        if (code.startsWith('51')) {
          if (targetBreakdown) {
            targetBreakdown.dieselExpense += line.debit;
            if (entry.metadata?.liters) targetBreakdown.dieselLiters += entry.metadata.liters;
          } else if (code === '5101' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].dieselExpense += line.debit;
            if (entry.metadata?.liters) breakdowns[v1Plate].dieselLiters += entry.metadata.liters;
          } else if (code === '5102' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].dieselExpense += line.debit;
            if (entry.metadata?.liters) breakdowns[v2Plate].dieselLiters += entry.metadata.liters;
          }
          consolidated.dieselExpense += line.debit;
          if (entry.metadata?.liters) consolidated.dieselLiters += entry.metadata.liters;
        }
        // Tolls: 5201, 5202
        else if (code.startsWith('52')) {
          if (targetBreakdown) {
            targetBreakdown.tollExpense += line.debit;
          } else if (code === '5201' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].tollExpense += line.debit;
          } else if (code === '5202' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].tollExpense += line.debit;
          }
          consolidated.tollExpense += line.debit;
        }
        // Driver Bhatta: 5301, 5302
        else if (code.startsWith('53')) {
          if (targetBreakdown) {
            targetBreakdown.driverBhattaExpense += line.debit;
          } else if (code === '5301' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].driverBhattaExpense += line.debit;
          } else if (code === '5302' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].driverBhattaExpense += line.debit;
          }
          consolidated.driverBhattaExpense += line.debit;
        }
        // Repairs: 5401, 5402
        else if (code.startsWith('54')) {
          if (targetBreakdown) {
            targetBreakdown.enrouteRepairsExpense += line.debit;
          } else if (code === '5401' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].enrouteRepairsExpense += line.debit;
          } else if (code === '5402' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].enrouteRepairsExpense += line.debit;
          }
          consolidated.enrouteRepairsExpense += line.debit;
        }
        // Hamali: 5501, 5502
        else if (code.startsWith('55')) {
          if (targetBreakdown) {
            targetBreakdown.loadingHamaliExpense += line.debit;
          } else if (code === '5501' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].loadingHamaliExpense += line.debit;
          } else if (code === '5502' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].loadingHamaliExpense += line.debit;
          }
          consolidated.loadingHamaliExpense += line.debit;
        }
        // Border tax: 5601, 5602
        else if (code.startsWith('56')) {
          if (targetBreakdown) {
            targetBreakdown.borderGreenTaxExpense += line.debit;
          } else if (code === '5601' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].borderGreenTaxExpense += line.debit;
          } else if (code === '5602' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].borderGreenTaxExpense += line.debit;
          }
          consolidated.borderGreenTaxExpense += line.debit;
        }
        // Fixed: Driver Salary 6101, 6102
        else if (code.startsWith('61')) {
          if (targetBreakdown) {
            targetBreakdown.driverBaseSalary += line.debit;
          } else if (code === '6101' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].driverBaseSalary += line.debit;
          } else if (code === '6102' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].driverBaseSalary += line.debit;
          }
          consolidated.driverBaseSalary += line.debit;
        }
        // Loan Interest: 6201, 6202
        else if (code.startsWith('62')) {
          if (targetBreakdown) {
            targetBreakdown.loanInterestExpense += line.debit;
          } else if (code === '6201' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].loanInterestExpense += line.debit;
          } else if (code === '6202' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].loanInterestExpense += line.debit;
          }
          consolidated.loanInterestExpense += line.debit;
        }
        // Insurance/Permits: 6301, 6302
        else if (code.startsWith('63')) {
          if (targetBreakdown) {
            targetBreakdown.insuranceAmortization += line.debit;
          } else if (code === '6301' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].insuranceAmortization += line.debit;
          } else if (code === '6302' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].insuranceAmortization += line.debit;
          }
          consolidated.insuranceAmortization += line.debit;
        }
        // Admin / GPS: 6400
        else if (code === '6400') {
          consolidated.adminGpsExpense += line.debit;
          const truckCount = vehicles.length || 1;
          for (const v of vehicles) {
            if (breakdowns[v.plateNumber]) {
              breakdowns[v.plateNumber].adminGpsExpense += (line.debit / truckCount);
            }
          }
        }
        // Depreciation: 6501, 6502
        else if (code.startsWith('65')) {
          if (targetBreakdown) {
            targetBreakdown.depreciationExpense += line.debit;
          } else if (code === '6501' && v1Plate && breakdowns[v1Plate]) {
            breakdowns[v1Plate].depreciationExpense += line.debit;
          } else if (code === '6502' && v2Plate && breakdowns[v2Plate]) {
            breakdowns[v2Plate].depreciationExpense += line.debit;
          }
          consolidated.depreciationExpense += line.debit;
        }
      }
    }
  }

  // Calculate totals and margins for each truck and consolidated
  const computeFinalMetrics = (b: IncomeStatementBreakdown) => {
    b.totalRevenue = b.grossFreightRevenue + b.detentionAndOtherIncome;
    b.totalDirectExpenses =
      b.dieselExpense +
      b.tollExpense +
      b.driverBhattaExpense +
      b.enrouteRepairsExpense +
      b.loadingHamaliExpense +
      b.borderGreenTaxExpense;

    b.grossOperatingProfit = b.totalRevenue - b.totalDirectExpenses;
    b.grossOperatingMarginPercent = b.totalRevenue > 0 ? (b.grossOperatingProfit / b.totalRevenue) * 100 : 0;

    b.totalFixedOverheads =
      b.driverBaseSalary +
      b.loanInterestExpense +
      b.insuranceAmortization +
      b.permitFitnessExpense +
      b.adminGpsExpense +
      b.depreciationExpense;

    b.netOperatingProfit = b.grossOperatingProfit - b.totalFixedOverheads;
    b.netOperatingMarginPercent = b.totalRevenue > 0 ? (b.netOperatingProfit / b.totalRevenue) * 100 : 0;
  };

  for (const plate in breakdowns) {
    computeFinalMetrics(breakdowns[plate]);
  }
  computeFinalMetrics(consolidated);

  return { breakdowns, consolidated };
}

/**
 * Generates Tally-Style Balance Sheet as of given date.
 * Verifies Assets == Liabilities + Equity.
 */
export function generateBalanceSheet(
  accounts: Account[],
  entries: JournalEntry[],
  vehicles: VehicleProfile[],
  asOfDate?: string
): BalanceSheetData {
  const dateFilter: DateFilter = asOfDate ? { endDate: asOfDate } : {};
  const { items } = generateTrialBalance(accounts, entries, dateFilter);

  // Helper to read net closing balance for an account code
  const getBal = (code: string): number => {
    const item = items.find(i => i.code === code);
    if (!item) return 0;
    return item.netBalance;
  };

  // Fixed Assets: Vehicles
  const v1Gross = getBal('1601');
  const v1Dep = getBal('1691'); // Stored as negative or deduction
  const v2Gross = getBal('1602');
  const v2Dep = getBal('1692');

  const v1Net = v1Gross - Math.abs(v1Dep);
  const v2Net = v2Gross - Math.abs(v2Dep);
  const vehiclesGrossValue = v1Gross + v2Gross;
  const accumulatedDepreciation = Math.abs(v1Dep) + Math.abs(v2Dep);
  const vehiclesNetBookValue = v1Net + v2Net;

  const vehicleDetails = vehicles.map((v, idx) => {
    const gross = idx === 0 ? v1Gross : v2Gross;
    const dep = Math.abs(idx === 0 ? v1Dep : v2Dep);
    return {
      plate: v.plateNumber,
      gross: gross || v.originalPurchaseCost || 0,
      dep: dep || v.accumulatedDepreciation || 0,
      net: (gross || v.originalPurchaseCost || 0) - (dep || v.accumulatedDepreciation || 0),
    };
  });

  // Current Assets
  const cashInHand = getBal('1100');
  const bankBalance = getBal('1200');
  const fastagWallet = getBal('1300');
  const clientReceivables = getBal('1400');
  const driverAdvancesRecoverable = getBal('1501') + getBal('1502');

  const totalCurrentAssets =
    cashInHand +
    bankBalance +
    fastagWallet +
    clientReceivables +
    driverAdvancesRecoverable;

  const totalAssets = vehiclesNetBookValue + totalCurrentAssets;

  // Liabilities
  const loan1 = getBal('2101');
  const loan2 = getBal('2102');
  const vehicleLoansPayable = loan1 + loan2;

  const loanDetails = vehicles.map((v, idx) => ({
    plate: v.plateNumber,
    bank: v.financierName || 'Financier Bank',
    balance: idx === 0 ? loan1 : loan2,
  }));

  const fuelPumpCreditsPayable = getBal('2201') + getBal('2202');
  const unpaidDriverSalaries = getBal('2301') + getBal('2302');
  const workshopVendorPayables = getBal('2400');

  const totalCurrentLiabilities =
    fuelPumpCreditsPayable +
    unpaidDriverSalaries +
    workshopVendorPayables;

  const totalLiabilities = vehicleLoansPayable + totalCurrentLiabilities;

  // Equity
  const proprietorCapital = getBal('3100');
  const retainedEarningsOpening = getBal('3200');

  // Current period profit/loss comes from the Income Statement for the period
  const { consolidated } = generateIncomeStatement(entries, vehicles, dateFilter);
  const currentPeriodNetProfit = consolidated.netOperatingProfit;

  const totalEquity = proprietorCapital + retainedEarningsOpening + currentPeriodNetProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const difference = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;
  const isBalanced = Math.abs(difference) < 0.05;

  return {
    asOfDate: asOfDate || new Date().toISOString().split('T')[0],
    assets: {
      fixedAssets: {
        vehiclesGrossValue,
        accumulatedDepreciation,
        vehiclesNetBookValue,
        details: vehicleDetails,
      },
      currentAssets: {
        cashInHand,
        bankBalance,
        fastagWallet,
        clientReceivables,
        driverAdvancesRecoverable,
        totalCurrentAssets,
      },
      totalAssets,
    },
    liabilities: {
      longTermLiabilities: {
        vehicleLoansPayable,
        details: loanDetails,
      },
      currentLiabilities: {
        fuelPumpCreditsPayable,
        unpaidDriverSalaries,
        workshopVendorPayables,
        totalCurrentLiabilities,
      },
      totalLiabilities,
    },
    equity: {
      proprietorCapital,
      retainedEarningsOpening,
      currentPeriodNetProfit,
      totalEquity,
    },
    totalLiabilitiesAndEquity,
    difference,
    isBalanced,
  };
}

/**
 * Calculates Running Driver Settlement Ledger
 */
export function calculateDriverLedger(
  driver: DriverProfile,
  entries: JournalEntry[]
): {
  advancesGiven: number;
  advancesDeducted: number;
  netAdvancePending: number;
  salariesAccrued: number;
  salariesPaid: number;
  netSalaryPayable: number;
  bhattaTotalReceived: number;
} {
  let advancesGiven = driver.currentAdvanceBalance;
  let advancesDeducted = 0;
  let salariesAccrued = driver.unpaidSalaryBalance;
  let salariesPaid = 0;
  let bhattaTotalReceived = 0;

  for (const entry of entries) {
    if (entry.driverId === driver.id) {
      if (entry.voucherType === 'DRIVER_ADVANCE') {
        const line = entry.lines.find(l => l.accountCode === '1501' || l.accountCode === '1502');
        if (line && line.debit > 0) advancesGiven += line.debit;
      } else if (entry.voucherType === 'DRIVER_BHATTA') {
        const line = entry.lines.find(l => l.accountCode.startsWith('530'));
        if (line && line.debit > 0) bhattaTotalReceived += line.debit;
      } else if (entry.voucherType === 'SALARY_PAYMENT') {
        if (entry.metadata?.driverAdvanceDeducted) {
          advancesDeducted += entry.metadata.driverAdvanceDeducted;
        }
        const salaryLine = entry.lines.find(l => l.accountCode === '2301' || l.accountCode === '2302');
        if (salaryLine && salaryLine.debit > 0) salariesPaid += salaryLine.debit;
      } else if (entry.voucherType === 'SALARY_ACCRUAL') {
        const line = entry.lines.find(l => l.accountCode.startsWith('610'));
        if (line && line.debit > 0) salariesAccrued += line.debit;
      }
    }
  }

  const netAdvancePending = advancesGiven - advancesDeducted;
  const netSalaryPayable = salariesAccrued - salariesPaid;

  return {
    advancesGiven,
    advancesDeducted,
    netAdvancePending,
    salariesAccrued,
    salariesPaid,
    netSalaryPayable,
    bhattaTotalReceived,
  };
}

/**
 * Calculates Fuel Pump Credit Ledger
 */
export function calculatePumpLedger(
  pump: FuelPumpAccount,
  entries: JournalEntry[]
): {
  openingBalance: number;
  totalFuelCredited: number;
  totalPaymentsSettled: number;
  currentBalance: number;
  litersSupplied: number;
} {
  let totalFuelCredited = 0;
  let totalPaymentsSettled = 0;
  let litersSupplied = 0;

  for (const entry of entries) {
    if (entry.pumpId === pump.id) {
      if (entry.voucherType === 'DIESEL_SLIP') {
        const line = entry.lines.find(l => l.credit > 0 && l.accountCode.startsWith('220'));
        if (line) totalFuelCredited += line.credit;
        if (entry.metadata?.liters) litersSupplied += entry.metadata.liters;
      } else if (entry.voucherType === 'PUMP_SETTLEMENT') {
        const line = entry.lines.find(l => l.debit > 0 && l.accountCode.startsWith('220'));
        if (line) totalPaymentsSettled += line.debit;
      }
    }
  }

  const currentBalance = pump.currentOutstandingPayable + totalFuelCredited - totalPaymentsSettled;

  return {
    openingBalance: pump.currentOutstandingPayable,
    totalFuelCredited,
    totalPaymentsSettled,
    currentBalance,
    litersSupplied,
  };
}

/**
 * Calculates Client Freight Receivables Ledger
 */
export function calculateClientLedger(
  client: ClientProfile,
  entries: JournalEntry[]
): {
  openingBalance: number;
  totalFreightBilled: number;
  totalPaymentsCollected: number;
  currentBalance: number;
  totalMTTransported: number;
} {
  let totalFreightBilled = 0;
  let totalPaymentsCollected = 0;
  let totalMTTransported = 0;

  for (const entry of entries) {
    if (entry.clientId === client.id) {
      if (entry.voucherType === 'FREIGHT_BILL') {
        const line = entry.lines.find(l => l.accountCode === '1400' && l.debit > 0);
        if (line) totalFreightBilled += line.debit;
        if (entry.metadata?.cargoWeightMT) totalMTTransported += entry.metadata.cargoWeightMT;
      } else if (entry.voucherType === 'CLIENT_RECEIPT') {
        const line = entry.lines.find(l => l.accountCode === '1400' && l.credit > 0);
        if (line) totalPaymentsCollected += line.credit;
      }
    }
  }

  const currentBalance = client.currentReceivableBalance + totalFreightBilled - totalPaymentsCollected;

  return {
    openingBalance: client.currentReceivableBalance,
    totalFreightBilled,
    totalPaymentsCollected,
    currentBalance,
    totalMTTransported,
  };
}

