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

  // Ensure any account code referenced in journal entries is included in trial balance
  const knownCodes = new Set(accounts.map(a => a.code));
  const allAccounts = [...accounts];

  for (const entry of filteredEntries) {
    for (const line of entry.lines) {
      debitSums[line.accountCode] = (debitSums[line.accountCode] || 0) + (line.debit || 0);
      creditSums[line.accountCode] = (creditSums[line.accountCode] || 0) + (line.credit || 0);

      if (!knownCodes.has(line.accountCode)) {
        knownCodes.add(line.accountCode);
        const code = line.accountCode;
        let category: Account['category'] = 'EXPENSE';
        let subCategory: Account['subCategory'] = 'DIRECT_EXPENSE';
        if (code.startsWith('1')) {
          category = 'ASSET';
          subCategory = code.startsWith('16') ? 'FIXED_ASSET' : 'CURRENT_ASSET';
        } else if (code.startsWith('2')) {
          category = 'LIABILITY';
          subCategory = code.startsWith('21') ? 'LONG_TERM_LIABILITY' : 'CURRENT_LIABILITY';
        } else if (code.startsWith('3')) {
          category = 'EQUITY';
          subCategory = 'CAPITAL';
        } else if (code.startsWith('4')) {
          category = 'REVENUE';
          subCategory = 'DIRECT_INCOME';
        } else if (code.startsWith('5')) {
          category = 'EXPENSE';
          subCategory = 'DIRECT_EXPENSE';
        } else if (code.startsWith('6')) {
          category = 'EXPENSE';
          subCategory = 'FIXED_OVERHEAD';
        }

        allAccounts.push({
          code,
          name: line.accountName || `Account ${code}`,
          category,
          subCategory,
          openingBalance: 0,
        });
      }
    }
  }

  let grandDebit = 0;
  let grandCredit = 0;

  const items: TrialBalanceItem[] = allAccounts.map(acc => {
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
  for (const entry of filteredEntries) {
    let targetBreakdown = entry.vehiclePlate ? breakdowns[entry.vehiclePlate] : undefined;

    // Helper to resolve the target vehicle breakdown from account code suffix or entry
    const getVehicleBreakdown = (code: string) => {
      if (targetBreakdown) return targetBreakdown;
      const lastTwo = code.slice(-2);
      const idx = parseInt(lastTwo, 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < vehicles.length && breakdowns[vehicles[idx].plateNumber]) {
        return breakdowns[vehicles[idx].plateNumber];
      }
      return undefined;
    };

    for (const line of entry.lines) {
      const code = line.accountCode;
      const bd = getVehicleBreakdown(code);

      // Revenue: Credit lines in 4000 series
      if (line.credit > 0 && code.startsWith('4')) {
        if (code === '4200') {
          if (bd) bd.detentionAndOtherIncome += line.credit;
          consolidated.detentionAndOtherIncome += line.credit;
        } else {
          if (bd) {
            bd.grossFreightRevenue += line.credit;
          }
          consolidated.grossFreightRevenue += line.credit;
        }
      }

      // Expenses: Debit lines in 5000 (Direct) & 6000 (Fixed)
      if (line.debit > 0) {
        // Diesel: 51xx
        if (code.startsWith('51')) {
          if (bd) {
            bd.dieselExpense += line.debit;
            if (entry.metadata?.liters) bd.dieselLiters += entry.metadata.liters;
          }
          consolidated.dieselExpense += line.debit;
          if (entry.metadata?.liters) consolidated.dieselLiters += entry.metadata.liters;
        }
        // Tolls: 52xx
        else if (code.startsWith('52')) {
          if (bd) {
            bd.tollExpense += line.debit;
          }
          consolidated.tollExpense += line.debit;
        }
        // Driver Bhatta: 53xx
        else if (code.startsWith('53')) {
          if (bd) {
            bd.driverBhattaExpense += line.debit;
          }
          consolidated.driverBhattaExpense += line.debit;
        }
        // Repairs: 54xx
        else if (code.startsWith('54')) {
          if (bd) {
            bd.enrouteRepairsExpense += line.debit;
          }
          consolidated.enrouteRepairsExpense += line.debit;
        }
        // Hamali: 55xx
        else if (code.startsWith('55')) {
          if (bd) {
            bd.loadingHamaliExpense += line.debit;
          }
          consolidated.loadingHamaliExpense += line.debit;
        }
        // Border tax: 56xx
        else if (code.startsWith('56')) {
          if (bd) {
            bd.borderGreenTaxExpense += line.debit;
          }
          consolidated.borderGreenTaxExpense += line.debit;
        }
        // Fixed: Driver Salary 61xx
        else if (code.startsWith('61')) {
          if (bd) {
            bd.driverBaseSalary += line.debit;
          }
          consolidated.driverBaseSalary += line.debit;
        }
        // Loan Interest: 62xx
        else if (code.startsWith('62')) {
          if (bd) {
            bd.loanInterestExpense += line.debit;
          }
          consolidated.loanInterestExpense += line.debit;
        }
        // Insurance/Permits: 63xx
        else if (code.startsWith('63')) {
          if (bd) {
            bd.insuranceAmortization += line.debit;
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
        // Depreciation: 65xx
        else if (code.startsWith('65')) {
          if (bd) {
            bd.depreciationExpense += line.debit;
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

  // Fixed Assets: Dynamic across all registered vehicles
  const vehicleDetails = vehicles.map((v, idx) => {
    const suffix = String(idx + 1).padStart(2, '0');
    const assetAcc = accounts.find(a => a.code === `16${suffix}` || (a.category === 'ASSET' && a.subCategory === 'FIXED_ASSET' && a.vehiclePlate === v.plateNumber && !a.name.toLowerCase().includes('depreciation')));
    const deprAcc = accounts.find(a => a.code === `169${idx + 1}` || (a.category === 'ASSET' && a.subCategory === 'FIXED_ASSET' && a.vehiclePlate === v.plateNumber && a.name.toLowerCase().includes('depreciation')));
    const gross = assetAcc ? getBal(assetAcc.code) : (v.originalPurchaseCost || 0);
    const dep = deprAcc ? Math.abs(getBal(deprAcc.code)) : (v.accumulatedDepreciation || 0);
    return {
      plate: v.plateNumber,
      gross: gross || 0,
      dep: dep || 0,
      net: (gross || 0) - (dep || 0),
    };
  });

  const vehiclesGrossValue = vehicleDetails.reduce((s, d) => s + d.gross, 0);
  const accumulatedDepreciation = vehicleDetails.reduce((s, d) => s + d.dep, 0);
  const vehiclesNetBookValue = vehiclesGrossValue - accumulatedDepreciation;

  // Current Assets
  const cashInHand = getBal('1100');
  const bankBalance = getBal('1200');
  const fastagWallet = getBal('1300');
  const clientReceivables = getBal('1400');
  const driverAdvancesRecoverable = items.filter(i => i.code.startsWith('15')).reduce((sum, i) => sum + i.netBalance, 0);

  const totalCurrentAssets =
    cashInHand +
    bankBalance +
    fastagWallet +
    clientReceivables +
    driverAdvancesRecoverable;

  const totalAssets = vehiclesNetBookValue + totalCurrentAssets;

  // Liabilities
  const loanDetails = vehicles.map((v, idx) => {
    const suffix = String(idx + 1).padStart(2, '0');
    const loanAcc = accounts.find(a => a.code === `21${suffix}` || (a.category === 'LIABILITY' && a.vehiclePlate === v.plateNumber));
    const balance = loanAcc ? getBal(loanAcc.code) : (v.loanCurrentPrincipal || 0);
    return {
      plate: v.plateNumber,
      bank: v.financierName || 'Financier Bank',
      balance: balance || 0,
    };
  });
  const vehicleLoansPayable = loanDetails.reduce((s, l) => s + l.balance, 0);

  const fuelPumpCreditsPayable = items.filter(i => i.code.startsWith('22')).reduce((sum, i) => sum + i.netBalance, 0);
  const unpaidDriverSalaries = items.filter(i => i.code.startsWith('23')).reduce((sum, i) => sum + i.netBalance, 0);
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
        const line = entry.lines.find(l => l.accountCode.startsWith('15'));
        if (line && line.debit > 0) advancesGiven += line.debit;
      } else if (entry.voucherType === 'DRIVER_BHATTA') {
        const line = entry.lines.find(l => l.accountCode.startsWith('53'));
        if (line && line.debit > 0) bhattaTotalReceived += line.debit;
      } else if (entry.voucherType === 'SALARY_PAYMENT') {
        if (entry.metadata?.driverAdvanceDeducted) {
          advancesDeducted += entry.metadata.driverAdvanceDeducted;
        }
        const salaryLine = entry.lines.find(l => l.accountCode.startsWith('23'));
        if (salaryLine && salaryLine.debit > 0) salariesPaid += salaryLine.debit;
      } else if (entry.voucherType === 'SALARY_ACCRUAL') {
        const line = entry.lines.find(l => l.accountCode.startsWith('61'));
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

/**
 * Compliance Expiry Alert Model & Scanner
 */
export interface ComplianceAlertItem {
  plateNumber: string;
  vehiclePlate: string;
  documentType: string;
  documentName: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'EXPIRED' | 'EXPIRING_SOON';
}

/**
 * Automatically scans all trucks' document dates against the current date.
 * Returns alerts ONLY when any document is Expired (< 0 days) or Expiring Soon (<= 15 days).
 */
export function getComplianceAlerts(vehicles: VehicleProfile[]): ComplianceAlertItem[] {
  const alerts: ComplianceAlertItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const docsToCheck: { key: keyof VehicleProfile; name: string }[] = [
    { key: 'insuranceExpiryDate', name: 'Insurance Policy' },
    { key: 'fitnessCertificateExpiryDate', name: 'Fitness Certificate' },
    { key: 'nationalPermitExpiryDate', name: 'National/State Permit' },
    { key: 'pucExpiryDate', name: 'PUC (Pollution)' },
    { key: 'roadTaxExpiryDate', name: 'Road Tax Token' },
  ];

  for (const v of vehicles) {
    for (const doc of docsToCheck) {
      const expiryStr = v[doc.key] as string | undefined;
      if (!expiryStr || typeof expiryStr !== 'string' || expiryStr.trim() === '') continue;

      const expDate = new Date(expiryStr);
      if (isNaN(expDate.getTime())) continue;
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        alerts.push({
          plateNumber: v.plateNumber,
          vehiclePlate: v.plateNumber,
          documentType: doc.key as string,
          documentName: doc.name,
          expiryDate: expiryStr,
          daysRemaining,
          status: 'EXPIRED',
        });
      } else if (daysRemaining <= 15) {
        alerts.push({
          plateNumber: v.plateNumber,
          vehiclePlate: v.plateNumber,
          documentType: doc.key as string,
          documentName: doc.name,
          expiryDate: expiryStr,
          daysRemaining,
          status: 'EXPIRING_SOON',
        });
      }
    }
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Odometer & Mileage (KMPL) Tracking Model & Computation
 */
export interface FuelMileageMetric {
  entryId: string;
  vehiclePlate: string;
  odometer: number;
  previousOdometer: number | null;
  distanceKm: number | null;
  liters: number;
  kmpl: number | null;
}

export function calculateFleetFuelMileage(entries: JournalEntry[]): {
  metricsByEntryId: Record<string, FuelMileageMetric>;
  averageKmplByPlate: Record<string, number | null>;
} {
  const entriesByPlate: Record<string, JournalEntry[]> = {};

  for (const entry of entries) {
    if (entry.voucherType === 'DIESEL_SLIP' && entry.vehiclePlate && entry.vehiclePlate !== 'COMPANY') {
      if (!entriesByPlate[entry.vehiclePlate]) {
        entriesByPlate[entry.vehiclePlate] = [];
      }
      entriesByPlate[entry.vehiclePlate].push(entry);
    }
  }

  const metricsByEntryId: Record<string, FuelMileageMetric> = {};
  const averageKmplByPlate: Record<string, number | null> = {};

  for (const plate in entriesByPlate) {
    // Sort chronologically by date ascending, then voucher/time
    const plateEntries = [...entriesByPlate[plate]].sort((a, b) => {
      const dCmp = a.date.localeCompare(b.date);
      if (dCmp !== 0) return dCmp;
      return (a.voucherNumber || a.id).localeCompare(b.voucherNumber || b.id);
    });

    let prevOdo: number | null = null;
    let totalValidDist = 0;
    let totalValidLiters = 0;

    for (const entry of plateEntries) {
      const currentOdo = entry.metadata?.odometer;
      const liters = entry.metadata?.liters || 0;

      if (typeof currentOdo === 'number' && currentOdo > 0) {
        if (prevOdo !== null && currentOdo > prevOdo && liters > 0) {
          const distanceKm = currentOdo - prevOdo;
          const kmpl = Math.round((distanceKm / liters) * 100) / 100;
          metricsByEntryId[entry.id] = {
            entryId: entry.id,
            vehiclePlate: plate,
            odometer: currentOdo,
            previousOdometer: prevOdo,
            distanceKm,
            liters,
            kmpl,
          };
          totalValidDist += distanceKm;
          totalValidLiters += liters;
        } else {
          metricsByEntryId[entry.id] = {
            entryId: entry.id,
            vehiclePlate: plate,
            odometer: currentOdo,
            previousOdometer: prevOdo,
            distanceKm: null,
            liters,
            kmpl: null,
          };
        }
        prevOdo = currentOdo;
      } else {
        metricsByEntryId[entry.id] = {
          entryId: entry.id,
          vehiclePlate: plate,
          odometer: 0,
          previousOdometer: null,
          distanceKm: null,
          liters,
          kmpl: null,
        };
      }
    }

    if (totalValidLiters > 0 && totalValidDist > 0) {
      averageKmplByPlate[plate] = Math.round((totalValidDist / totalValidLiters) * 100) / 100;
    } else {
      averageKmplByPlate[plate] = null;
    }
  }

  return { metricsByEntryId, averageKmplByPlate };
}

