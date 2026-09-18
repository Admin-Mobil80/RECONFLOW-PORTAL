/**
 * The interface (adaptor) catalogue an administrator turns on for their
 * organisation.
 *
 * ReconFlow is neutral about source systems: the standard adaptors below are
 * conveniences, not a supported-systems list. Anything an enterprise runs can
 * be plugged in through a proprietary adaptor.
 *
 * There is no backend yet, so state lives in this module behind an async API.
 * When AppSync lands, only `interfaceService` changes; the screen does not.
 */

export type InterfaceCategory =
  | "ERP"
  | "Procurement"
  | "Expense management"
  | "Travel management"
  | "Workflow"
  | "Disbursement"
  | "Vendor management"
  | "Financial";

export interface SourceInterface {
  readonly id: string;
  readonly name: string;
  readonly category: InterfaceCategory;
  /** Standard adaptors ship with ReconFlow; proprietary ones are built per customer. */
  readonly kind: "standard" | "proprietary";
  readonly description: string;
  enabled: boolean;
}

const catalogue: SourceInterface[] = [
  {
    id: "sap-s4",
    name: "SAP S/4HANA",
    category: "ERP",
    kind: "standard",
    description: "General ledger, purchase orders and goods receipts.",
    enabled: true,
  },
  {
    id: "ms-dynamics",
    name: "Microsoft Dynamics 365",
    category: "ERP",
    kind: "standard",
    description: "Finance and operations records.",
    enabled: false,
  },
  {
    id: "oracle-fusion",
    name: "Oracle Fusion",
    category: "Financial",
    kind: "standard",
    description: "Sub-ledgers, journals and period balances.",
    enabled: false,
  },
  {
    id: "coupa",
    name: "Coupa",
    category: "Procurement",
    kind: "standard",
    description: "Requisitions, purchase orders and invoices.",
    enabled: true,
  },
  {
    id: "sap-concur",
    name: "SAP Concur",
    category: "Expense management",
    kind: "standard",
    description: "Expense claims, receipts and approvals.",
    enabled: true,
  },
  {
    id: "amadeus-cytric",
    name: "Amadeus Cytric",
    category: "Travel management",
    kind: "standard",
    description: "Bookings, itineraries and travel invoices.",
    enabled: false,
  },
  {
    id: "workday",
    name: "Workday",
    category: "Workflow",
    kind: "standard",
    description: "Worker records, cost centres and approval chains.",
    enabled: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "Workflow",
    kind: "standard",
    description: "Opportunities, contracts and billing schedules.",
    enabled: false,
  },
  {
    id: "swift-disbursement",
    name: "Disbursement gateway",
    category: "Disbursement",
    kind: "standard",
    description: "Outbound payment instructions and settlement confirmations.",
    enabled: true,
  },
  {
    id: "vendor-master",
    name: "Vendor master",
    category: "Vendor management",
    kind: "standard",
    description: "Vendor identities, bank details and status changes.",
    enabled: false,
  },
  {
    id: "legacy-treasury",
    name: "Treasury system (in-house)",
    category: "Financial",
    kind: "proprietary",
    description: "Custom adaptor over a file drop from the treasury platform.",
    enabled: false,
  },
];

/** Deliberately async: the real implementation will be a network call. */
export const interfaceService = {
  async list(): Promise<SourceInterface[]> {
    return catalogue.map((entry) => ({ ...entry }));
  },

  async setEnabled(id: string, enabled: boolean): Promise<SourceInterface> {
    const entry = catalogue.find((candidate) => candidate.id === id);
    if (!entry) throw new Error(`Unknown interface: ${id}`);
    entry.enabled = enabled;
    return { ...entry };
  },

  /** True while this is in-memory only, so the UI can say so. */
  isMock: true as const,
};
