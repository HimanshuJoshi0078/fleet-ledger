import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Globe,
  Server,
  Lock,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  Trash2
} from 'lucide-react';
import { AppState } from '../../services/storage';

interface StaticPagesViewProps {
  state: AppState;
  onResetToZero?: () => void;
}

export const StaticPagesView: React.FC<StaticPagesViewProps> = ({ state, onResetToZero }) => {
  const [activeSection, setActiveSection] = useState<'PRIVACY' | 'TERMS' | 'DOMAIN_MAPPING' | 'SYSTEM_INFO'>('PRIVACY');

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>System Information &amp; Legal Policies</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production deployment specifications, commercial logistics privacy, service terms, and custom DNS domain routing
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap bg-slate-100 p-1 rounded-md border border-slate-300 text-xs overflow-x-auto w-full sm:w-auto gap-1">
          <button
            onClick={() => setActiveSection('PRIVACY')}
            className={`px-3.5 py-2 min-h-[42px] font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap flex items-center justify-center flex-1 sm:flex-initial ${
              activeSection === 'PRIVACY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveSection('TERMS')}
            className={`px-3.5 py-2 min-h-[42px] font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap flex items-center justify-center flex-1 sm:flex-initial ${
              activeSection === 'TERMS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Terms &amp; Conditions
          </button>
          <button
            onClick={() => setActiveSection('DOMAIN_MAPPING')}
            className={`px-3.5 py-2 min-h-[42px] font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap flex items-center justify-center flex-1 sm:flex-initial ${
              activeSection === 'DOMAIN_MAPPING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Custom Domain Setup
          </button>
          <button
            onClick={() => setActiveSection('SYSTEM_INFO')}
            className={`px-3.5 py-2 min-h-[42px] font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap flex items-center justify-center flex-1 sm:flex-initial ${
              activeSection === 'SYSTEM_INFO'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            System Diagnostics
          </button>
        </div>
      </div>

      {/* 1. PRIVACY POLICY */}
      {activeSection === 'PRIVACY' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 text-xs text-slate-700 space-y-4 max-w-4xl">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Commercial Transport Privacy Policy</h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Effective Date: November 5, 2026 | Version 1.0 (Logistics Data Protocol)
            </p>
          </div>

          <div className="space-y-3 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              1. Information Collection &amp; Operational Data Scope
            </h3>
            <p>
              FLEETLEDGER ERP operates as a dedicated transport accounting engine for commercial fleet operations. The system records operational logistics data including commercial vehicle registration marks (e.g., RJ-14-GB-1001), driver identity credentials, heavy commercial vehicle driving license numbers, consignment lorry receipts (Bilties), GPS transit waypoints, fuel pump credit slips, and banking transaction references.
            </p>

            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              2. Data Storage, Isolation &amp; Privacy Boundary
            </h3>
            <p>
              All accounting records, journal entries, and financial ledgers generated through this application remain entirely isolated within your enterprise environment. FLEETLEDGER ERP implements a zero-leakage local storage architecture: your client invoicing data, driver salaries, and bank account balances are never transmitted to unauthorized third-party analytics trackers, public registries, or external advertising brokers.
            </p>

            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              3. Commercial Integrity &amp; Fastag Compliance
            </h3>
            <p>
              National Highway Authority of India (NHAI) Fastag wallet transaction logs, toll plaza debits, and state boundary green tax records are maintained strictly for operational cost accounting, expense verification, and tax audit compliance.
            </p>

            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              4. Data Retention &amp; Export Rights
            </h3>
            <p>
              Proprietors retain absolute ownership over all historical ledger data. You may download complete structured JSON audit backups or export tabular CSV ledgers at any time via the Data / Backup management hub.
            </p>
          </div>
        </div>
      )}

      {/* 2. TERMS AND CONDITIONS */}
      {activeSection === 'TERMS' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 text-xs text-slate-700 space-y-4 max-w-4xl">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Terms of Transport Accounting Service</h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Last Updated: November 5, 2026 | Commercial Transport Operations Agreement
            </p>
          </div>

          <div className="space-y-3 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              1. Scope of Commercial Logistics Service
            </h3>
            <p>
              FLEETLEDGER ERP provides double-entry accounting software designed specifically for commercial fleet owners, transport contractors, and logistics operators. The platform facilitates per-truck cost accounting, fuel slip management, driver salary settlement calculations, and automated monthly balance sheet preparation.
            </p>

            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              2. Double-Entry Accounting Veracity
            </h3>
            <p>
              The system calculates financial position based on standard double-entry principles (Assets = Liabilities + Owner Equity). The user is solely responsible for ensuring that voucher entries (including liters pumped, freight rates per metric ton, and driver advances) reflect actual physical invoices, bills of lading, and official bank statements.
            </p>

            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              3. Vehicle Compliance &amp; Regulatory Filings
            </h3>
            <p>
              While FLEETLEDGER ERP includes tracking tools for National Permits, fitness certificates, and vehicle insurance policies, this software does not replace mandatory filings with regional transport offices (RTO), GST portals, or the Ministry of Road Transport and Highways (MoRTH).
            </p>

            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              4. Limitation of Financial Liability
            </h3>
            <p>
              Under no circumstances shall the software authors or platform operators be held liable for statutory tax penalties, highway toll disputations, or transport business operational losses arising from manual entry inaccuracies or unverified bookkeeping adjustments.
            </p>
          </div>
        </div>
      )}

      {/* 3. CUSTOM DOMAIN MAPPING CONFIGURATION */}
      {activeSection === 'DOMAIN_MAPPING' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 text-xs text-slate-700 space-y-4 max-w-4xl">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Production Custom Domain &amp; DNS Mapping Guide</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Configuration instructions for mapping custom business domains (e.g., erp.yourfleet.com)
            </p>
          </div>

          <div className="space-y-3 leading-relaxed">
            <p>
              FLEETLEDGER ERP is engineered as a static-deployable Single Page Application (SPA) compatible with any cloud hosting provider (Cloudflare Pages, Vercel, Netlify, AWS S3 / CloudFront, or NGINX).
            </p>

            <div className="bg-slate-900 text-slate-200 p-4 rounded font-mono text-xs space-y-2 border border-slate-800">
              <div className="text-slate-400 font-bold uppercase text-[10px]">
                Recommended DNS Records for Custom Domain Setup:
              </div>
              <div className="grid grid-cols-4 gap-2 text-slate-300 border-b border-slate-800 pb-1 text-[11px] font-bold">
                <span>Record Type</span>
                <span>Host Name</span>
                <span>Target Value / IP</span>
                <span>Proxy / TTL</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-slate-100 text-[11px]">
                <span className="text-blue-400 font-bold">CNAME</span>
                <span>fleet</span>
                <span>custom.fleetledger.app</span>
                <span>DNS Only / Auto</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-slate-100 text-[11px]">
                <span className="text-blue-400 font-bold">CNAME</span>
                <span>@ (Root)</span>
                <span>fleet-app-prod.pages.dev</span>
                <span>Proxied (Cloudflare)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Production Checklist Verification:
              </h3>
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Custom SVG Favicon configured at /favicon.svg (Deep slate truck &amp; ledger glyph)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Production web manifest configured at /manifest.json</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Search engine robot policy configured at /robots.txt</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>All third-party "Made with AI" and default boilerplate badges purged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SYSTEM DIAGNOSTICS */}
      {activeSection === 'SYSTEM_INFO' && (
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 text-xs text-slate-700 space-y-4 max-w-4xl">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              <span>System Diagnostics &amp; Runtime Specifications</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Diagnostic verification of double-entry ledger state and database persistence
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                Ledger Data Inventory
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chart of Accounts:</span>
                  <span className="font-bold text-slate-900">{state.accounts.length} Accounts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commercial Trucks:</span>
                  <span className="font-bold text-slate-900">{state.vehicles.length} Trucks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver Profiles:</span>
                  <span className="font-bold text-slate-900">{state.drivers.length} Drivers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fuel Pump Accounts:</span>
                  <span className="font-bold text-slate-900">{state.pumps.length} Stations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Profiles:</span>
                  <span className="font-bold text-slate-900">{state.clients.length} Consignors</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Journal Entries Logged:</span>
                  <span className="font-bold text-blue-700">{state.journalEntries.length} Transactions</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                Accounting Engine Health
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Accounting Convention:</span>
                  <span className="text-slate-900">Double-Entry Accrual</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Currency Standard:</span>
                  <span className="text-slate-900">Indian Rupee (INR / ₹)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Persistence Protocol:</span>
                  <span className="text-emerald-700 font-bold">LocalStorage (Synchronous)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Build:</span>
                  <span className="text-slate-900">FleetLedger-ERP-v1.0.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Reset & Zero State Utility */}
          <div className="bg-rose-50 border border-rose-200 rounded p-4 space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Zero Database Baseline / Reset State</span>
              </div>
              <span className="text-[10px] bg-rose-200 text-rose-800 font-mono font-bold px-2 py-0.5 rounded">
                Admin Action
              </span>
            </div>
            <p className="text-xs text-rose-700">
              Wipe all operational transactions, trucks, drivers, clients, and pump ledgers back to an absolute clean 0 state. Chart of Accounts structure and balance validation are maintained.
            </p>
            {onResetToZero && (
              <button
                onClick={() => {
                  if (window.confirm('WIPE ALL DATA: Are you sure you want to clear all data? This will wipe all trucks, drivers, clients, pumps, and transactions back to an absolute clean 0 state.')) {
                    onResetToZero();
                  }
                }}
                className="px-4 py-2 min-h-[42px] bg-rose-700 hover:bg-rose-800 text-white rounded text-xs sm:text-sm font-bold transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center whitespace-nowrap"
              >
                Clear All Data (Reset to Zero)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

