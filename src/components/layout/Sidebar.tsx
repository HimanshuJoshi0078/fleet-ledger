import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Truck,
  Scale,
  LineChart,
  Users,
  Fuel,
  Receipt,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'daybook'
  | 'truck_ledger'
  | 'income_statement'
  | 'balance_sheet'
  | 'trial_balance'
  | 'fleet_master'
  | 'driver_hub'
  | 'fuel_pumps'
  | 'client_bilties'
  | 'static_pages';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  truckAPlate: string;
  truckBPlate: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  truckAPlate,
  truckBPlate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Fleet Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'daybook' as ActiveTab,
      label: 'Daily Daybook (Journal)',
      icon: BookOpen,
      badge: 'All Vouchers',
    },
    {
      id: 'truck_ledger' as ActiveTab,
      label: 'Per-Truck Ledger & P&L',
      icon: Truck,
      sublabel: `${truckAPlate} vs ${truckBPlate}`,
    },
    {
      id: 'income_statement' as ActiveTab,
      label: 'Income Statement (P&L)',
      icon: LineChart,
      sublabel: 'Operating & Net Margin',
    },
    {
      id: 'balance_sheet' as ActiveTab,
      label: 'Balance Sheet',
      icon: Scale,
      badge: 'Tally Double-Entry',
    },
    {
      id: 'trial_balance' as ActiveTab,
      label: 'Trial Balance',
      icon: FileSpreadsheet,
      sublabel: 'Audit & Closing Balances',
    },
    {
      id: 'fleet_master' as ActiveTab,
      label: 'Fleet Master & EMIs',
      icon: Building2,
      sublabel: 'Assets, Depreciation, Loans',
    },
    {
      id: 'driver_hub' as ActiveTab,
      label: 'Drivers & Salary Hub',
      icon: Users,
      sublabel: 'Advances & Settlements',
    },
    {
      id: 'fuel_pumps' as ActiveTab,
      label: 'Fuel Pumps (Credit)',
      icon: Fuel,
      sublabel: 'IOCL / BPCL Statements',
    },
    {
      id: 'client_bilties' as ActiveTab,
      label: 'Clients & Bilties (LR)',
      icon: Receipt,
      sublabel: 'Freight Receivables',
    },
    {
      id: 'static_pages' as ActiveTab,
      label: 'System & Legal',
      icon: ShieldCheck,
      sublabel: 'Privacy, Terms, Domain DNS',
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out no-print overflow-y-auto
          md:static md:translate-x-0 md:w-64 md:z-auto md:flex-shrink-0
          ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="py-3">
          <div className="px-4 pb-3 mb-2 border-b border-slate-800 flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Accounting Navigation
            </div>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="space-y-1 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate">{item.label}</div>
                      {item.sublabel && (
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-normal flex-shrink-0 ml-1 ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Fleet quick summary footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
          <div className="font-semibold text-slate-300 mb-1">OPERATIONAL PROFILE</div>
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Truck A:</span>
              <span className="text-slate-300">{truckAPlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Truck B:</span>
              <span className="text-slate-300">{truckBPlate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Basis:</span>
              <span className="text-emerald-400">Double-Entry Accrual</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

