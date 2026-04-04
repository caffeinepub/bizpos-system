import { useCallback, useEffect, useState } from "react";

// ---- Types ----
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Company {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  status: "Active" | "Inactive";
  createdAt: string;
  isSuperUser?: boolean;
  assignedCompanyId?: string;
  assignedWarehouseIds?: string[];
  assignedShopIds?: string[];
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Income" | "Expense" | "COGS";
  parentId?: string;
  openingBalance: number;
  currentBalance: number;
  description?: string;
  status: "Active" | "Inactive";
  normalBalance: "Debit" | "Credit";
  isGroup: boolean;
  level: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  groupId?: string;
  groupName?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  companyId?: string;
  status: "Active" | "Inactive";
}

export interface Shop {
  id: string;
  name: string;
  code: string;
  address: string;
  warehouseId: string;
  warehouseName: string;
  status: "Active" | "Inactive";
  assignedUserIds: string[];
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  employmentType: "Monthly-Salaried" | "Hourly" | "Daily-Wage";
  joinDate: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  basicSalary: number;
  hourlyRate: number;
  dailyRate: number;
  status: "Active" | "Inactive" | "Terminated";
  // Extended personal info
  nic: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  notes: string;
  shiftId?: string;
  allowances?: { allowanceTypeId: string; amount: number }[];
}

export interface PayrollItem {
  employeeId: string;
  employeeName: string;
  employmentType: string;
  basicSalary: number;
  hoursWorked?: number;
  daysWorked?: number;
  overtimeHours?: number;
  overtimeMultiplier?: number;
  allowances: {
    hra: number;
    transport: number;
    medical: number;
    bonus: number;
    commission: number;
    other: number;
  };
  grossSalary: number;
  deductions: {
    incomeTax: number;
    providentFund: number;
    loanDeduction: number;
    advance: number;
    other: number;
  };
  totalDeductions: number;
  netSalary: number;
}

export interface Payroll {
  id: string;
  period: string;
  month: number;
  year: number;
  status: "Draft" | "Finalized";
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  items: PayrollItem[];
  createdAt: string;
}

export interface ItemCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  seqNo: number;
  status: "active" | "inactive";
}

export interface ItemBrand {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

export interface ItemUnit {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  isBaseUnit: boolean;
  conversionFactor: number;
  status: "active" | "inactive";
}

export interface ItemVariant {
  id: string;
  variantType: string;
  variantValue: string;
  skuSuffix: string;
  priceAdjustment: number;
  quantity: number;
  status: "active" | "inactive";
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  variants?: ItemVariant[];
  costPrice: number;
  salePrice: number;
  quantity: number;
  warehouseId: string;
  reorderLevel?: number;
  reorderQty?: number;
}

export interface PurchaseItem {
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  purchaseDate: string;
  items: PurchaseItem[];
  total: number;
  notes?: string;
  status: "Pending" | "Received" | "Cancelled";
  createdAt: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  shopId?: string;
  shopName?: string;
  saleType: "Cash" | "Credit";
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  taxAmount?: number;
  promoSavings?: number;
  paymentMethod?: string;
  paidAmount: number;
  balanceDue: number;
  status: "Completed" | "Pending" | "Cancelled";
  saleDate: string;
  createdAt: string;
}

export interface PaymentMode {
  id: string;
  name: string;
  description?: string;
}

export interface Payment {
  id: string;
  saleId: string;
  customerName: string;
  warehouseName: string;
  paymentModeId: string;
  paymentModeName: string;
  amount: number;
  date: string;
  reference?: string;
  notes?: string;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  createdAt: string;
}

export interface Expense {
  id: string;
  accountId: string;
  accountName: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  categoryName?: string;
  paymentMethod?: string;
  reference?: string;
  createdBy?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type:
    | "Sale"
    | "Purchase"
    | "Adjustment"
    | "GRN"
    | "Transfer-Out"
    | "Transfer-In"
    | "Opening";
  reference: string;
  quantityChange: number;
  quantityAfter: number;
  warehouseId: string;
  warehouseName: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Settings {
  companyName: string;
  currency: string;
  invoiceFooter: string;
}

export interface LeaveType {
  id: string;
  name: string;
  daysAllowedPerYear: number;
  description: string;
  isActive: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  remarks: string;
  createdAt: string;
}

export interface Log {
  id: string;
  timestamp: string;
  user: string;
  userId?: string;
  module: string;
  action: "create" | "update" | "delete" | "login" | "logout" | "view";
  details: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "Debit" | "Credit";
  reference: string;
  reconciled: boolean;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  expectedDelivery: string;
  items: PurchaseOrderItem[];
  status: "Draft" | "Sent" | "Partially Received" | "Received" | "Cancelled";
  notes: string;
  totalAmount: number;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  applicableTo: "all" | "category" | "product";
  categories: string[];
  productIds: string[];
  status: "Active" | "Inactive";
}

export interface Discount {
  id: string;
  name: string;
  percentage: number;
  applicableTo: "all" | "category" | "product";
  categories: string[];
  productIds: string[];
  status: "Active" | "Inactive";
}

export interface Promotion {
  id: string;
  name: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  applicableTo: "all" | "category" | "product";
  categories: string[];
  productIds: string[];
  status: "Active" | "Inactive";
}

export interface RequisitionItem {
  productId: string;
  productName: string;
  qty: number;
  estimatedCost: number;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNo: string;
  date: string;
  requestedBy: string;
  department: string;
  items: RequisitionItem[];
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "PO Issued";
  notes: string;
  linkedPOId?: string;
  createdAt: string;
}

export interface GRNItem {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitCost: number;
}

export interface GoodsReceiptNote {
  id: string;
  grnNo: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receivedDate: string;
  items: GRNItem[];
  status:
    | "Draft"
    | "Received"
    | "Quality Checked"
    | "Accepted"
    | "Partially Accepted";
  qualityNotes: string;
  createdAt: string;
}

export interface TransferItem {
  productId: string;
  productName: string;
  qty: number;
}

export interface InventoryTransfer {
  id: string;
  transferNo: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  transferDate: string;
  items: TransferItem[];
  status: "Draft" | "In Transit" | "Completed" | "Cancelled";
  notes: string;
  createdAt: string;
}

export interface ShipmentItem {
  productName: string;
  qty: number;
}

export interface Shipment {
  id: string;
  shipmentNo: string;
  type: "Inbound" | "Outbound";
  carrier: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  expectedDate: string;
  actualDate: string;
  status: "Pending" | "Shipped" | "In Transit" | "Delivered" | "Delayed";
  linkedRefNo: string;
  items: ShipmentItem[];
  notes: string;
  createdAt: string;
}

// ---- Helpers ----

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  headOfDepartment: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Designation {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  grade: string;
  description: string;
  status: "Active" | "Inactive";
}

export interface AllowanceType {
  id: string;
  code: string;
  name: string;
  calculationType: "Fixed" | "Percentage";
  defaultValue: number;
  taxable: boolean;
  status: "Active" | "Inactive";
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  activeDays: string[];
  status: "Active" | "Inactive";
}

export interface EmployeeShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
}

export interface ShiftClosing {
  id: string;
  closingNumber: string;
  shopId: string;
  shopName: string;
  shiftId: string;
  shiftName: string;
  date: string;
  openedBy: string;
  closedBy: string;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  cashVariance: number;
  totalSales: number;
  totalTransactions: number;
  salesByPaymentMode: { mode: string; amount: number; count: number }[];
  status: "Open" | "Closed";
  notes: string;
  openedAt: string;
  closedAt: string;
}

export interface SalarySlip {
  id: string;
  slipNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  month: number;
  year: number;
  periodLabel: string;
  basicSalary: number;
  allowances: { name: string; amount: number; taxable: boolean }[];
  grossSalary: number;
  deductions: { name: string; amount: number }[];
  totalDeductions: number;
  netSalary: number;
  paymentDate: string;
  bankName: string;
  accountNumber: string;
  status: "Draft" | "Paid";
  generatedAt: string;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function normalBalanceForType(
  type: Account["type"],
): "Debit" | "Credit" {
  return type === "Asset" || type === "Expense" || type === "COGS"
    ? "Debit"
    : "Credit";
}

function getSessionUser(): string {
  try {
    const raw = localStorage.getItem("bizpos_session");
    if (!raw) return "System";
    const parsed = JSON.parse(raw);
    return parsed?.name ?? "System";
  } catch {
    return "System";
  }
}

function getSessionUserId(): string {
  try {
    const raw = localStorage.getItem("bizpos_session");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.id ?? "";
  } catch {
    return "";
  }
}

// ---- Seed Data ----
function createSeedData() {
  const roles: Role[] = [
    {
      id: "role-admin",
      name: "Admin",
      description: "Full system access",
      permissions: ["all"],
    },
    {
      id: "role-manager",
      name: "Manager",
      description: "Manage operations but no user/role admin",
      permissions: [
        "dashboard",
        "pos",
        "sales",
        "purchases",
        "inventory",
        "warehouse",
        "accounts",
        "payments",
        "reports",
        "settings",
        "shops",
        "employees",
        "salary_processing",
        "leave_management",
        "trial_balance",
        "balance_sheet",
        "profit_loss",
      ],
    },
    {
      id: "role-cashier",
      name: "Cashier",
      description: "POS, sales and payment operations",
      permissions: ["dashboard", "pos", "sales", "payments"],
    },
  ];

  const users: User[] = [
    {
      id: "user-admin",
      name: "System Admin",
      email: "admin@bizpos.com",
      password: "admin123",
      roleId: "role-admin",
      status: "Active",
      createdAt: "2024-01-01T00:00:00Z",
      isSuperUser: false,
      assignedCompanyId: "comp1",
      assignedWarehouseIds: [],
      assignedShopIds: [],
    },
    {
      id: "user-super",
      name: "Super User",
      email: "superuser@bizpos.com",
      password: "super123",
      roleId: "role-admin",
      status: "Active",
      createdAt: "2024-01-01T00:00:00.000Z",
      isSuperUser: true,
      assignedCompanyId: undefined,
      assignedWarehouseIds: [],
      assignedShopIds: [],
    },
    {
      id: "user-cashier",
      name: "John Cashier",
      email: "cashier@bizpos.com",
      password: "cashier123",
      roleId: "role-cashier",
      status: "Active",
      createdAt: "2024-01-15T00:00:00Z",
      isSuperUser: false,
      assignedCompanyId: "comp1",
      assignedWarehouseIds: ["wh1"],
      assignedShopIds: ["shop1"],
    },
  ];

  const accounts: Account[] = [
    // ── L0 ROOT ACCOUNTS
    {
      id: "acc-100",
      code: "100",
      name: "ASSETS",
      type: "Asset",
      openingBalance: 0,
      currentBalance: 0,
      description: "Root asset group",
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 0,
    },
    {
      id: "acc-200",
      code: "200",
      name: "CAPITAL AND RESERVES",
      type: "Equity",
      openingBalance: 0,
      currentBalance: 0,
      description: "Capital and reserves group",
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 0,
    },
    {
      id: "acc-300",
      code: "300",
      name: "LIABILITIES",
      type: "Liability",
      openingBalance: 0,
      currentBalance: 0,
      description: "Root liabilities group",
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 0,
    },
    {
      id: "acc-400",
      code: "400",
      name: "REVENUE",
      type: "Income",
      openingBalance: 0,
      currentBalance: 0,
      description: "Revenue group",
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 0,
    },
    {
      id: "acc-500",
      code: "500",
      name: "COST OF GOODS",
      type: "COGS",
      openingBalance: 0,
      currentBalance: 0,
      description: "Cost of goods group",
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 0,
    },
    {
      id: "acc-600",
      code: "600",
      name: "ADMINISTRATIVE EXPENSES",
      type: "Expense",
      openingBalance: 0,
      currentBalance: 0,
      description: "Administrative expenses group",
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 0,
    },
    {
      id: "acc-800",
      code: "800",
      name: "FINANCIAL CHARGES",
      type: "Expense",
      openingBalance: 0,
      currentBalance: 0,
      description: "Financial charges group",
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 0,
    },

    // ── L1 ACCOUNTS (under 100 ASSETS)
    {
      id: "acc-100-01",
      code: "100-01",
      name: "NON-CURRENT ASSETS",
      type: "Asset",
      parentId: "acc-100",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 1,
    },
    {
      id: "acc-100-02",
      code: "100-02",
      name: "CURRENT ASSETS",
      type: "Asset",
      parentId: "acc-100",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 1,
    },
    {
      id: "acc-100-03",
      code: "100-03",
      name: "LONG TERM ASSETS",
      type: "Asset",
      parentId: "acc-100",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 1,
    },
    {
      id: "acc-100-04",
      code: "100-04",
      name: "FOREIGN ASSETS",
      type: "Asset",
      parentId: "acc-100",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 1,
    },
    {
      id: "acc-100-05",
      code: "100-05",
      name: "PURCHASE DISCOUNT GIVEN",
      type: "Asset",
      parentId: "acc-100",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 1,
    },

    // ── L1 ACCOUNTS (under 200 CAPITAL AND RESERVES)
    {
      id: "acc-200-01",
      code: "200-01",
      name: "PARTNERS CAPITAL",
      type: "Equity",
      parentId: "acc-200",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 1,
    },

    // ── L1 ACCOUNTS (under 300 LIABILITIES)
    {
      id: "acc-300-01",
      code: "300-01",
      name: "LONG TERM LIABILITIES",
      type: "Liability",
      parentId: "acc-300",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 1,
    },
    {
      id: "acc-300-02",
      code: "300-02",
      name: "SHORT TERM LIABILITIES",
      type: "Liability",
      parentId: "acc-300",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 1,
    },

    // ── L1 ACCOUNTS (under 400 REVENUE)
    {
      id: "acc-400-01",
      code: "400-01",
      name: "OPERATIONAL REVENUE",
      type: "Income",
      parentId: "acc-400",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 1,
    },
    {
      id: "acc-400-02",
      code: "400-02",
      name: "OTHER INCOME",
      type: "Income",
      parentId: "acc-400",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 1,
    },

    // ── L1 ACCOUNTS (under 500 COST OF GOODS)
    {
      id: "acc-500-01",
      code: "500-01",
      name: "DIRECT COST",
      type: "COGS",
      parentId: "acc-500",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 1,
    },

    // ── L1 ACCOUNTS (under 600 ADMINISTRATIVE EXPENSES)
    {
      id: "acc-600-01",
      code: "600-01",
      name: "OPERATIONAL EXPENSES",
      type: "Expense",
      parentId: "acc-600",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 1,
    },

    // ── L1 ACCOUNTS (under 800 FINANCIAL CHARGES)
    {
      id: "acc-800-01",
      code: "800-01",
      name: "BANK CHARGES",
      type: "Expense",
      parentId: "acc-800",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 1,
    },
    {
      id: "acc-800-02",
      code: "800-02",
      name: "INTEREST EXPENSE",
      type: "Expense",
      parentId: "acc-800",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 1,
    },

    // ── L2 ACCOUNTS (under 100-01 NON-CURRENT ASSETS)
    {
      id: "acc-100-01-01",
      code: "100-01-01",
      name: "PROPERTY PLANT AND EQUIPMENT",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },
    {
      id: "acc-100-01-02",
      code: "100-01-02",
      name: "LAND",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-100-01-03",
      code: "100-01-03",
      name: "VEHICLE",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-100-01-04",
      code: "100-01-04",
      name: "LAND AND BUILDING",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-100-01-05",
      code: "100-01-05",
      name: "CONOPY",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },
    {
      id: "acc-100-01-06",
      code: "100-01-06",
      name: "CLOCK",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-100-01-07",
      code: "100-01-07",
      name: "YBR",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-100-01-08",
      code: "100-01-08",
      name: "INVESTMENT PROPERTY",
      type: "Asset",
      parentId: "acc-100-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 100-02 CURRENT ASSETS)
    {
      id: "acc-100-02-01",
      code: "100-02-01",
      name: "CASH AND EQUIVALENTS",
      type: "Asset",
      parentId: "acc-100-02",
      openingBalance: 50000,
      currentBalance: 50000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },
    {
      id: "acc-100-02-02",
      code: "100-02-02",
      name: "BANKS",
      type: "Asset",
      parentId: "acc-100-02",
      openingBalance: 200000,
      currentBalance: 200000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },
    {
      id: "acc-100-02-03",
      code: "100-02-03",
      name: "STOCK IN HAND",
      type: "Asset",
      parentId: "acc-100-02",
      openingBalance: 120000,
      currentBalance: 120000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 200-01 PARTNERS CAPITAL)
    {
      id: "acc-200-01-01",
      code: "200-01-01",
      name: "ACCUMULATED CAPITAL",
      type: "Equity",
      parentId: "acc-200-01",
      openingBalance: 300000,
      currentBalance: 300000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 300-01 LONG TERM LIABILITIES)
    {
      id: "acc-300-01-01",
      code: "300-01-01",
      name: "LONG TERM LOANS",
      type: "Liability",
      parentId: "acc-300-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 300-02 SHORT TERM LIABILITIES)
    {
      id: "acc-300-02-01",
      code: "300-02-01",
      name: "TRADE AND OTHER PAYABLES",
      type: "Liability",
      parentId: "acc-300-02",
      openingBalance: 0,
      currentBalance: 35000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 400-01 OPERATIONAL REVENUE)
    {
      id: "acc-400-01-01",
      code: "400-01-01",
      name: "SALES REVENUE",
      type: "Income",
      parentId: "acc-400-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: true,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 500-01 DIRECT COST)
    {
      id: "acc-500-01-01",
      code: "500-01-01",
      name: "COST OF GOODS SOLD",
      type: "COGS",
      parentId: "acc-500-01",
      openingBalance: 0,
      currentBalance: 450000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-500-01-02",
      code: "500-01-02",
      name: "FREIGHT AND IMPORT",
      type: "COGS",
      parentId: "acc-500-01",
      openingBalance: 0,
      currentBalance: 12000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },

    // ── L2 ACCOUNTS (under 600-01 OPERATIONAL EXPENSES)
    {
      id: "acc-600-01-01",
      code: "600-01-01",
      name: "SALARIES AND WAGES",
      type: "Expense",
      parentId: "acc-600-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },
    {
      id: "acc-600-01-02",
      code: "600-01-02",
      name: "UTILITIES",
      type: "Expense",
      parentId: "acc-600-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: true,
      level: 2,
    },
    {
      id: "acc-600-01-03",
      code: "600-01-03",
      name: "RENT",
      type: "Expense",
      parentId: "acc-600-01",
      openingBalance: 0,
      currentBalance: 15000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },
    {
      id: "acc-600-01-04",
      code: "600-01-04",
      name: "MARKETING",
      type: "Expense",
      parentId: "acc-600-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 2,
    },

    // ── L3 LEAF ACCOUNTS (under 100-01-01 PROPERTY PLANT AND EQUIPMENT)
    {
      id: "acc-100-01-01-0001",
      code: "100-01-01-0001",
      name: "OFFICE EQUIPMENT",
      type: "Asset",
      parentId: "acc-100-01-01",
      openingBalance: 45000,
      currentBalance: 45000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-100-01-01-0002",
      code: "100-01-01-0002",
      name: "COMPUTER HARDWARE",
      type: "Asset",
      parentId: "acc-100-01-01",
      openingBalance: 30000,
      currentBalance: 30000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 100-01-05 CONOPY)
    {
      id: "acc-100-01-05-0001",
      code: "100-01-05-0001",
      name: "WINDOWS",
      type: "Asset",
      parentId: "acc-100-01-05",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-100-01-05-0002",
      code: "100-01-05-0002",
      name: "WINDOW",
      type: "Asset",
      parentId: "acc-100-01-05",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 100-02-01 CASH AND EQUIVALENTS)
    {
      id: "acc-100-02-01-0001",
      code: "100-02-01-0001",
      name: "PETTY CASH",
      type: "Asset",
      parentId: "acc-100-02-01",
      openingBalance: 5000,
      currentBalance: 5000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-100-02-01-0002",
      code: "100-02-01-0002",
      name: "CASH IN HAND",
      type: "Asset",
      parentId: "acc-100-02-01",
      openingBalance: 10000,
      currentBalance: 10000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 100-02-02 BANKS)
    {
      id: "acc-100-02-02-0001",
      code: "100-02-02-0001",
      name: "MAIN ACCOUNT",
      type: "Asset",
      parentId: "acc-100-02-02",
      openingBalance: 200000,
      currentBalance: 200000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-100-02-02-0002",
      code: "100-02-02-0002",
      name: "SAVING ACCOUNT",
      type: "Asset",
      parentId: "acc-100-02-02",
      openingBalance: 50000,
      currentBalance: 50000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 200-01-01 ACCUMULATED CAPITAL)
    {
      id: "acc-200-01-01-0001",
      code: "200-01-01-0001",
      name: "PARTNER A CAPITAL",
      type: "Equity",
      parentId: "acc-200-01-01",
      openingBalance: 200000,
      currentBalance: 200000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-200-01-01-0002",
      code: "200-01-01-0002",
      name: "PARTNER B CAPITAL",
      type: "Equity",
      parentId: "acc-200-01-01",
      openingBalance: 100000,
      currentBalance: 100000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 300-02-01 TRADE AND OTHER PAYABLES)
    {
      id: "acc-300-02-01-0001",
      code: "300-02-01-0001",
      name: "ACCOUNTS PAYABLE",
      type: "Liability",
      parentId: "acc-300-02-01",
      openingBalance: 0,
      currentBalance: 35000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-300-02-01-0002",
      code: "300-02-01-0002",
      name: "SALARIES PAYABLE",
      type: "Liability",
      parentId: "acc-300-02-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 400-01-01 SALES REVENUE)
    {
      id: "acc-400-01-01-0001",
      code: "400-01-01-0001",
      name: "PRODUCT SALES",
      type: "Income",
      parentId: "acc-400-01-01",
      openingBalance: 0,
      currentBalance: 57000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-400-01-01-0002",
      code: "400-01-01-0002",
      name: "SERVICE REVENUE",
      type: "Income",
      parentId: "acc-400-01-01",
      openingBalance: 0,
      currentBalance: 8000,
      status: "Active",
      normalBalance: "Credit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 600-01-01 SALARIES AND WAGES)
    {
      id: "acc-600-01-01-0001",
      code: "600-01-01-0001",
      name: "STAFF SALARIES",
      type: "Expense",
      parentId: "acc-600-01-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-600-01-01-0002",
      code: "600-01-01-0002",
      name: "DAILY WAGES",
      type: "Expense",
      parentId: "acc-600-01-01",
      openingBalance: 0,
      currentBalance: 0,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },

    // ── L3 LEAF ACCOUNTS (under 600-01-02 UTILITIES)
    {
      id: "acc-600-01-02-0001",
      code: "600-01-02-0001",
      name: "ELECTRICITY",
      type: "Expense",
      parentId: "acc-600-01-02",
      openingBalance: 0,
      currentBalance: 8000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
    {
      id: "acc-600-01-02-0002",
      code: "600-01-02-0002",
      name: "INTERNET AND PHONE",
      type: "Expense",
      parentId: "acc-600-01-02",
      openingBalance: 0,
      currentBalance: 3000,
      status: "Active",
      normalBalance: "Debit",
      isGroup: false,
      level: 3,
    },
  ];
  const warehouses: Warehouse[] = [
    {
      id: "wh1",
      name: "Main Warehouse",
      location: "New York - Downtown",
      companyId: "comp1",
      status: "Active",
    },
    {
      id: "wh2",
      name: "North Warehouse",
      location: "New York - Uptown",
      companyId: "comp1",
      status: "Active",
    },
    {
      id: "wh3",
      name: "Central Hub",
      location: "Chicago - Central",
      companyId: "comp2",
      status: "Active",
    },
  ];

  const shops: Shop[] = [
    {
      id: "shop1",
      name: "Downtown Shop A",
      code: "DSA",
      address: "10 Main St",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      status: "Active",
      assignedUserIds: ["user-admin", "user-cashier"],
    },
    {
      id: "shop2",
      name: "Downtown Shop B",
      code: "DSB",
      address: "20 Main St",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      status: "Active",
      assignedUserIds: [],
    },
    {
      id: "shop3",
      name: "North Shop C",
      code: "NSC",
      address: "5 Uptown Blvd",
      warehouseId: "wh2",
      warehouseName: "North Warehouse",
      status: "Active",
      assignedUserIds: [],
    },
    {
      id: "shop4",
      name: "North Shop D",
      code: "NSD",
      address: "15 Uptown Blvd",
      warehouseId: "wh2",
      warehouseName: "North Warehouse",
      status: "Active",
      assignedUserIds: [],
    },
    {
      id: "shop5",
      name: "Hub Shop E",
      code: "HSE",
      address: "100 Commerce Ave",
      warehouseId: "wh3",
      warehouseName: "Central Hub",
      status: "Active",
      assignedUserIds: [],
    },
    {
      id: "shop6",
      name: "Hub Shop F",
      code: "HSF",
      address: "200 Commerce Ave",
      warehouseId: "wh3",
      warehouseName: "Central Hub",
      status: "Active",
      assignedUserIds: [],
    },
  ];

  const employees: Employee[] = [
    {
      id: "emp-001",
      employeeId: "EMP001",
      name: "Ali Hassan",
      department: "Sales",
      designation: "Sales Manager",
      employmentType: "Monthly-Salaried",
      joinDate: "2023-01-15",
      phone: "0300-1234567",
      email: "ali.hassan@bizpos.com",
      bankName: "HBL",
      accountNumber: "01234567890",
      basicSalary: 45000,
      hourlyRate: 0,
      dailyRate: 0,
      status: "Active",
      nic: "35201-1234567-1",
      gender: "Male",
      dateOfBirth: "1990-05-15",
      address: "House 12, Block A, DHA Phase 5, Lahore",
      emergencyContactName: "Fatima Hassan",
      emergencyContactPhone: "0300-9876543",
      maritalStatus: "Married",
      notes: "Senior employee, team lead for sales department",
    },
    {
      id: "emp-002",
      employeeId: "EMP002",
      name: "Sara Malik",
      department: "Accounts",
      designation: "Accountant",
      employmentType: "Monthly-Salaried",
      joinDate: "2023-03-01",
      phone: "0311-2345678",
      email: "sara.malik@bizpos.com",
      bankName: "MCB",
      accountNumber: "98765432100",
      basicSalary: 40000,
      hourlyRate: 0,
      dailyRate: 0,
      status: "Active",
      nic: "35202-9876543-2",
      gender: "Female",
      dateOfBirth: "1993-08-20",
      address: "Flat 5, Garden Town, Lahore",
      emergencyContactName: "Tariq Malik",
      emergencyContactPhone: "0311-1234567",
      maritalStatus: "Single",
      notes: "",
    },
    {
      id: "emp-003",
      employeeId: "EMP003",
      name: "Usman Khan",
      department: "IT",
      designation: "IT Officer",
      employmentType: "Monthly-Salaried",
      joinDate: "2023-06-10",
      phone: "0321-3456789",
      email: "usman.khan@bizpos.com",
      bankName: "UBL",
      accountNumber: "11223344550",
      basicSalary: 50000,
      hourlyRate: 0,
      dailyRate: 0,
      status: "Active",
      nic: "35203-5556667-3",
      gender: "Male",
      dateOfBirth: "1991-12-03",
      address: "Johar Town, Lahore",
      emergencyContactName: "Amina Khan",
      emergencyContactPhone: "0321-9999888",
      maritalStatus: "Married",
      notes: "",
    },
    {
      id: "emp-004",
      employeeId: "EMP004",
      name: "Fatima Noor",
      department: "HR",
      designation: "HR Executive",
      employmentType: "Monthly-Salaried",
      joinDate: "2023-08-20",
      phone: "0333-4567890",
      email: "fatima.noor@bizpos.com",
      bankName: "Meezan",
      accountNumber: "55667788990",
      basicSalary: 35000,
      hourlyRate: 0,
      dailyRate: 0,
      status: "Active",
      nic: "35204-1112223-4",
      gender: "Female",
      dateOfBirth: "1995-03-10",
      address: "Gulberg III, Lahore",
      emergencyContactName: "Noor Ahmed",
      emergencyContactPhone: "0333-5555444",
      maritalStatus: "Single",
      notes: "",
    },
    {
      id: "emp-005",
      employeeId: "EMP005",
      name: "Bilal Ahmed",
      department: "Sales",
      designation: "Sales Executive",
      employmentType: "Monthly-Salaried",
      joinDate: "2024-01-05",
      phone: "0344-5678901",
      email: "bilal.ahmed@bizpos.com",
      bankName: "Allied",
      accountNumber: "33445566770",
      basicSalary: 30000,
      hourlyRate: 0,
      dailyRate: 0,
      status: "Active",
      nic: "35205-3334445-5",
      gender: "Male",
      dateOfBirth: "1997-07-22",
      address: "Model Town, Lahore",
      emergencyContactName: "Rashida Ahmed",
      emergencyContactPhone: "0344-1112222",
      maritalStatus: "Single",
      notes: "",
    },
    {
      id: "emp-006",
      employeeId: "EMP006",
      name: "Zara Hussain",
      department: "Warehouse",
      designation: "Stock Supervisor",
      employmentType: "Hourly",
      joinDate: "2023-11-01",
      phone: "0355-6789012",
      email: "zara.h@bizpos.com",
      bankName: "HBL",
      accountNumber: "22334455660",
      basicSalary: 0,
      hourlyRate: 200,
      dailyRate: 0,
      status: "Active",
      nic: "35206-7778889-6",
      gender: "Female",
      dateOfBirth: "1992-11-30",
      address: "Shadman, Lahore",
      emergencyContactName: "Imran Hussain",
      emergencyContactPhone: "0355-8889990",
      maritalStatus: "Married",
      notes: "Shift: Morning 8am-4pm",
    },
    {
      id: "emp-007",
      employeeId: "EMP007",
      name: "Hamid Raza",
      department: "Warehouse",
      designation: "Loader",
      employmentType: "Daily-Wage",
      joinDate: "2024-02-01",
      phone: "0366-7890123",
      email: "",
      bankName: "",
      accountNumber: "",
      basicSalary: 0,
      hourlyRate: 0,
      dailyRate: 1200,
      status: "Active",
      nic: "35207-2223334-7",
      gender: "Male",
      dateOfBirth: "1988-04-15",
      address: "Bhatta Chowk, Lahore",
      emergencyContactName: "Rashida Raza",
      emergencyContactPhone: "0366-1110001",
      maritalStatus: "Married",
      notes: "",
    },
    {
      id: "emp-008",
      employeeId: "EMP008",
      name: "Iqbal Qureshi",
      department: "Operations",
      designation: "Driver",
      employmentType: "Daily-Wage",
      joinDate: "2023-09-15",
      phone: "0377-8901234",
      email: "",
      bankName: "JS Bank",
      accountNumber: "99887766550",
      basicSalary: 0,
      hourlyRate: 0,
      dailyRate: 1500,
      status: "Active",
      nic: "35208-4445556-8",
      gender: "Male",
      dateOfBirth: "1985-09-01",
      address: "Ravi Road, Lahore",
      emergencyContactName: "Zainab Qureshi",
      emergencyContactPhone: "0377-2223334",
      maritalStatus: "Married",
      notes: "",
    },
  ];

  const items: Item[] = [
    {
      id: "item-001",
      sku: "SKU-001",
      name: "Samsung Galaxy A54",
      category: "Electronics",
      costPrice: 45000,
      salePrice: 55000,
      quantity: 25,
      warehouseId: "wh1",
    },
    {
      id: "item-002",
      sku: "SKU-002",
      name: "iPhone 15 Case",
      category: "Accessories",
      costPrice: 800,
      salePrice: 1500,
      quantity: 150,
      warehouseId: "wh1",
    },
    {
      id: "item-003",
      sku: "SKU-003",
      name: "USB-C Charging Cable",
      category: "Accessories",
      costPrice: 250,
      salePrice: 600,
      quantity: 8,
      warehouseId: "wh1",
    },
    {
      id: "item-004",
      sku: "SKU-004",
      name: "Wireless Earbuds Pro",
      category: "Electronics",
      costPrice: 3500,
      salePrice: 6500,
      quantity: 45,
      warehouseId: "wh1",
    },
    {
      id: "item-005",
      sku: "SKU-005",
      name: "Screen Protector",
      category: "Accessories",
      costPrice: 150,
      salePrice: 400,
      quantity: 200,
      warehouseId: "wh2",
    },
    {
      id: "item-006",
      sku: "SKU-006",
      name: "Power Bank 20000mAh",
      category: "Electronics",
      costPrice: 2500,
      salePrice: 4500,
      quantity: 30,
      warehouseId: "wh2",
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: "sup-001",
      name: "Tech Distributors Ltd",
      phone: "0321-1234567",
      email: "info@techdist.com",
      address: "Hall Road, Lahore",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "sup-002",
      name: "Galaxy Electronics",
      phone: "0333-9876543",
      email: "sales@galaxyelec.com",
      address: "Saddar, Karachi",
      createdAt: "2024-01-10T00:00:00Z",
    },
  ];

  const customers: Customer[] = [
    {
      id: "cust-001",
      name: "Ahmed Ali",
      phone: "0300-1111111",
      email: "ahmed@email.com",
      address: "DHA Phase 5, Lahore",
      groupId: "cg1",
      groupName: "Retail",
      createdAt: "2024-01-05T00:00:00Z",
    },
    {
      id: "cust-002",
      name: "Sara Khan",
      phone: "0311-2222222",
      email: "sara@email.com",
      address: "Gulshan, Karachi",
      groupId: "cg1",
      groupName: "Retail",
      createdAt: "2024-01-12T00:00:00Z",
    },
    {
      id: "cust-003",
      name: "Walk-in Customer",
      phone: "-",
      email: "",
      address: "-",
      groupId: "cg3",
      groupName: "VIP",
      createdAt: "2024-01-01T00:00:00Z",
    },
  ];

  const paymentModes: PaymentMode[] = [
    { id: "pm-001", name: "Cash", description: "Cash payment" },
    { id: "pm-002", name: "Bank Transfer", description: "Bank wire transfer" },
    { id: "pm-003", name: "JazzCash", description: "JazzCash mobile payment" },
  ];

  const sales: Sale[] = [
    {
      id: "SALE-001",
      customerId: "cust-001",
      customerName: "Ahmed Ali",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      shopId: "shop1",
      shopName: "Downtown Shop A",
      saleType: "Cash",
      items: [
        {
          itemId: "item-001",
          itemName: "Samsung Galaxy A54",
          quantity: 1,
          price: 55000,
          subtotal: 55000,
        },
        {
          itemId: "item-002",
          itemName: "iPhone 15 Case",
          quantity: 2,
          price: 1500,
          subtotal: 3000,
        },
      ],
      subtotal: 58000,
      discount: 1000,
      total: 57000,
      taxAmount: 0,
      promoSavings: 0,
      paymentMethod: "Cash",
      paidAmount: 57000,
      balanceDue: 0,
      status: "Completed",
      saleDate: "2024-03-15",
      createdAt: "2024-03-15T10:00:00Z",
    },
    {
      id: "SALE-002",
      customerId: "cust-002",
      customerName: "Sara Khan",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      shopId: "shop-001",
      saleType: "Credit",
      items: [
        {
          itemId: "item-004",
          itemName: "Wireless Earbuds Pro",
          quantity: 2,
          price: 6500,
          subtotal: 13000,
        },
      ],
      subtotal: 13000,
      discount: 0,
      total: 13000,
      taxAmount: 0,
      promoSavings: 0,
      paymentMethod: "JazzCash",
      shopName: "Downtown Shop A",
      paidAmount: 5000,
      balanceDue: 8000,
      status: "Pending",
      saleDate: "2024-03-18",
      createdAt: "2024-03-18T14:00:00Z",
    },
  ];

  const purchases: Purchase[] = [
    {
      id: "PUR-001",
      supplierId: "sup-001",
      supplierName: "Tech Distributors Ltd",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      purchaseDate: "2024-03-01",
      items: [
        {
          itemId: "item-001",
          itemName: "Samsung Galaxy A54",
          quantity: 10,
          costPrice: 45000,
          subtotal: 450000,
        },
      ],
      total: 450000,
      notes: "Regular stock replenishment",
      status: "Received",
      createdAt: "2024-03-01T10:00:00Z",
    },
    {
      id: "PUR-002",
      supplierId: "sup-002",
      supplierName: "Galaxy Electronics",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      purchaseDate: "2024-03-10",
      items: [
        {
          itemId: "item-004",
          itemName: "Wireless Earbuds Pro",
          quantity: 20,
          costPrice: 3500,
          subtotal: 70000,
        },
        {
          itemId: "item-002",
          itemName: "iPhone 15 Case",
          quantity: 50,
          costPrice: 800,
          subtotal: 40000,
        },
      ],
      total: 110000,
      status: "Received",
      createdAt: "2024-03-10T11:00:00Z",
    },
  ];

  const payments: Payment[] = [
    {
      id: "PAY-001",
      saleId: "SALE-001",
      customerName: "Ahmed Ali",
      warehouseName: "Main Warehouse",
      paymentModeId: "pm-001",
      paymentModeName: "Cash",
      amount: 57000,
      date: "2024-03-15",
      reference: "RCPT-001",
    },
    {
      id: "PAY-002",
      saleId: "SALE-002",
      customerName: "Sara Khan",
      warehouseName: "Main Warehouse",
      paymentModeId: "pm-003",
      paymentModeName: "JazzCash",
      amount: 5000,
      date: "2024-03-18",
      reference: "JC-2024-001",
    },
  ];

  const journalEntries: JournalEntry[] = [
    {
      id: "JE-001",
      date: "2024-03-01",
      reference: "JE-2024-001",
      description: "Opening balances entry",
      lines: [
        {
          accountId: "acc-1111",
          accountName: "Petty Cash",
          debit: 5000,
          credit: 0,
        },
        {
          accountId: "acc-1112",
          accountName: "Main Bank Account",
          debit: 200000,
          credit: 0,
        },
        {
          accountId: "acc-3110",
          accountName: "Paid-in Capital",
          debit: 0,
          credit: 205000,
        },
      ],
      createdAt: "2024-03-01T00:00:00Z",
    },
    {
      id: "JE-002",
      date: "2024-03-15",
      reference: "JE-2024-002",
      description: "Sales transaction SALE-001",
      lines: [
        {
          accountId: "acc-1111",
          accountName: "Petty Cash",
          debit: 57000,
          credit: 0,
        },
        {
          accountId: "acc-4111",
          accountName: "Electronics Sales",
          debit: 0,
          credit: 57000,
        },
      ],
      createdAt: "2024-03-15T10:00:00Z",
    },
    {
      id: "JE-003",
      date: "2024-03-01",
      reference: "JE-2024-003",
      description: "Rent payment March 2024",
      lines: [
        { accountId: "acc-6120", accountName: "Rent", debit: 15000, credit: 0 },
        {
          accountId: "acc-1111",
          accountName: "Petty Cash",
          debit: 0,
          credit: 15000,
        },
      ],
      createdAt: "2024-03-01T12:00:00Z",
    },
  ];

  const expenses: Expense[] = [
    {
      id: "exp-001",
      accountId: "acc-6120",
      accountName: "Rent",
      amount: 15000,
      description: "March 2024 rent",
      date: "2024-03-01",
      createdAt: "2024-03-01T00:00:00Z",
    },
    {
      id: "exp-002",
      accountId: "acc-6111",
      accountName: "Electricity",
      amount: 8000,
      description: "March electricity bill",
      date: "2024-03-05",
      createdAt: "2024-03-05T00:00:00Z",
    },
  ];

  const settings: Settings = {
    companyName: "BizPOS",
    currency: "PKR",
    invoiceFooter: "Thank you for your business!",
  };

  const leaveTypes: LeaveType[] = [
    {
      id: "lt-001",
      name: "Annual Leave",
      daysAllowedPerYear: 21,
      description: "Yearly paid leave entitlement",
      isActive: true,
    },
    {
      id: "lt-002",
      name: "Sick Leave",
      daysAllowedPerYear: 10,
      description: "Medical / health related leave",
      isActive: true,
    },
    {
      id: "lt-003",
      name: "Casual Leave",
      daysAllowedPerYear: 7,
      description: "Short notice personal leave",
      isActive: true,
    },
    {
      id: "lt-004",
      name: "Maternity Leave",
      daysAllowedPerYear: 90,
      description: "Maternity leave for female employees",
      isActive: true,
    },
    {
      id: "lt-005",
      name: "Paternity Leave",
      daysAllowedPerYear: 14,
      description: "Paternity leave for male employees",
      isActive: true,
    },
    {
      id: "lt-006",
      name: "Unpaid Leave",
      daysAllowedPerYear: 0,
      description: "Leave without pay",
      isActive: true,
    },
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      id: "lr-001",
      employeeId: "emp-001",
      employeeName: "Ali Hassan",
      leaveTypeId: "lt-001",
      leaveTypeName: "Annual Leave",
      fromDate: "2024-12-23",
      toDate: "2024-12-31",
      days: 7,
      reason: "Family vacation during holidays",
      status: "Approved",
      remarks: "Approved by HR",
      createdAt: "2024-12-10T09:00:00Z",
    },
    {
      id: "lr-002",
      employeeId: "emp-002",
      employeeName: "Sara Malik",
      leaveTypeId: "lt-002",
      leaveTypeName: "Sick Leave",
      fromDate: "2025-01-08",
      toDate: "2025-01-09",
      days: 2,
      reason: "Flu and fever",
      status: "Approved",
      remarks: "Medical certificate received",
      createdAt: "2025-01-07T11:00:00Z",
    },
    {
      id: "lr-003",
      employeeId: "emp-003",
      employeeName: "Usman Khan",
      leaveTypeId: "lt-003",
      leaveTypeName: "Casual Leave",
      fromDate: "2025-02-14",
      toDate: "2025-02-14",
      days: 1,
      reason: "Personal work",
      status: "Approved",
      remarks: "",
      createdAt: "2025-02-12T10:00:00Z",
    },
    {
      id: "lr-004",
      employeeId: "emp-004",
      employeeName: "Fatima Noor",
      leaveTypeId: "lt-001",
      leaveTypeName: "Annual Leave",
      fromDate: "2025-03-03",
      toDate: "2025-03-07",
      days: 5,
      reason: "Eid holiday extension",
      status: "Approved",
      remarks: "Approved",
      createdAt: "2025-02-25T08:00:00Z",
    },
    {
      id: "lr-005",
      employeeId: "emp-005",
      employeeName: "Bilal Ahmed",
      leaveTypeId: "lt-002",
      leaveTypeName: "Sick Leave",
      fromDate: "2025-03-20",
      toDate: "2025-03-21",
      days: 2,
      reason: "Stomach infection",
      status: "Pending",
      remarks: "",
      createdAt: "2025-03-19T07:30:00Z",
    },
    {
      id: "lr-006",
      employeeId: "emp-006",
      employeeName: "Zara Hussain",
      leaveTypeId: "lt-003",
      leaveTypeName: "Casual Leave",
      fromDate: "2025-04-01",
      toDate: "2025-04-01",
      days: 1,
      reason: "Child school event",
      status: "Pending",
      remarks: "",
      createdAt: "2025-03-28T09:00:00Z",
    },
    {
      id: "lr-007",
      employeeId: "emp-001",
      employeeName: "Ali Hassan",
      leaveTypeId: "lt-002",
      leaveTypeName: "Sick Leave",
      fromDate: "2025-04-10",
      toDate: "2025-04-11",
      days: 2,
      reason: "Back pain",
      status: "Pending",
      remarks: "",
      createdAt: "2025-04-09T08:00:00Z",
    },
    {
      id: "lr-008",
      employeeId: "emp-007",
      employeeName: "Hamid Raza",
      leaveTypeId: "lt-006",
      leaveTypeName: "Unpaid Leave",
      fromDate: "2025-03-15",
      toDate: "2025-03-15",
      days: 1,
      reason: "Personal emergency",
      status: "Rejected",
      remarks: "Insufficient staffing that day",
      createdAt: "2025-03-14T07:00:00Z",
    },
    {
      id: "lr-009",
      employeeId: "emp-002",
      employeeName: "Sara Malik",
      leaveTypeId: "lt-001",
      leaveTypeName: "Annual Leave",
      fromDate: "2025-05-01",
      toDate: "2025-05-03",
      days: 3,
      reason: "Visiting family",
      status: "Pending",
      remarks: "",
      createdAt: "2025-04-20T10:00:00Z",
    },
    {
      id: "lr-010",
      employeeId: "emp-008",
      employeeName: "Iqbal Qureshi",
      leaveTypeId: "lt-006",
      leaveTypeName: "Unpaid Leave",
      fromDate: "2025-02-20",
      toDate: "2025-02-22",
      days: 3,
      reason: "Village trip",
      status: "Approved",
      remarks: "Approved — unpaid",
      createdAt: "2025-02-18T09:00:00Z",
    },
  ];

  const now = new Date();
  const mkTs = (daysAgo: number, hour = 9) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    return d.toISOString();
  };

  const logs: Log[] = [
    {
      id: "log-001",
      timestamp: mkTs(0, 8),
      user: "System Admin",
      module: "Auth",
      action: "login",
      details: "Admin logged in",
    },
    {
      id: "log-002",
      timestamp: mkTs(0, 9),
      user: "System Admin",
      module: "Sales",
      action: "create",
      details: "Created sale SALE-003",
    },
    {
      id: "log-003",
      timestamp: mkTs(0, 10),
      user: "System Admin",
      module: "Inventory",
      action: "update",
      details: "Updated stock for SKU-001",
    },
    {
      id: "log-004",
      timestamp: mkTs(0, 11),
      user: "John Cashier",
      module: "Auth",
      action: "login",
      details: "Cashier logged in",
    },
    {
      id: "log-005",
      timestamp: mkTs(0, 12),
      user: "John Cashier",
      module: "POS",
      action: "create",
      details: "POS sale completed — Walk-in Customer",
    },
    {
      id: "log-006",
      timestamp: mkTs(1, 9),
      user: "System Admin",
      module: "Employees",
      action: "create",
      details: "Added employee EMP009",
    },
    {
      id: "log-007",
      timestamp: mkTs(1, 10),
      user: "System Admin",
      module: "Payroll",
      action: "create",
      details: "Processed payroll for April 2025",
    },
    {
      id: "log-008",
      timestamp: mkTs(1, 11),
      user: "System Admin",
      module: "Purchases",
      action: "create",
      details: "Created purchase PUR-003",
    },
    {
      id: "log-009",
      timestamp: mkTs(1, 14),
      user: "System Admin",
      module: "Leave",
      action: "update",
      details: "Approved leave request lr-004",
    },
    {
      id: "log-010",
      timestamp: mkTs(1, 16),
      user: "System Admin",
      module: "Auth",
      action: "logout",
      details: "Admin logged out",
    },
    {
      id: "log-011",
      timestamp: mkTs(2, 8),
      user: "System Admin",
      module: "Auth",
      action: "login",
      details: "Admin logged in",
    },
    {
      id: "log-012",
      timestamp: mkTs(2, 9),
      user: "System Admin",
      module: "Accounts",
      action: "create",
      details: "Added journal entry JE-004",
    },
    {
      id: "log-013",
      timestamp: mkTs(2, 10),
      user: "System Admin",
      module: "COA",
      action: "update",
      details: "Updated account acc-6120 balance",
    },
    {
      id: "log-014",
      timestamp: mkTs(2, 11),
      user: "System Admin",
      module: "Sales",
      action: "delete",
      details: "Deleted sale SALE-000 (test entry)",
    },
    {
      id: "log-015",
      timestamp: mkTs(2, 13),
      user: "System Admin",
      module: "Warehouses",
      action: "update",
      details: "Updated warehouse wh-001 location",
    },
    {
      id: "log-016",
      timestamp: mkTs(3, 9),
      user: "System Admin",
      module: "Inventory",
      action: "create",
      details: "Added item SKU-007",
    },
    {
      id: "log-017",
      timestamp: mkTs(3, 10),
      user: "John Cashier",
      module: "Auth",
      action: "login",
      details: "Cashier logged in",
    },
    {
      id: "log-018",
      timestamp: mkTs(3, 11),
      user: "John Cashier",
      module: "POS",
      action: "create",
      details: "POS sale — Ahmed Ali",
    },
    {
      id: "log-019",
      timestamp: mkTs(3, 13),
      user: "John Cashier",
      module: "POS",
      action: "create",
      details: "POS sale — Walk-in Customer",
    },
    {
      id: "log-020",
      timestamp: mkTs(3, 16),
      user: "John Cashier",
      module: "Auth",
      action: "logout",
      details: "Cashier logged out",
    },
    {
      id: "log-021",
      timestamp: mkTs(4, 9),
      user: "System Admin",
      module: "Roles",
      action: "update",
      details: "Updated Manager role permissions",
    },
    {
      id: "log-022",
      timestamp: mkTs(4, 10),
      user: "System Admin",
      module: "Users",
      action: "create",
      details: "Added user user-manager",
    },
    {
      id: "log-023",
      timestamp: mkTs(5, 9),
      user: "System Admin",
      module: "Employees",
      action: "update",
      details: "Updated employee EMP003 salary",
    },
    {
      id: "log-024",
      timestamp: mkTs(5, 11),
      user: "System Admin",
      module: "Leave",
      action: "create",
      details: "Added leave request lr-009",
    },
    {
      id: "log-025",
      timestamp: mkTs(5, 14),
      user: "System Admin",
      module: "Payments",
      action: "create",
      details: "Received payment PAY-003",
    },
    {
      id: "log-026",
      timestamp: mkTs(6, 10),
      user: "System Admin",
      module: "Expenses",
      action: "create",
      details: "Added expense — Electricity bill",
    },
    {
      id: "log-027",
      timestamp: mkTs(6, 12),
      user: "System Admin",
      module: "Shops",
      action: "update",
      details: "Updated shop SH-002 status",
    },
    {
      id: "log-028",
      timestamp: mkTs(7, 9),
      user: "System Admin",
      module: "Reports",
      action: "view",
      details: "Viewed Profit & Loss report",
    },
    {
      id: "log-029",
      timestamp: mkTs(7, 11),
      user: "System Admin",
      module: "Suppliers",
      action: "create",
      details: "Added supplier sup-003",
    },
    {
      id: "log-030",
      timestamp: mkTs(7, 14),
      user: "System Admin",
      module: "Auth",
      action: "logout",
      details: "Admin logged out",
    },
  ];

  const seedBankTransactions: BankTransaction[] = [
    {
      id: "bt-1",
      date: "2025-03-01",
      description: "Opening balance deposit",
      amount: 500000,
      type: "Credit",
      reference: "CHQ-001",
      reconciled: true,
    },
    {
      id: "bt-2",
      date: "2025-03-05",
      description: "Supplier payment - TechSupply Co",
      amount: 75000,
      type: "Debit",
      reference: "TRF-1001",
      reconciled: false,
    },
    {
      id: "bt-3",
      date: "2025-03-10",
      description: "Sales receipt from customer",
      amount: 120000,
      type: "Credit",
      reference: "DEP-2001",
      reconciled: false,
    },
  ];

  const seedPurchaseOrders: PurchaseOrder[] = [
    {
      id: "po-1",
      poNumber: "PO-2025-001",
      supplierId: "sup-001",
      supplierName: "Tech Distributors Ltd",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      date: "2025-03-01",
      expectedDelivery: "2025-03-10",
      items: [
        {
          productId: "p1",
          productName: "Laptop Core i7",
          qty: 10,
          unitCost: 85000,
        },
        {
          productId: "p2",
          productName: "Wireless Mouse",
          qty: 20,
          unitCost: 1500,
        },
      ],
      status: "Received",
      notes: "Urgent order for new branch",
      totalAmount: 880000,
      createdAt: new Date("2025-03-01").toISOString(),
    },
    {
      id: "po-2",
      poNumber: "PO-2025-002",
      supplierId: "sup-002",
      supplierName: "Galaxy Electronics",
      warehouseId: "wh1",
      warehouseName: "Main Warehouse",
      date: "2025-03-05",
      expectedDelivery: "2025-03-20",
      items: [
        {
          productId: "p3",
          productName: "Office Chair",
          qty: 15,
          unitCost: 12000,
        },
        {
          productId: "p4",
          productName: "Office Desk",
          qty: 5,
          unitCost: 25000,
        },
      ],
      status: "Sent",
      notes: "Office furniture for new floor",
      totalAmount: 305000,
      createdAt: new Date("2025-03-05").toISOString(),
    },
    {
      id: "po-3",
      poNumber: "PO-2025-003",
      supplierId: "sup-001",
      supplierName: "TechSupply Co.",
      warehouseId: "wh2",
      warehouseName: "Secondary Warehouse",
      date: "2025-03-12",
      expectedDelivery: "2025-03-25",
      items: [
        {
          productId: "p5",
          productName: "USB Hub 7-Port",
          qty: 50,
          unitCost: 2500,
        },
      ],
      status: "Draft",
      notes: "",
      totalAmount: 125000,
      createdAt: new Date("2025-03-12").toISOString(),
    },
  ];

  const companies: Company[] = [
    {
      id: "comp1",
      name: "Alpha Retail Group",
      code: "ARG",
      address: "123 Main St, New York",
      phone: "+1-555-0100",
      email: "info@alpharetail.com",
      status: "Active",
    },
    {
      id: "comp2",
      name: "Beta Distribution Co",
      code: "BDC",
      address: "456 Commerce Ave, Chicago",
      phone: "+1-555-0200",
      email: "info@betadist.com",
      status: "Active",
    },
  ];

  return {
    roles,
    users,
    accounts,
    companies,
    warehouses,
    shops,
    employees,
    items,
    suppliers,
    customers,
    paymentModes,
    sales,
    purchases,
    payments,
    journalEntries,
    expenses,
    settings,
    leaveTypes,
    leaveRequests,
    logs,
    bankTransactions: seedBankTransactions,
    purchaseOrders: seedPurchaseOrders,
  };
}

// ---- LocalStorage Keys ----
const KEYS = {
  roles: "bizpos_roles",
  companies: "bizpos_companies",
  users: "bizpos_users",
  accounts: "bizpos_accounts_v3",
  warehouses: "bizpos_warehouses",
  shops: "bizpos_shops",
  employees: "bizpos_employees",
  payrolls: "bizpos_payrolls",
  items: "bizpos_items",
  suppliers: "bizpos_suppliers",
  customers: "bizpos_customers",
  paymentModes: "bizpos_payment_modes",
  sales: "bizpos_sales",
  purchases: "bizpos_purchases",
  payments: "bizpos_payments",
  journalEntries: "bizpos_journal_entries",
  expenses: "bizpos_expenses",
  settings: "bizpos_settings",
  leaveTypes: "bizpos_leave_types",
  leaveRequests: "bizpos_leave_requests",
  logs: "bizpos_logs",
  bankTransactions: "bizpos_bank_transactions",
  purchaseOrders: "bizpos_purchase_orders",
  taxes: "bizpos_taxes",
  discounts: "bizpos_discounts",
  promotions: "bizpos_promotions",
  purchaseRequisitions: "bizpos_purchase_requisitions",
  goodsReceiptNotes: "bizpos_grn",
  inventoryTransfers: "bizpos_inventory_transfers",
  shipments: "bizpos_shipments",
  departments: "bizpos_departments",
  designations: "bizpos_designations",
  allowanceTypes: "bizpos_allowance_types",
  shifts: "bizpos_shifts",
  shiftAssignments: "bizpos_shift_assignments",
  shiftClosings: "bizpos_shift_closings",
  salarySlips: "bizpos_salary_slips",
  itemCategories: "bizpos_item_categories",
  itemBrands: "bizpos_item_brands",
  itemUnits: "bizpos_item_units",
  stockMovements: "bizpos_stock_movements",
  seeded: "bizpos_seeded_v13",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("bizpos-store-updated"));
}

function initStore() {
  if (!localStorage.getItem(KEYS.seeded)) {
    const seed = createSeedData();
    save(KEYS.roles, seed.roles);
    save(KEYS.users, seed.users);
    save(KEYS.accounts, seed.accounts);
    save(KEYS.companies, seed.companies);
    save(KEYS.warehouses, seed.warehouses);
    save(KEYS.shops, seed.shops);
    save(KEYS.employees, seed.employees);
    save(KEYS.payrolls, []);
    save(KEYS.items, seed.items);
    save(KEYS.suppliers, seed.suppliers);
    save(KEYS.customers, seed.customers);
    save(KEYS.paymentModes, seed.paymentModes);
    save(KEYS.sales, seed.sales);
    save(KEYS.purchases, seed.purchases);
    save(KEYS.payments, seed.payments);
    save(KEYS.journalEntries, seed.journalEntries);
    save(KEYS.expenses, seed.expenses);
    save(KEYS.settings, seed.settings);
    save(KEYS.leaveTypes, seed.leaveTypes);
    save(KEYS.leaveRequests, seed.leaveRequests);
    save(KEYS.logs, seed.logs);
    save(KEYS.bankTransactions, seed.bankTransactions);
    save(KEYS.purchaseOrders, seed.purchaseOrders);

    // Taxes / Discounts / Promotions seed
    if (!localStorage.getItem(KEYS.taxes)) {
      const today = new Date().toISOString().slice(0, 10);
      const seedTaxes: TaxRate[] = [
        {
          id: generateId(),
          name: "GST",
          rate: 17,
          applicableTo: "all",
          categories: [],
          productIds: [],
          status: "Active",
        },
        {
          id: generateId(),
          name: "Sales Tax",
          rate: 8,
          applicableTo: "all",
          categories: [],
          productIds: [],
          status: "Active",
        },
        {
          id: generateId(),
          name: "Service Tax",
          rate: 5,
          applicableTo: "category",
          categories: ["Services"],
          productIds: [],
          status: "Active",
        },
      ];
      const seedDiscounts: Discount[] = [
        {
          id: generateId(),
          name: "Bulk Discount",
          percentage: 10,
          applicableTo: "all",
          categories: [],
          productIds: [],
          status: "Active",
        },
        {
          id: generateId(),
          name: "Member Discount",
          percentage: 5,
          applicableTo: "all",
          categories: [],
          productIds: [],
          status: "Active",
        },
      ];
      const seedPromotions: Promotion[] = [
        {
          id: generateId(),
          name: "Summer Sale",
          discountPercentage: 15,
          startDate: "2026-06-01",
          endDate: "2026-08-31",
          applicableTo: "all",
          categories: [],
          productIds: [],
          status: "Active",
        },
        {
          id: generateId(),
          name: "Eid Special",
          discountPercentage: 20,
          startDate: "2026-03-25",
          endDate: "2026-04-05",
          applicableTo: "all",
          categories: [],
          productIds: [],
          status: "Active",
        },
      ];
      void today;
      save(KEYS.taxes, seedTaxes);
      save(KEYS.discounts, seedDiscounts);
      save(KEYS.promotions, seedPromotions);
    }

    // Supply Chain seed
    if (!localStorage.getItem(KEYS.purchaseRequisitions)) {
      const reqs: PurchaseRequisition[] = [
        {
          id: generateId(),
          requisitionNo: "REQ-2026-001",
          date: "2026-03-01",
          requestedBy: "Ahmed Khan",
          department: "Operations",
          items: [
            {
              productId: "",
              productName: "Office Chairs",
              qty: 10,
              estimatedCost: 5000,
            },
          ],
          priority: "High",
          status: "Draft",
          notes: "Needed for new office wing.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          requisitionNo: "REQ-2026-002",
          date: "2026-03-05",
          requestedBy: "Sara Ali",
          department: "Warehouse",
          items: [
            {
              productId: "",
              productName: "Packing Tape",
              qty: 500,
              estimatedCost: 25,
            },
            {
              productId: "",
              productName: "Bubble Wrap Rolls",
              qty: 200,
              estimatedCost: 120,
            },
          ],
          priority: "Medium",
          status: "Submitted",
          notes: "Monthly packing supplies.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          requisitionNo: "REQ-2026-003",
          date: "2026-03-10",
          requestedBy: "Bilal Saeed",
          department: "IT",
          items: [
            {
              productId: "",
              productName: "Laptop Dell XPS",
              qty: 3,
              estimatedCost: 150000,
            },
          ],
          priority: "Urgent",
          status: "Approved",
          notes: "Replacement laptops for dev team.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          requisitionNo: "REQ-2026-004",
          date: "2026-03-15",
          requestedBy: "Fatima Malik",
          department: "Purchases",
          items: [
            {
              productId: "",
              productName: "Printer Paper A4",
              qty: 100,
              estimatedCost: 800,
            },
          ],
          priority: "Low",
          status: "PO Issued",
          notes: "Quarterly paper stock.",
          linkedPOId: "",
          createdAt: new Date().toISOString(),
        },
      ];
      save(KEYS.purchaseRequisitions, reqs);
    }
    if (!localStorage.getItem(KEYS.goodsReceiptNotes)) {
      const grns: GoodsReceiptNote[] = [
        {
          id: generateId(),
          grnNo: "GRN-2026-001",
          poId: "",
          poNumber: "PO-2026-001",
          supplierId: "",
          supplierName: "Tech Supplies Co.",
          warehouseId: "",
          warehouseName: "Main Warehouse",
          receivedDate: "2026-03-12",
          items: [
            {
              productId: "",
              productName: "Laptop Dell XPS",
              orderedQty: 5,
              receivedQty: 5,
              acceptedQty: 5,
              rejectedQty: 0,
              unitCost: 150000,
            },
          ],
          status: "Accepted",
          qualityNotes: "All units in perfect condition.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          grnNo: "GRN-2026-002",
          poId: "",
          poNumber: "PO-2026-002",
          supplierId: "",
          supplierName: "Office Mart",
          warehouseId: "",
          warehouseName: "North Branch",
          receivedDate: "2026-03-18",
          items: [
            {
              productId: "",
              productName: "Office Chairs",
              orderedQty: 20,
              receivedQty: 18,
              acceptedQty: 16,
              rejectedQty: 2,
              unitCost: 5000,
            },
          ],
          status: "Partially Accepted",
          qualityNotes: "2 chairs had broken armrests.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          grnNo: "GRN-2026-003",
          poId: "",
          poNumber: "PO-2026-003",
          supplierId: "",
          supplierName: "Packaging World",
          warehouseId: "",
          warehouseName: "Main Warehouse",
          receivedDate: "2026-03-22",
          items: [
            {
              productId: "",
              productName: "Packing Tape",
              orderedQty: 500,
              receivedQty: 500,
              acceptedQty: 500,
              rejectedQty: 0,
              unitCost: 25,
            },
            {
              productId: "",
              productName: "Bubble Wrap Rolls",
              orderedQty: 200,
              receivedQty: 200,
              acceptedQty: 198,
              rejectedQty: 2,
              unitCost: 120,
            },
          ],
          status: "Quality Checked",
          qualityNotes: "Minor defects in 2 bubble wrap rolls.",
          createdAt: new Date().toISOString(),
        },
      ];
      save(KEYS.goodsReceiptNotes, grns);
    }
    if (!localStorage.getItem(KEYS.inventoryTransfers)) {
      const transfers: InventoryTransfer[] = [
        {
          id: generateId(),
          transferNo: "TRF-2026-001",
          fromWarehouseId: "",
          fromWarehouseName: "Main Warehouse",
          toWarehouseId: "",
          toWarehouseName: "North Branch",
          transferDate: "2026-03-08",
          items: [
            { productId: "", productName: "Laptop Dell XPS", qty: 2 },
            { productId: "", productName: "Mouse Wireless", qty: 10 },
          ],
          status: "Completed",
          notes: "Stock redistribution.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          transferNo: "TRF-2026-002",
          fromWarehouseId: "",
          fromWarehouseName: "North Branch",
          toWarehouseId: "",
          toWarehouseName: "South Depot",
          transferDate: "2026-03-20",
          items: [{ productId: "", productName: "Office Chairs", qty: 5 }],
          status: "In Transit",
          notes: "Urgent restock for new office.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          transferNo: "TRF-2026-003",
          fromWarehouseId: "",
          fromWarehouseName: "Main Warehouse",
          toWarehouseId: "",
          toWarehouseName: "South Depot",
          transferDate: "2026-03-25",
          items: [{ productId: "", productName: "Printer Paper A4", qty: 50 }],
          status: "Draft",
          notes: "Scheduled transfer.",
          createdAt: new Date().toISOString(),
        },
      ];
      save(KEYS.inventoryTransfers, transfers);
    }
    if (!localStorage.getItem(KEYS.shipments)) {
      const shipments: Shipment[] = [
        {
          id: generateId(),
          shipmentNo: "SHP-2026-001",
          type: "Inbound",
          carrier: "TCS Couriers",
          trackingNumber: "TCS-8821-XYZ",
          origin: "Karachi",
          destination: "Lahore",
          expectedDate: "2026-03-15",
          actualDate: "2026-03-15",
          status: "Delivered",
          linkedRefNo: "PO-2026-001",
          items: [{ productName: "Laptop Dell XPS", qty: 5 }],
          notes: "Delivered on time.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          shipmentNo: "SHP-2026-002",
          type: "Inbound",
          carrier: "Leopard Couriers",
          trackingNumber: "LEO-4432-ABC",
          origin: "Islamabad",
          destination: "Lahore",
          expectedDate: "2026-03-20",
          actualDate: "",
          status: "In Transit",
          linkedRefNo: "PO-2026-002",
          items: [{ productName: "Office Chairs", qty: 20 }],
          notes: "",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          shipmentNo: "SHP-2026-003",
          type: "Outbound",
          carrier: "M&P Express",
          trackingNumber: "MNP-7765-DEF",
          origin: "Lahore",
          destination: "Faisalabad",
          expectedDate: "2026-03-25",
          actualDate: "",
          status: "Delayed",
          linkedRefNo: "TRF-2026-002",
          items: [{ productName: "Office Chairs", qty: 5 }],
          notes: "Delayed due to road construction.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          shipmentNo: "SHP-2026-004",
          type: "Outbound",
          carrier: "DHL Express",
          trackingNumber: "DHL-9910-GHI",
          origin: "Lahore",
          destination: "Multan",
          expectedDate: "2026-04-01",
          actualDate: "",
          status: "Pending",
          linkedRefNo: "REQ-2026-001",
          items: [{ productName: "Printer Paper A4", qty: 50 }],
          notes: "Scheduled for next week.",
          createdAt: new Date().toISOString(),
        },
      ];
      save(KEYS.shipments, shipments);
    }

    save(KEYS.stockMovements, []);
    localStorage.setItem(KEYS.seeded, "true");
    // Seed departments
    const departments: Department[] = [
      {
        id: "dept-001",
        code: "DEPT-SALES",
        name: "Sales",
        description: "Sales and marketing department",
        headOfDepartment: "Ali Hassan",
        status: "Active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "dept-002",
        code: "DEPT-IT",
        name: "IT",
        description: "Information technology department",
        headOfDepartment: "Usman Khan",
        status: "Active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "dept-003",
        code: "DEPT-ACC",
        name: "Accounts",
        description: "Finance and accounts department",
        headOfDepartment: "Sara Malik",
        status: "Active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "dept-004",
        code: "DEPT-HR",
        name: "HR",
        description: "Human resources department",
        headOfDepartment: "Fatima Noor",
        status: "Active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "dept-005",
        code: "DEPT-WH",
        name: "Warehouse",
        description: "Warehouse and logistics department",
        headOfDepartment: "Zara Hussain",
        status: "Active",
        createdAt: new Date().toISOString(),
      },
    ];
    save(KEYS.departments, departments);

    // Seed designations
    const designations: Designation[] = [
      {
        id: "desig-001",
        code: "SM",
        title: "Sales Manager",
        departmentId: "dept-001",
        grade: "Grade-A",
        description: "Manages sales team and targets",
        status: "Active",
      },
      {
        id: "desig-002",
        code: "SE",
        title: "Sales Executive",
        departmentId: "dept-001",
        grade: "Grade-B",
        description: "Handles sales operations",
        status: "Active",
      },
      {
        id: "desig-003",
        code: "ITO",
        title: "IT Officer",
        departmentId: "dept-002",
        grade: "Grade-A",
        description: "Manages IT infrastructure",
        status: "Active",
      },
      {
        id: "desig-004",
        code: "ACC",
        title: "Accountant",
        departmentId: "dept-003",
        grade: "Grade-A",
        description: "Manages accounts and ledgers",
        status: "Active",
      },
      {
        id: "desig-005",
        code: "HRE",
        title: "HR Executive",
        departmentId: "dept-004",
        grade: "Grade-B",
        description: "Handles HR operations",
        status: "Active",
      },
      {
        id: "desig-006",
        code: "SS",
        title: "Stock Supervisor",
        departmentId: "dept-005",
        grade: "Grade-B",
        description: "Supervises warehouse stock",
        status: "Active",
      },
      {
        id: "desig-007",
        code: "LOAD",
        title: "Loader",
        departmentId: "dept-005",
        grade: "Grade-C",
        description: "Loading and unloading",
        status: "Active",
      },
      {
        id: "desig-008",
        code: "DRV",
        title: "Driver",
        departmentId: "dept-005",
        grade: "Grade-C",
        description: "Vehicle operations",
        status: "Active",
      },
    ];
    save(KEYS.designations, designations);

    // Seed allowance types
    const allowanceTypes: AllowanceType[] = [
      {
        id: "all-001",
        code: "HRA",
        name: "House Rent Allowance",
        calculationType: "Percentage",
        defaultValue: 40,
        taxable: false,
        status: "Active",
      },
      {
        id: "all-002",
        code: "TRANS",
        name: "Transport Allowance",
        calculationType: "Fixed",
        defaultValue: 3000,
        taxable: false,
        status: "Active",
      },
      {
        id: "all-003",
        code: "MED",
        name: "Medical Allowance",
        calculationType: "Fixed",
        defaultValue: 2000,
        taxable: false,
        status: "Active",
      },
      {
        id: "all-004",
        code: "FUEL",
        name: "Fuel Allowance",
        calculationType: "Fixed",
        defaultValue: 2500,
        taxable: false,
        status: "Active",
      },
      {
        id: "all-005",
        code: "OT",
        name: "Overtime Allowance",
        calculationType: "Fixed",
        defaultValue: 200,
        taxable: true,
        status: "Active",
      },
      {
        id: "all-006",
        code: "PERF",
        name: "Performance Bonus",
        calculationType: "Percentage",
        defaultValue: 10,
        taxable: true,
        status: "Active",
      },
    ];
    save(KEYS.allowanceTypes, allowanceTypes);

    // Seed shifts
    const shifts: Shift[] = [
      {
        id: "shift-001",
        name: "Morning Shift",
        startTime: "08:00",
        endTime: "16:00",
        breakMinutes: 60,
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        status: "Active",
      },
      {
        id: "shift-002",
        name: "Afternoon Shift",
        startTime: "14:00",
        endTime: "22:00",
        breakMinutes: 60,
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        status: "Active",
      },
      {
        id: "shift-003",
        name: "Night Shift",
        startTime: "22:00",
        endTime: "06:00",
        breakMinutes: 60,
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        status: "Active",
      },
    ];
    save(KEYS.shifts, shifts);

    // Seed shift assignments
    const shiftAssignments: EmployeeShiftAssignment[] = [
      {
        id: "sa-001",
        employeeId: "emp-001",
        shiftId: "shift-001",
        effectiveFrom: "2024-01-01",
        effectiveTo: "2024-12-31",
        notes: "Standard morning shift",
      },
      {
        id: "sa-002",
        employeeId: "emp-002",
        shiftId: "shift-001",
        effectiveFrom: "2024-01-01",
        effectiveTo: "2024-12-31",
        notes: "",
      },
      {
        id: "sa-003",
        employeeId: "emp-006",
        shiftId: "shift-002",
        effectiveFrom: "2024-01-01",
        effectiveTo: "2024-12-31",
        notes: "Afternoon warehouse shift",
      },
      {
        id: "sa-004",
        employeeId: "emp-007",
        shiftId: "shift-001",
        effectiveFrom: "2024-02-01",
        effectiveTo: "2024-12-31",
        notes: "",
      },
    ];
    save(KEYS.shiftAssignments, shiftAssignments);

    // Seed shift closings
    const today = new Date().toISOString().slice(0, 10);
    const shiftClosings: ShiftClosing[] = [
      {
        id: "sc-001",
        closingNumber: "SC-2024-001",
        shopId: "shop-001",
        shopName: "Main Branch",
        shiftId: "shift-001",
        shiftName: "Morning Shift",
        date: today,
        openedBy: "System Admin",
        closedBy: "",
        openingCash: 10000,
        closingCash: 0,
        expectedCash: 0,
        cashVariance: 0,
        totalSales: 57000,
        totalTransactions: 1,
        salesByPaymentMode: [{ mode: "Cash", amount: 57000, count: 1 }],
        status: "Open",
        notes: "",
        openedAt: new Date().toISOString(),
        closedAt: "",
      },
    ];
    save(KEYS.shiftClosings, shiftClosings);

    // Seed salary slips
    const salarySlips: SalarySlip[] = [
      {
        id: "ss-001",
        slipNumber: "SS-2024-001",
        employeeId: "emp-001",
        employeeName: "Ali Hassan",
        employeeCode: "EMP001",
        designation: "Sales Manager",
        department: "Sales",
        month: 3,
        year: 2024,
        periodLabel: "March 2024",
        basicSalary: 45000,
        allowances: [
          { name: "House Rent Allowance", amount: 18000, taxable: false },
          { name: "Transport Allowance", amount: 3000, taxable: false },
          { name: "Medical Allowance", amount: 2000, taxable: false },
        ],
        grossSalary: 68000,
        deductions: [
          { name: "Income Tax", amount: 3000 },
          { name: "Provident Fund", amount: 2250 },
        ],
        totalDeductions: 5250,
        netSalary: 62750,
        paymentDate: "2024-03-31",
        bankName: "HBL",
        accountNumber: "01234567890",
        status: "Paid",
        generatedAt: new Date().toISOString(),
      },
      {
        id: "ss-002",
        slipNumber: "SS-2024-002",
        employeeId: "emp-002",
        employeeName: "Sara Malik",
        employeeCode: "EMP002",
        designation: "Accountant",
        department: "Accounts",
        month: 3,
        year: 2024,
        periodLabel: "March 2024",
        basicSalary: 40000,
        allowances: [
          { name: "House Rent Allowance", amount: 16000, taxable: false },
          { name: "Transport Allowance", amount: 3000, taxable: false },
        ],
        grossSalary: 59000,
        deductions: [
          { name: "Income Tax", amount: 2500 },
          { name: "Provident Fund", amount: 2000 },
        ],
        totalDeductions: 4500,
        netSalary: 54500,
        paymentDate: "2024-03-31",
        bankName: "MCB",
        accountNumber: "98765432100",
        status: "Paid",
        generatedAt: new Date().toISOString(),
      },
      {
        id: "ss-003",
        slipNumber: "SS-2024-003",
        employeeId: "emp-003",
        employeeName: "Usman Khan",
        employeeCode: "EMP003",
        designation: "IT Officer",
        department: "IT",
        month: 4,
        year: 2024,
        periodLabel: "April 2024",
        basicSalary: 50000,
        allowances: [
          { name: "House Rent Allowance", amount: 20000, taxable: false },
          { name: "Transport Allowance", amount: 3000, taxable: false },
          { name: "Fuel Allowance", amount: 2500, taxable: false },
        ],
        grossSalary: 75500,
        deductions: [
          { name: "Income Tax", amount: 4000 },
          { name: "Provident Fund", amount: 2500 },
        ],
        totalDeductions: 6500,
        netSalary: 69000,
        paymentDate: "2024-04-30",
        bankName: "UBL",
        accountNumber: "11223344550",
        status: "Draft",
        generatedAt: new Date().toISOString(),
      },
    ];
    save(KEYS.salarySlips, salarySlips);

    // Seed ItemCategories
    if (!localStorage.getItem(KEYS.itemCategories)) {
      const cats: ItemCategory[] = [
        {
          id: "cat-001",
          code: "CAT-001",
          name: "Electronics",
          description: "Electronic devices and gadgets",
          seqNo: 1,
          status: "active",
        },
        {
          id: "cat-002",
          code: "CAT-002",
          name: "Accessories",
          description: "Device accessories and peripherals",
          parentId: "cat-001",
          seqNo: 2,
          status: "active",
        },
        {
          id: "cat-003",
          code: "CAT-003",
          name: "Clothing",
          description: "Apparel and fashion items",
          seqNo: 3,
          status: "active",
        },
        {
          id: "cat-004",
          code: "CAT-004",
          name: "Food & Beverage",
          description: "Food, drinks and consumables",
          seqNo: 4,
          status: "active",
        },
        {
          id: "cat-005",
          code: "CAT-005",
          name: "Office Supplies",
          description: "Office stationery and equipment",
          seqNo: 5,
          status: "active",
        },
        {
          id: "cat-006",
          code: "CAT-006",
          name: "Sports",
          description: "Sports equipment and apparel",
          seqNo: 6,
          status: "active",
        },
        {
          id: "cat-007",
          code: "CAT-007",
          name: "Toys",
          description: "Toys, games and hobbies",
          seqNo: 7,
          status: "active",
        },
        {
          id: "cat-008",
          code: "CAT-008",
          name: "Home & Garden",
          description: "Home decor and gardening",
          seqNo: 8,
          status: "active",
        },
      ];
      save(KEYS.itemCategories, cats);
    }

    // Seed ItemBrands
    if (!localStorage.getItem(KEYS.itemBrands)) {
      const brands: ItemBrand[] = [
        {
          id: "brand-001",
          code: "BRD-001",
          name: "Samsung",
          description: "Samsung Electronics",
          status: "active",
        },
        {
          id: "brand-002",
          code: "BRD-002",
          name: "Apple",
          description: "Apple Inc.",
          status: "active",
        },
        {
          id: "brand-003",
          code: "BRD-003",
          name: "Sony",
          description: "Sony Corporation",
          status: "active",
        },
        {
          id: "brand-004",
          code: "BRD-004",
          name: "LG",
          description: "LG Electronics",
          status: "active",
        },
        {
          id: "brand-005",
          code: "BRD-005",
          name: "Nike",
          description: "Nike Inc.",
          status: "active",
        },
        {
          id: "brand-006",
          code: "BRD-006",
          name: "Adidas",
          description: "Adidas AG",
          status: "active",
        },
        {
          id: "brand-007",
          code: "BRD-007",
          name: "Generic",
          description: "Generic / Unbranded",
          status: "active",
        },
        {
          id: "brand-008",
          code: "BRD-008",
          name: "Anker",
          description: "Anker Innovations",
          status: "active",
        },
      ];
      save(KEYS.itemBrands, brands);
    }

    // Seed ItemUnits
    if (!localStorage.getItem(KEYS.itemUnits)) {
      const units: ItemUnit[] = [
        {
          id: "unit-001",
          code: "UOM-001",
          name: "Piece",
          abbreviation: "pcs",
          isBaseUnit: true,
          conversionFactor: 1,
          status: "active",
        },
        {
          id: "unit-002",
          code: "UOM-002",
          name: "Kilogram",
          abbreviation: "kg",
          isBaseUnit: false,
          conversionFactor: 1000,
          status: "active",
        },
        {
          id: "unit-003",
          code: "UOM-003",
          name: "Litre",
          abbreviation: "L",
          isBaseUnit: false,
          conversionFactor: 1,
          status: "active",
        },
        {
          id: "unit-004",
          code: "UOM-004",
          name: "Box",
          abbreviation: "box",
          isBaseUnit: false,
          conversionFactor: 12,
          status: "active",
        },
        {
          id: "unit-005",
          code: "UOM-005",
          name: "Dozen",
          abbreviation: "doz",
          isBaseUnit: false,
          conversionFactor: 12,
          status: "active",
        },
        {
          id: "unit-006",
          code: "UOM-006",
          name: "Meter",
          abbreviation: "m",
          isBaseUnit: false,
          conversionFactor: 1,
          status: "active",
        },
        {
          id: "unit-007",
          code: "UOM-007",
          name: "Pair",
          abbreviation: "pr",
          isBaseUnit: false,
          conversionFactor: 2,
          status: "active",
        },
      ];
      save(KEYS.itemUnits, units);
    }

    // Update items with categoryId/brandId/unitId links
    try {
      const existingItems = load<Item[]>(KEYS.items, []);
      const updatedItems = existingItems.map((item) => {
        const updates: Partial<Item> = {};
        if (!item.categoryId) {
          if (item.category === "Electronics") updates.categoryId = "cat-001";
          else if (item.category === "Accessories")
            updates.categoryId = "cat-002";
        }
        if (!item.brandId) {
          if (item.name.toLowerCase().includes("samsung"))
            updates.brandId = "brand-001";
          else if (
            item.name.toLowerCase().includes("iphone") ||
            item.name.toLowerCase().includes("apple")
          )
            updates.brandId = "brand-002";
          else if (item.name.toLowerCase().includes("sony"))
            updates.brandId = "brand-003";
        }
        if (!item.unitId) updates.unitId = "unit-001";
        return { ...item, ...updates };
      });
      save(KEYS.items, updatedItems);
    } catch {
      /* ignore */
    }
  }
}

initStore();

// Always ensure super user and default accounts exist regardless of seed state
(function ensureSuperUser() {
  const users = load<User[]>(KEYS.users, []);
  const hasSuperUser = users.some((u) => u.email === "superuser@bizpos.com");
  if (!hasSuperUser) {
    const superUser: User = {
      id: "user-super",
      name: "Super User",
      email: "superuser@bizpos.com",
      password: "super123",
      roleId: "role-admin",
      status: "Active",
      createdAt: new Date().toISOString(),
      isSuperUser: true,
      assignedWarehouseIds: [],
    };
    save(KEYS.users, [...users, superUser]);
  } else {
    // Ensure existing super user has isSuperUser flag and correct password
    const updated = users.map((u) =>
      u.email === "superuser@bizpos.com"
        ? { ...u, isSuperUser: true, password: "super123", status: "Active" }
        : u,
    );
    save(KEYS.users, updated);
  }
  // Also ensure admin has isSuperUser flag
  const users2 = load<User[]>(KEYS.users, []);
  const hasAdmin = users2.some((u) => u.email === "admin@bizpos.com");
  if (!hasAdmin) {
    const adminUser: User = {
      id: "user-admin",
      name: "System Admin",
      email: "admin@bizpos.com",
      password: "admin123",
      roleId: "role-admin",
      status: "Active",
      createdAt: new Date().toISOString(),
      isSuperUser: true,
      assignedWarehouseIds: [],
    };
    save(KEYS.users, [...users2, adminUser]);
  }
})();

// Ensure taxes/discounts/promotions exist even if seeded flag was already set
(function ensurePricingData() {
  const generateIdLocal = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  if (!localStorage.getItem("bizpos_taxes")) {
    const taxes: TaxRate[] = [
      {
        id: generateIdLocal(),
        name: "GST",
        rate: 17,
        applicableTo: "all",
        categories: [],
        productIds: [],
        status: "Active",
      },
      {
        id: generateIdLocal(),
        name: "Sales Tax",
        rate: 8,
        applicableTo: "all",
        categories: [],
        productIds: [],
        status: "Active",
      },
      {
        id: generateIdLocal(),
        name: "Service Tax",
        rate: 5,
        applicableTo: "category",
        categories: ["Services"],
        productIds: [],
        status: "Active",
      },
    ];
    localStorage.setItem("bizpos_taxes", JSON.stringify(taxes));
  }
  if (!localStorage.getItem("bizpos_discounts")) {
    const discounts: Discount[] = [
      {
        id: generateIdLocal(),
        name: "Bulk Discount",
        percentage: 10,
        applicableTo: "all",
        categories: [],
        productIds: [],
        status: "Active",
      },
      {
        id: generateIdLocal(),
        name: "Member Discount",
        percentage: 5,
        applicableTo: "all",
        categories: [],
        productIds: [],
        status: "Active",
      },
    ];
    localStorage.setItem("bizpos_discounts", JSON.stringify(discounts));
  }
  if (!localStorage.getItem("bizpos_promotions")) {
    const promotions: Promotion[] = [
      {
        id: generateIdLocal(),
        name: "Summer Sale",
        discountPercentage: 15,
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        applicableTo: "all",
        categories: [],
        productIds: [],
        status: "Active",
      },
      {
        id: generateIdLocal(),
        name: "Eid Special",
        discountPercentage: 20,
        startDate: "2026-03-25",
        endDate: "2026-04-05",
        applicableTo: "all",
        categories: [],
        productIds: [],
        status: "Active",
      },
    ];
    localStorage.setItem("bizpos_promotions", JSON.stringify(promotions));
  }
})();

// ---- Store State ----
interface StoreState {
  companies: Company[];
  roles: Role[];
  users: User[];
  accounts: Account[];
  warehouses: Warehouse[];
  shops: Shop[];
  employees: Employee[];
  payrolls: Payroll[];
  items: Item[];
  suppliers: Supplier[];
  customers: Customer[];
  paymentModes: PaymentMode[];
  sales: Sale[];
  purchases: Purchase[];
  payments: Payment[];
  journalEntries: JournalEntry[];
  expenses: Expense[];
  settings: Settings;
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];
  logs: Log[];
  bankTransactions: BankTransaction[];
  purchaseOrders: PurchaseOrder[];
  taxes: TaxRate[];
  discounts: Discount[];
  promotions: Promotion[];
  purchaseRequisitions: PurchaseRequisition[];
  goodsReceiptNotes: GoodsReceiptNote[];
  inventoryTransfers: InventoryTransfer[];
  shipments: Shipment[];
  departments: Department[];
  designations: Designation[];
  allowanceTypes: AllowanceType[];
  shifts: Shift[];
  shiftAssignments: EmployeeShiftAssignment[];
  shiftClosings: ShiftClosing[];
  salarySlips: SalarySlip[];
  itemCategories: ItemCategory[];
  itemBrands: ItemBrand[];
  itemUnits: ItemUnit[];
  stockMovements: StockMovement[];
}

function readAll(): StoreState {
  return {
    companies: load<Company[]>(KEYS.companies, []),
    roles: load<Role[]>(KEYS.roles, []),
    users: load<User[]>(KEYS.users, []),
    accounts: load<Account[]>(KEYS.accounts, []),
    warehouses: load<Warehouse[]>(KEYS.warehouses, []),
    shops: load<Shop[]>(KEYS.shops, []),
    employees: load<Employee[]>(KEYS.employees, []),
    payrolls: load<Payroll[]>(KEYS.payrolls, []),
    items: load<Item[]>(KEYS.items, []),
    suppliers: load<Supplier[]>(KEYS.suppliers, []),
    customers: load<Customer[]>(KEYS.customers, []),
    paymentModes: load<PaymentMode[]>(KEYS.paymentModes, []),
    sales: load<Sale[]>(KEYS.sales, []),
    purchases: load<Purchase[]>(KEYS.purchases, []),
    payments: load<Payment[]>(KEYS.payments, []),
    journalEntries: load<JournalEntry[]>(KEYS.journalEntries, []),
    expenses: load<Expense[]>(KEYS.expenses, []),
    settings: load<Settings>(KEYS.settings, {
      companyName: "BizPOS",
      currency: "PKR",
      invoiceFooter: "",
    }),
    leaveTypes: load<LeaveType[]>(KEYS.leaveTypes, []),
    leaveRequests: load<LeaveRequest[]>(KEYS.leaveRequests, []),
    logs: load<Log[]>(KEYS.logs, []),
    bankTransactions: load<BankTransaction[]>(KEYS.bankTransactions, []),
    purchaseOrders: load<PurchaseOrder[]>(KEYS.purchaseOrders, []),
    taxes: load<TaxRate[]>(KEYS.taxes, []),
    discounts: load<Discount[]>(KEYS.discounts, []),
    promotions: load<Promotion[]>(KEYS.promotions, []),
    purchaseRequisitions: load<PurchaseRequisition[]>(
      KEYS.purchaseRequisitions,
      [],
    ),
    goodsReceiptNotes: load<GoodsReceiptNote[]>(KEYS.goodsReceiptNotes, []),
    inventoryTransfers: load<InventoryTransfer[]>(KEYS.inventoryTransfers, []),
    shipments: load<Shipment[]>(KEYS.shipments, []),
    departments: load<Department[]>(KEYS.departments, []),
    designations: load<Designation[]>(KEYS.designations, []),
    allowanceTypes: load<AllowanceType[]>(KEYS.allowanceTypes, []),
    shifts: load<Shift[]>(KEYS.shifts, []),
    shiftAssignments: load<EmployeeShiftAssignment[]>(
      KEYS.shiftAssignments,
      [],
    ),
    shiftClosings: load<ShiftClosing[]>(KEYS.shiftClosings, []),
    salarySlips: load<SalarySlip[]>(KEYS.salarySlips, []),
    itemCategories: load<ItemCategory[]>(KEYS.itemCategories, []),
    itemBrands: load<ItemBrand[]>(KEYS.itemBrands, []),
    itemUnits: load<ItemUnit[]>(KEYS.itemUnits, []),
    stockMovements: load<StockMovement[]>(KEYS.stockMovements, []),
  };
}

export function useStore() {
  const [state, setState] = useState<StoreState>(readAll);

  const refresh = useCallback(() => {
    setState(readAll());
  }, []);

  useEffect(() => {
    window.addEventListener("bizpos-store-updated", refresh);
    return () => window.removeEventListener("bizpos-store-updated", refresh);
  }, [refresh]);

  // ---- Internal log helper ----
  const _log = useCallback(
    (module: string, action: Log["action"], details: string) => {
      const user = getSessionUser();
      const userId = getSessionUserId();
      const entry: Log = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        user,
        userId,
        module,
        action,
        details,
      };
      const existing = load<Log[]>(KEYS.logs, []);
      const trimmed = existing.slice(-999);
      save(KEYS.logs, [...trimmed, entry]);
    },
    [],
  );

  // ---- Roles ----
  const addRole = useCallback((role: Omit<Role, "id">) => {
    const newRole = { ...role, id: generateId() };
    save(KEYS.roles, [...load<Role[]>(KEYS.roles, []), newRole]);
  }, []);
  const updateRole = useCallback((id: string, role: Partial<Role>) => {
    save(
      KEYS.roles,
      load<Role[]>(KEYS.roles, []).map((r) =>
        r.id === id ? { ...r, ...role } : r,
      ),
    );
  }, []);
  const deleteRole = useCallback((id: string) => {
    save(
      KEYS.roles,
      load<Role[]>(KEYS.roles, []).filter((r) => r.id !== id),
    );
  }, []);

  // ---- Companies ----
  const addCompany = useCallback((company: Omit<Company, "id">) => {
    save(KEYS.companies, [
      ...load<Company[]>(KEYS.companies, []),
      { ...company, id: `comp-${Date.now()}` },
    ]);
  }, []);
  const updateCompany = useCallback((id: string, company: Partial<Company>) => {
    save(
      KEYS.companies,
      load<Company[]>(KEYS.companies, []).map((c) =>
        c.id === id ? { ...c, ...company } : c,
      ),
    );
  }, []);
  const deleteCompany = useCallback((id: string) => {
    save(
      KEYS.companies,
      load<Company[]>(KEYS.companies, []).filter((c) => c.id !== id),
    );
  }, []);

  // ---- Users ----
  const addUser = useCallback((user: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    save(KEYS.users, [...load<User[]>(KEYS.users, []), newUser]);
  }, []);
  const updateUser = useCallback((id: string, user: Partial<User>) => {
    save(
      KEYS.users,
      load<User[]>(KEYS.users, []).map((u) =>
        u.id === id ? { ...u, ...user } : u,
      ),
    );
  }, []);
  const deleteUser = useCallback((id: string) => {
    save(
      KEYS.users,
      load<User[]>(KEYS.users, []).filter((u) => u.id !== id),
    );
  }, []);

  // ---- Accounts ----
  const addAccount = useCallback((account: Omit<Account, "id">) => {
    const newAccount: Account = { ...account, id: generateId() };
    save(KEYS.accounts, [...load<Account[]>(KEYS.accounts, []), newAccount]);
  }, []);
  const updateAccount = useCallback((id: string, account: Partial<Account>) => {
    save(
      KEYS.accounts,
      load<Account[]>(KEYS.accounts, []).map((a) =>
        a.id === id ? { ...a, ...account } : a,
      ),
    );
  }, []);
  const deleteAccount = useCallback((id: string) => {
    save(
      KEYS.accounts,
      load<Account[]>(KEYS.accounts, []).filter((a) => a.id !== id),
    );
  }, []);

  // ---- Warehouses ----
  const addWarehouse = useCallback((warehouse: Omit<Warehouse, "id">) => {
    save(KEYS.warehouses, [
      ...load<Warehouse[]>(KEYS.warehouses, []),
      { ...warehouse, id: generateId() },
    ]);
  }, []);
  const updateWarehouse = useCallback(
    (id: string, warehouse: Partial<Warehouse>) => {
      save(
        KEYS.warehouses,
        load<Warehouse[]>(KEYS.warehouses, []).map((w) =>
          w.id === id ? { ...w, ...warehouse } : w,
        ),
      );
    },
    [],
  );
  const deleteWarehouse = useCallback((id: string) => {
    save(
      KEYS.warehouses,
      load<Warehouse[]>(KEYS.warehouses, []).filter((w) => w.id !== id),
    );
  }, []);

  // ---- Shops ----
  const addShop = useCallback((shop: Omit<Shop, "id">) => {
    save(KEYS.shops, [
      ...load<Shop[]>(KEYS.shops, []),
      { ...shop, id: generateId() },
    ]);
  }, []);
  const updateShop = useCallback((id: string, shop: Partial<Shop>) => {
    save(
      KEYS.shops,
      load<Shop[]>(KEYS.shops, []).map((s) =>
        s.id === id ? { ...s, ...shop } : s,
      ),
    );
  }, []);
  const deleteShop = useCallback((id: string) => {
    save(
      KEYS.shops,
      load<Shop[]>(KEYS.shops, []).filter((s) => s.id !== id),
    );
  }, []);

  // ---- Employees ----
  const addEmployee = useCallback(
    (emp: Omit<Employee, "id">) => {
      const newEmp = { ...emp, id: generateId() };
      save(KEYS.employees, [...load<Employee[]>(KEYS.employees, []), newEmp]);
      _log(
        "Employees",
        "create",
        `Added employee ${emp.employeeId} — ${emp.name}`,
      );
    },
    [_log],
  );
  const updateEmployee = useCallback(
    (id: string, emp: Partial<Employee>) => {
      save(
        KEYS.employees,
        load<Employee[]>(KEYS.employees, []).map((e) =>
          e.id === id ? { ...e, ...emp } : e,
        ),
      );
      _log("Employees", "update", `Updated employee ${id}`);
    },
    [_log],
  );
  const deleteEmployee = useCallback(
    (id: string) => {
      save(
        KEYS.employees,
        load<Employee[]>(KEYS.employees, []).filter((e) => e.id !== id),
      );
      _log("Employees", "delete", `Deleted employee ${id}`);
    },
    [_log],
  );

  // ---- Payrolls ----
  const addPayroll = useCallback(
    (payroll: Omit<Payroll, "id" | "createdAt">) => {
      const newPayroll: Payroll = {
        ...payroll,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      save(KEYS.payrolls, [...load<Payroll[]>(KEYS.payrolls, []), newPayroll]);
      _log("Payroll", "create", `Processed payroll for ${payroll.period}`);
    },
    [_log],
  );
  const updatePayroll = useCallback(
    (id: string, payroll: Partial<Payroll>) => {
      save(
        KEYS.payrolls,
        load<Payroll[]>(KEYS.payrolls, []).map((p) =>
          p.id === id ? { ...p, ...payroll } : p,
        ),
      );
      _log("Payroll", "update", `Updated payroll ${id}`);
    },
    [_log],
  );
  const deletePayroll = useCallback((id: string) => {
    save(
      KEYS.payrolls,
      load<Payroll[]>(KEYS.payrolls, []).filter((p) => p.id !== id),
    );
  }, []);

  // ---- Items ----
  const addItem = useCallback((item: Omit<Item, "id">) => {
    save(KEYS.items, [
      ...load<Item[]>(KEYS.items, []),
      { ...item, id: generateId() },
    ]);
  }, []);
  const updateItem = useCallback((id: string, item: Partial<Item>) => {
    save(
      KEYS.items,
      load<Item[]>(KEYS.items, []).map((i) =>
        i.id === id ? { ...i, ...item } : i,
      ),
    );
  }, []);
  const deleteItem = useCallback((id: string) => {
    save(
      KEYS.items,
      load<Item[]>(KEYS.items, []).filter((i) => i.id !== id),
    );
  }, []);
  const adjustStock = useCallback((itemId: string, qty: number) => {
    save(
      KEYS.items,
      load<Item[]>(KEYS.items, []).map((i) =>
        i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + qty) } : i,
      ),
    );
  }, []);

  // ---- Suppliers ----
  const addSupplier = useCallback(
    (supplier: Omit<Supplier, "id" | "createdAt">) => {
      save(KEYS.suppliers, [
        ...load<Supplier[]>(KEYS.suppliers, []),
        { ...supplier, id: generateId(), createdAt: new Date().toISOString() },
      ]);
    },
    [],
  );
  const updateSupplier = useCallback(
    (id: string, supplier: Partial<Supplier>) => {
      save(
        KEYS.suppliers,
        load<Supplier[]>(KEYS.suppliers, []).map((s) =>
          s.id === id ? { ...s, ...supplier } : s,
        ),
      );
    },
    [],
  );
  const deleteSupplier = useCallback((id: string) => {
    save(
      KEYS.suppliers,
      load<Supplier[]>(KEYS.suppliers, []).filter((s) => s.id !== id),
    );
  }, []);

  // ---- Customers ----
  const addCustomer = useCallback(
    (customer: Omit<Customer, "id" | "createdAt">) => {
      save(KEYS.customers, [
        ...load<Customer[]>(KEYS.customers, []),
        { ...customer, id: generateId(), createdAt: new Date().toISOString() },
      ]);
    },
    [],
  );
  const updateCustomer = useCallback(
    (id: string, customer: Partial<Customer>) => {
      save(
        KEYS.customers,
        load<Customer[]>(KEYS.customers, []).map((c) =>
          c.id === id ? { ...c, ...customer } : c,
        ),
      );
    },
    [],
  );
  const deleteCustomer = useCallback((id: string) => {
    save(
      KEYS.customers,
      load<Customer[]>(KEYS.customers, []).filter((c) => c.id !== id),
    );
  }, []);

  // ---- Payment Modes ----
  const addPaymentMode = useCallback((pm: Omit<PaymentMode, "id">) => {
    save(KEYS.paymentModes, [
      ...load<PaymentMode[]>(KEYS.paymentModes, []),
      { ...pm, id: generateId() },
    ]);
  }, []);
  const updatePaymentMode = useCallback(
    (id: string, pm: Partial<PaymentMode>) => {
      save(
        KEYS.paymentModes,
        load<PaymentMode[]>(KEYS.paymentModes, []).map((p) =>
          p.id === id ? { ...p, ...pm } : p,
        ),
      );
    },
    [],
  );
  const deletePaymentMode = useCallback((id: string) => {
    save(
      KEYS.paymentModes,
      load<PaymentMode[]>(KEYS.paymentModes, []).filter((p) => p.id !== id),
    );
  }, []);

  // ---- Stock Movements ----
  const addStockMovement = useCallback(
    (mv: Omit<StockMovement, "id" | "createdAt" | "createdBy">) => {
      const user = getSessionUser();
      const newMv: StockMovement = {
        ...mv,
        id: generateId(),
        createdAt: new Date().toISOString(),
        createdBy: user,
      };
      save(KEYS.stockMovements, [
        ...load<StockMovement[]>(KEYS.stockMovements, []),
        newMv,
      ]);
    },
    [],
  );

  // ---- Sales ----
  const addSale = useCallback(
    (sale: Sale) => {
      // Deduct stock for each item sold
      const currentItems = load<Item[]>(KEYS.items, []);
      const updatedItems = currentItems.map((item) => {
        const soldItem = sale.items.find((si) => si.itemId === item.id);
        if (soldItem) {
          return {
            ...item,
            quantity: Math.max(0, item.quantity - soldItem.quantity),
          };
        }
        return item;
      });
      save(KEYS.items, updatedItems);
      save(KEYS.sales, [...load<Sale[]>(KEYS.sales, []), sale]);
      // Record stock movements
      for (const si of sale.items) {
        const item = currentItems.find((i) => i.id === si.itemId);
        addStockMovement({
          itemId: si.itemId,
          itemName: si.itemName,
          type: "Sale",
          reference: sale.id,
          quantityChange: -si.quantity,
          quantityAfter: item ? Math.max(0, item.quantity - si.quantity) : 0,
          warehouseId: sale.warehouseId,
          warehouseName: sale.warehouseName,
          notes: `Sale to ${sale.customerName}`,
        });
      }
      _log("Sales", "create", `Created sale ${sale.id}`);
    },
    [_log, addStockMovement],
  );
  const updateSale = useCallback((id: string, sale: Partial<Sale>) => {
    save(
      KEYS.sales,
      load<Sale[]>(KEYS.sales, []).map((s) =>
        s.id === id ? { ...s, ...sale } : s,
      ),
    );
  }, []);
  const deleteSale = useCallback(
    (id: string) => {
      save(
        KEYS.sales,
        load<Sale[]>(KEYS.sales, []).filter((s) => s.id !== id),
      );
      _log("Sales", "delete", `Deleted sale ${id}`);
    },
    [_log],
  );

  // ---- Purchases ----
  const addPurchase = useCallback(
    (purchase: Purchase) => {
      if (purchase.status === "Received") {
        const currentItems = load<Item[]>(KEYS.items, []);
        const updatedItems = currentItems.map((item) => {
          const purchasedItem = purchase.items.find(
            (pi) => pi.itemId === item.id,
          );
          if (purchasedItem) {
            return {
              ...item,
              quantity: item.quantity + purchasedItem.quantity,
            };
          }
          return item;
        });
        save(KEYS.items, updatedItems);
      }
      save(KEYS.purchases, [...load<Purchase[]>(KEYS.purchases, []), purchase]);
      _log("Purchases", "create", `Created purchase ${purchase.id}`);
    },
    [_log],
  );
  const updatePurchase = useCallback(
    (id: string, purchase: Partial<Purchase>) => {
      const existing = load<Purchase[]>(KEYS.purchases, []);
      const old = existing.find((p) => p.id === id);
      const updated = existing.map((p) =>
        p.id === id ? { ...p, ...purchase } : p,
      );
      save(KEYS.purchases, updated);
      // Handle stock changes when status changes
      if (old && purchase.status && old.status !== purchase.status) {
        const newStatus = purchase.status;
        const oldStatus = old.status;
        const mergedPurchase = { ...old, ...purchase };
        const currentItems = load<Item[]>(KEYS.items, []);
        if (oldStatus !== "Received" && newStatus === "Received") {
          // Increment stock
          const updatedItems = currentItems.map((item) => {
            const pi = mergedPurchase.items?.find((i) => i.itemId === item.id);
            if (pi) return { ...item, quantity: item.quantity + pi.quantity };
            return item;
          });
          save(KEYS.items, updatedItems);
          // Record stock movements
          for (const pi of mergedPurchase.items || []) {
            const item = currentItems.find((i) => i.id === pi.itemId);
            addStockMovement({
              itemId: pi.itemId,
              itemName: pi.itemName,
              type: "Purchase",
              reference: mergedPurchase.id,
              quantityChange: pi.quantity,
              quantityAfter: item ? item.quantity + pi.quantity : pi.quantity,
              warehouseId: mergedPurchase.warehouseId,
              warehouseName: mergedPurchase.warehouseName,
              notes: `Purchase received from ${mergedPurchase.supplierName}`,
            });
          }
        } else if (oldStatus === "Received" && newStatus !== "Received") {
          // Decrement stock (e.g., cancelled after received)
          const updatedItems = currentItems.map((item) => {
            const pi = mergedPurchase.items?.find((i) => i.itemId === item.id);
            if (pi)
              return {
                ...item,
                quantity: Math.max(0, item.quantity - pi.quantity),
              };
            return item;
          });
          save(KEYS.items, updatedItems);
        }
      }
    },
    [addStockMovement],
  );
  const deletePurchase = useCallback((id: string) => {
    save(
      KEYS.purchases,
      load<Purchase[]>(KEYS.purchases, []).filter((p) => p.id !== id),
    );
  }, []);

  // ---- Payments ----
  const addPayment = useCallback(
    (payment: Payment) => {
      save(KEYS.payments, [...load<Payment[]>(KEYS.payments, []), payment]);
      _log("Payments", "create", `Payment ${payment.id} received`);
    },
    [_log],
  );
  const deletePayment = useCallback((id: string) => {
    save(
      KEYS.payments,
      load<Payment[]>(KEYS.payments, []).filter((p) => p.id !== id),
    );
  }, []);

  // ---- Journal Entries ----
  const addJournalEntry = useCallback(
    (entry: Omit<JournalEntry, "id" | "createdAt">) => {
      const newEntry: JournalEntry = {
        ...entry,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      save(KEYS.journalEntries, [
        ...load<JournalEntry[]>(KEYS.journalEntries, []),
        newEntry,
      ]);
    },
    [],
  );
  const updateJournalEntry = useCallback(
    (id: string, entry: Partial<JournalEntry>) => {
      save(
        KEYS.journalEntries,
        load<JournalEntry[]>(KEYS.journalEntries, []).map((e) =>
          e.id === id ? { ...e, ...entry } : e,
        ),
      );
    },
    [],
  );
  const deleteJournalEntry = useCallback((id: string) => {
    save(
      KEYS.journalEntries,
      load<JournalEntry[]>(KEYS.journalEntries, []).filter((e) => e.id !== id),
    );
  }, []);

  // ---- Expenses ----
  const addExpense = useCallback(
    (expense: Omit<Expense, "id" | "createdAt">) => {
      const newExpense: Expense = {
        ...expense,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      save(KEYS.expenses, [...load<Expense[]>(KEYS.expenses, []), newExpense]);
    },
    [],
  );
  const updateExpense = useCallback((id: string, expense: Partial<Expense>) => {
    save(
      KEYS.expenses,
      load<Expense[]>(KEYS.expenses, []).map((e) =>
        e.id === id ? { ...e, ...expense } : e,
      ),
    );
  }, []);
  const deleteExpense = useCallback((id: string) => {
    save(
      KEYS.expenses,
      load<Expense[]>(KEYS.expenses, []).filter((e) => e.id !== id),
    );
  }, []);

  // ---- Settings ----
  const updateSettings = useCallback((settings: Partial<Settings>) => {
    const current = load<Settings>(KEYS.settings, {
      companyName: "BizPOS",
      currency: "PKR",
      invoiceFooter: "",
    });
    save(KEYS.settings, { ...current, ...settings });
  }, []);

  // ---- Leave Types ----
  const addLeaveType = useCallback((lt: Omit<LeaveType, "id">) => {
    save(KEYS.leaveTypes, [
      ...load<LeaveType[]>(KEYS.leaveTypes, []),
      { ...lt, id: generateId() },
    ]);
  }, []);
  const updateLeaveType = useCallback((id: string, lt: Partial<LeaveType>) => {
    save(
      KEYS.leaveTypes,
      load<LeaveType[]>(KEYS.leaveTypes, []).map((l) =>
        l.id === id ? { ...l, ...lt } : l,
      ),
    );
  }, []);
  const deleteLeaveType = useCallback((id: string) => {
    save(
      KEYS.leaveTypes,
      load<LeaveType[]>(KEYS.leaveTypes, []).filter((l) => l.id !== id),
    );
  }, []);

  // ---- Leave Requests ----
  const addLeaveRequest = useCallback(
    (req: Omit<LeaveRequest, "id" | "createdAt">) => {
      const newReq: LeaveRequest = {
        ...req,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      save(KEYS.leaveRequests, [
        ...load<LeaveRequest[]>(KEYS.leaveRequests, []),
        newReq,
      ]);
      _log("Leave", "create", `Leave request submitted by ${req.employeeName}`);
    },
    [_log],
  );
  const updateLeaveRequest = useCallback(
    (id: string, req: Partial<LeaveRequest>) => {
      save(
        KEYS.leaveRequests,
        load<LeaveRequest[]>(KEYS.leaveRequests, []).map((r) =>
          r.id === id ? { ...r, ...req } : r,
        ),
      );
      if (req.status) {
        _log("Leave", "update", `Leave request ${id} marked ${req.status}`);
      }
    },
    [_log],
  );
  const deleteLeaveRequest = useCallback((id: string) => {
    save(
      KEYS.leaveRequests,
      load<LeaveRequest[]>(KEYS.leaveRequests, []).filter((r) => r.id !== id),
    );
  }, []);

  // ---- Bank Transactions ----
  const addBankTransaction = useCallback((t: Omit<BankTransaction, "id">) => {
    const newT: BankTransaction = { ...t, id: generateId() };
    save(KEYS.bankTransactions, [
      ...load<BankTransaction[]>(KEYS.bankTransactions, []),
      newT,
    ]);
  }, []);

  const updateBankTransaction = useCallback(
    (id: string, t: Partial<BankTransaction>) => {
      save(
        KEYS.bankTransactions,
        load<BankTransaction[]>(KEYS.bankTransactions, []).map((x) =>
          x.id === id ? { ...x, ...t } : x,
        ),
      );
    },
    [],
  );

  const deleteBankTransaction = useCallback((id: string) => {
    save(
      KEYS.bankTransactions,
      load<BankTransaction[]>(KEYS.bankTransactions, []).filter(
        (x) => x.id !== id,
      ),
    );
  }, []);

  const toggleBankTransactionReconciled = useCallback((id: string) => {
    const current = load<BankTransaction[]>(KEYS.bankTransactions, []);
    const updated = current.map((x) =>
      x.id === id ? { ...x, reconciled: !x.reconciled } : x,
    );
    save(KEYS.bankTransactions, updated);
  }, []);

  // ---- Purchase Orders ----
  const addPurchaseOrder = useCallback(
    (po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt">) => {
      const existing = load<PurchaseOrder[]>(KEYS.purchaseOrders, []);
      const num = String(existing.length + 1).padStart(3, "0");
      const year = new Date().getFullYear();
      const newPO: PurchaseOrder = {
        ...po,
        id: generateId(),
        poNumber: `PO-${year}-${num}`,
        createdAt: new Date().toISOString(),
      };
      save(KEYS.purchaseOrders, [...existing, newPO]);
    },
    [],
  );

  const updatePurchaseOrder = useCallback(
    (id: string, po: Partial<PurchaseOrder>) => {
      save(
        KEYS.purchaseOrders,
        load<PurchaseOrder[]>(KEYS.purchaseOrders, []).map((x) =>
          x.id === id ? { ...x, ...po } : x,
        ),
      );
    },
    [],
  );

  const deletePurchaseOrder = useCallback((id: string) => {
    save(
      KEYS.purchaseOrders,
      load<PurchaseOrder[]>(KEYS.purchaseOrders, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- Tax Rates ----
  const addTaxRate = useCallback((tax: Omit<TaxRate, "id">) => {
    save(KEYS.taxes, [
      ...load<TaxRate[]>(KEYS.taxes, []),
      { ...tax, id: generateId() },
    ]);
  }, []);
  const updateTaxRate = useCallback((id: string, tax: Partial<TaxRate>) => {
    save(
      KEYS.taxes,
      load<TaxRate[]>(KEYS.taxes, []).map((t) =>
        t.id === id ? { ...t, ...tax } : t,
      ),
    );
  }, []);
  const deleteTaxRate = useCallback((id: string) => {
    save(
      KEYS.taxes,
      load<TaxRate[]>(KEYS.taxes, []).filter((t) => t.id !== id),
    );
  }, []);

  // ---- Discounts ----
  const addDiscount = useCallback((d: Omit<Discount, "id">) => {
    save(KEYS.discounts, [
      ...load<Discount[]>(KEYS.discounts, []),
      { ...d, id: generateId() },
    ]);
  }, []);
  const updateDiscount = useCallback((id: string, d: Partial<Discount>) => {
    save(
      KEYS.discounts,
      load<Discount[]>(KEYS.discounts, []).map((x) =>
        x.id === id ? { ...x, ...d } : x,
      ),
    );
  }, []);
  const deleteDiscount = useCallback((id: string) => {
    save(
      KEYS.discounts,
      load<Discount[]>(KEYS.discounts, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- Promotions ----
  const addPromotion = useCallback((p: Omit<Promotion, "id">) => {
    save(KEYS.promotions, [
      ...load<Promotion[]>(KEYS.promotions, []),
      { ...p, id: generateId() },
    ]);
  }, []);
  const updatePromotion = useCallback((id: string, p: Partial<Promotion>) => {
    save(
      KEYS.promotions,
      load<Promotion[]>(KEYS.promotions, []).map((x) =>
        x.id === id ? { ...x, ...p } : x,
      ),
    );
  }, []);
  const deletePromotion = useCallback((id: string) => {
    save(
      KEYS.promotions,
      load<Promotion[]>(KEYS.promotions, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- Purchase Requisitions ----
  const addPurchaseRequisition = useCallback(
    (req: Omit<PurchaseRequisition, "id" | "requisitionNo" | "createdAt">) => {
      const existing = load<PurchaseRequisition[]>(
        KEYS.purchaseRequisitions,
        [],
      );
      const num = String(existing.length + 1).padStart(3, "0");
      const year = new Date().getFullYear();
      const newReq: PurchaseRequisition = {
        ...req,
        id: generateId(),
        requisitionNo: `REQ-${year}-${num}`,
        createdAt: new Date().toISOString(),
      };
      save(KEYS.purchaseRequisitions, [...existing, newReq]);
    },
    [],
  );
  const updatePurchaseRequisition = useCallback(
    (id: string, req: Partial<PurchaseRequisition>) => {
      save(
        KEYS.purchaseRequisitions,
        load<PurchaseRequisition[]>(KEYS.purchaseRequisitions, []).map((x) =>
          x.id === id ? { ...x, ...req } : x,
        ),
      );
    },
    [],
  );
  const deletePurchaseRequisition = useCallback((id: string) => {
    save(
      KEYS.purchaseRequisitions,
      load<PurchaseRequisition[]>(KEYS.purchaseRequisitions, []).filter(
        (x) => x.id !== id,
      ),
    );
  }, []);

  // ---- Goods Receipt Notes ----
  const addGoodsReceiptNote = useCallback(
    (grn: Omit<GoodsReceiptNote, "id" | "grnNo" | "createdAt">) => {
      const existing = load<GoodsReceiptNote[]>(KEYS.goodsReceiptNotes, []);
      const num = String(existing.length + 1).padStart(3, "0");
      const year = new Date().getFullYear();
      const newGRN: GoodsReceiptNote = {
        ...grn,
        id: generateId(),
        grnNo: `GRN-${year}-${num}`,
        createdAt: new Date().toISOString(),
      };
      save(KEYS.goodsReceiptNotes, [...existing, newGRN]);
    },
    [],
  );
  const updateGoodsReceiptNote = useCallback(
    (id: string, grn: Partial<GoodsReceiptNote>) => {
      save(
        KEYS.goodsReceiptNotes,
        load<GoodsReceiptNote[]>(KEYS.goodsReceiptNotes, []).map((x) =>
          x.id === id ? { ...x, ...grn } : x,
        ),
      );
    },
    [],
  );
  const deleteGoodsReceiptNote = useCallback((id: string) => {
    save(
      KEYS.goodsReceiptNotes,
      load<GoodsReceiptNote[]>(KEYS.goodsReceiptNotes, []).filter(
        (x) => x.id !== id,
      ),
    );
  }, []);

  // ---- Inventory Transfers ----
  const addInventoryTransfer = useCallback(
    (t: Omit<InventoryTransfer, "id" | "transferNo" | "createdAt">) => {
      const existing = load<InventoryTransfer[]>(KEYS.inventoryTransfers, []);
      const num = String(existing.length + 1).padStart(3, "0");
      const year = new Date().getFullYear();
      const newT: InventoryTransfer = {
        ...t,
        id: generateId(),
        transferNo: `TRF-${year}-${num}`,
        createdAt: new Date().toISOString(),
      };
      save(KEYS.inventoryTransfers, [...existing, newT]);
    },
    [],
  );
  const updateInventoryTransfer = useCallback(
    (id: string, t: Partial<InventoryTransfer>) => {
      save(
        KEYS.inventoryTransfers,
        load<InventoryTransfer[]>(KEYS.inventoryTransfers, []).map((x) =>
          x.id === id ? { ...x, ...t } : x,
        ),
      );
    },
    [],
  );
  const deleteInventoryTransfer = useCallback((id: string) => {
    save(
      KEYS.inventoryTransfers,
      load<InventoryTransfer[]>(KEYS.inventoryTransfers, []).filter(
        (x) => x.id !== id,
      ),
    );
  }, []);

  // ---- Shipments ----
  const addShipment = useCallback(
    (s: Omit<Shipment, "id" | "shipmentNo" | "createdAt">) => {
      const existing = load<Shipment[]>(KEYS.shipments, []);
      const num = String(existing.length + 1).padStart(3, "0");
      const year = new Date().getFullYear();
      const newS: Shipment = {
        ...s,
        id: generateId(),
        shipmentNo: `SHP-${year}-${num}`,
        createdAt: new Date().toISOString(),
      };
      save(KEYS.shipments, [...existing, newS]);
    },
    [],
  );
  const updateShipment = useCallback((id: string, s: Partial<Shipment>) => {
    save(
      KEYS.shipments,
      load<Shipment[]>(KEYS.shipments, []).map((x) =>
        x.id === id ? { ...x, ...s } : x,
      ),
    );
  }, []);
  const deleteShipment = useCallback((id: string) => {
    save(
      KEYS.shipments,
      load<Shipment[]>(KEYS.shipments, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- Logs ----

  // ---- Departments ----
  const addDepartment = useCallback((dept: Omit<Department, "id">) => {
    const newDept = { ...dept, id: generateId() };
    save(KEYS.departments, [
      ...load<Department[]>(KEYS.departments, []),
      newDept,
    ]);
  }, []);
  const updateDepartment = useCallback(
    (id: string, dept: Partial<Department>) => {
      save(
        KEYS.departments,
        load<Department[]>(KEYS.departments, []).map((x) =>
          x.id === id ? { ...x, ...dept } : x,
        ),
      );
    },
    [],
  );
  const deleteDepartment = useCallback((id: string) => {
    save(
      KEYS.departments,
      load<Department[]>(KEYS.departments, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- Designations ----
  const addDesignation = useCallback((desig: Omit<Designation, "id">) => {
    const newDesig = { ...desig, id: generateId() };
    save(KEYS.designations, [
      ...load<Designation[]>(KEYS.designations, []),
      newDesig,
    ]);
  }, []);
  const updateDesignation = useCallback(
    (id: string, desig: Partial<Designation>) => {
      save(
        KEYS.designations,
        load<Designation[]>(KEYS.designations, []).map((x) =>
          x.id === id ? { ...x, ...desig } : x,
        ),
      );
    },
    [],
  );
  const deleteDesignation = useCallback((id: string) => {
    save(
      KEYS.designations,
      load<Designation[]>(KEYS.designations, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- AllowanceTypes ----
  const addAllowanceType = useCallback((a: Omit<AllowanceType, "id">) => {
    const newA = { ...a, id: generateId() };
    save(KEYS.allowanceTypes, [
      ...load<AllowanceType[]>(KEYS.allowanceTypes, []),
      newA,
    ]);
  }, []);
  const updateAllowanceType = useCallback(
    (id: string, a: Partial<AllowanceType>) => {
      save(
        KEYS.allowanceTypes,
        load<AllowanceType[]>(KEYS.allowanceTypes, []).map((x) =>
          x.id === id ? { ...x, ...a } : x,
        ),
      );
    },
    [],
  );
  const deleteAllowanceType = useCallback((id: string) => {
    save(
      KEYS.allowanceTypes,
      load<AllowanceType[]>(KEYS.allowanceTypes, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- Shifts ----
  const addShift = useCallback((s: Omit<Shift, "id">) => {
    const newS = { ...s, id: generateId() };
    save(KEYS.shifts, [...load<Shift[]>(KEYS.shifts, []), newS]);
  }, []);
  const updateShift = useCallback((id: string, s: Partial<Shift>) => {
    save(
      KEYS.shifts,
      load<Shift[]>(KEYS.shifts, []).map((x) =>
        x.id === id ? { ...x, ...s } : x,
      ),
    );
  }, []);
  const deleteShift = useCallback((id: string) => {
    save(
      KEYS.shifts,
      load<Shift[]>(KEYS.shifts, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- ShiftAssignments ----
  const addShiftAssignment = useCallback(
    (a: Omit<EmployeeShiftAssignment, "id">) => {
      const newA = { ...a, id: generateId() };
      save(KEYS.shiftAssignments, [
        ...load<EmployeeShiftAssignment[]>(KEYS.shiftAssignments, []),
        newA,
      ]);
    },
    [],
  );
  const updateShiftAssignment = useCallback(
    (id: string, a: Partial<EmployeeShiftAssignment>) => {
      save(
        KEYS.shiftAssignments,
        load<EmployeeShiftAssignment[]>(KEYS.shiftAssignments, []).map((x) =>
          x.id === id ? { ...x, ...a } : x,
        ),
      );
    },
    [],
  );
  const deleteShiftAssignment = useCallback((id: string) => {
    save(
      KEYS.shiftAssignments,
      load<EmployeeShiftAssignment[]>(KEYS.shiftAssignments, []).filter(
        (x) => x.id !== id,
      ),
    );
  }, []);

  // ---- ShiftClosings ----
  const addShiftClosing = useCallback((sc: Omit<ShiftClosing, "id">) => {
    const newSC = { ...sc, id: generateId() };
    save(KEYS.shiftClosings, [
      ...load<ShiftClosing[]>(KEYS.shiftClosings, []),
      newSC,
    ]);
  }, []);
  const updateShiftClosing = useCallback(
    (id: string, sc: Partial<ShiftClosing>) => {
      save(
        KEYS.shiftClosings,
        load<ShiftClosing[]>(KEYS.shiftClosings, []).map((x) =>
          x.id === id ? { ...x, ...sc } : x,
        ),
      );
    },
    [],
  );
  const deleteShiftClosing = useCallback((id: string) => {
    save(
      KEYS.shiftClosings,
      load<ShiftClosing[]>(KEYS.shiftClosings, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- SalarySlips ----
  const addSalarySlip = useCallback((slip: Omit<SalarySlip, "id">) => {
    const newSlip = { ...slip, id: generateId() };
    save(KEYS.salarySlips, [
      ...load<SalarySlip[]>(KEYS.salarySlips, []),
      newSlip,
    ]);
  }, []);
  const updateSalarySlip = useCallback(
    (id: string, slip: Partial<SalarySlip>) => {
      save(
        KEYS.salarySlips,
        load<SalarySlip[]>(KEYS.salarySlips, []).map((x) =>
          x.id === id ? { ...x, ...slip } : x,
        ),
      );
    },
    [],
  );
  const deleteSalarySlip = useCallback((id: string) => {
    save(
      KEYS.salarySlips,
      load<SalarySlip[]>(KEYS.salarySlips, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- ItemCategories ----
  const addItemCategory = useCallback((cat: Omit<ItemCategory, "id">) => {
    const newCat = { ...cat, id: generateId() };
    save(KEYS.itemCategories, [
      ...load<ItemCategory[]>(KEYS.itemCategories, []),
      newCat,
    ]);
  }, []);
  const updateItemCategory = useCallback(
    (id: string, cat: Partial<ItemCategory>) => {
      save(
        KEYS.itemCategories,
        load<ItemCategory[]>(KEYS.itemCategories, []).map((x) =>
          x.id === id ? { ...x, ...cat } : x,
        ),
      );
    },
    [],
  );
  const deleteItemCategory = useCallback((id: string) => {
    save(
      KEYS.itemCategories,
      load<ItemCategory[]>(KEYS.itemCategories, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- ItemBrands ----
  const addItemBrand = useCallback((brand: Omit<ItemBrand, "id">) => {
    const newBrand = { ...brand, id: generateId() };
    save(KEYS.itemBrands, [
      ...load<ItemBrand[]>(KEYS.itemBrands, []),
      newBrand,
    ]);
  }, []);
  const updateItemBrand = useCallback(
    (id: string, brand: Partial<ItemBrand>) => {
      save(
        KEYS.itemBrands,
        load<ItemBrand[]>(KEYS.itemBrands, []).map((x) =>
          x.id === id ? { ...x, ...brand } : x,
        ),
      );
    },
    [],
  );
  const deleteItemBrand = useCallback((id: string) => {
    save(
      KEYS.itemBrands,
      load<ItemBrand[]>(KEYS.itemBrands, []).filter((x) => x.id !== id),
    );
  }, []);

  // ---- ItemUnits ----
  const addItemUnit = useCallback((unit: Omit<ItemUnit, "id">) => {
    const newUnit = { ...unit, id: generateId() };
    save(KEYS.itemUnits, [...load<ItemUnit[]>(KEYS.itemUnits, []), newUnit]);
  }, []);
  const updateItemUnit = useCallback((id: string, unit: Partial<ItemUnit>) => {
    save(
      KEYS.itemUnits,
      load<ItemUnit[]>(KEYS.itemUnits, []).map((x) =>
        x.id === id ? { ...x, ...unit } : x,
      ),
    );
  }, []);
  const deleteItemUnit = useCallback((id: string) => {
    save(
      KEYS.itemUnits,
      load<ItemUnit[]>(KEYS.itemUnits, []).filter((x) => x.id !== id),
    );
  }, []);

  const addLog = useCallback(
    (module: string, action: Log["action"], details: string) => {
      _log(module, action, details);
    },
    [_log],
  );
  const clearLogs = useCallback(() => {
    save(KEYS.logs, []);
  }, []);

  return {
    ...state,
    addRole,
    updateRole,
    deleteRole,
    addCompany,
    updateCompany,
    deleteCompany,
    addUser,
    updateUser,
    deleteUser,
    addAccount,
    updateAccount,
    deleteAccount,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addShop,
    updateShop,
    deleteShop,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addPayroll,
    updatePayroll,
    deletePayroll,
    addItem,
    updateItem,
    deleteItem,
    adjustStock,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPaymentMode,
    updatePaymentMode,
    deletePaymentMode,
    addSale,
    updateSale,
    deleteSale,
    addPurchase,
    updatePurchase,
    deletePurchase,
    addPayment,
    deletePayment,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addExpense,
    updateExpense,
    deleteExpense,
    updateSettings,
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    addLog,
    clearLogs,
    addBankTransaction,
    updateBankTransaction,
    deleteBankTransaction,
    toggleBankTransactionReconciled,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
    addDiscount,
    updateDiscount,
    deleteDiscount,
    addPromotion,
    updatePromotion,
    deletePromotion,
    addPurchaseRequisition,
    updatePurchaseRequisition,
    deletePurchaseRequisition,
    addGoodsReceiptNote,
    updateGoodsReceiptNote,
    deleteGoodsReceiptNote,
    addInventoryTransfer,
    updateInventoryTransfer,
    deleteInventoryTransfer,
    addShipment,
    updateShipment,
    deleteShipment,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addDesignation,
    updateDesignation,
    deleteDesignation,
    addAllowanceType,
    updateAllowanceType,
    deleteAllowanceType,
    addShift,
    updateShift,
    deleteShift,
    addShiftAssignment,
    updateShiftAssignment,
    deleteShiftAssignment,
    addShiftClosing,
    updateShiftClosing,
    deleteShiftClosing,
    addSalarySlip,
    updateSalarySlip,
    deleteSalarySlip,
    addItemCategory,
    updateItemCategory,
    deleteItemCategory,
    addItemBrand,
    updateItemBrand,
    deleteItemBrand,
    addItemUnit,
    updateItemUnit,
    deleteItemUnit,
    addStockMovement,
    stockMovements: state.stockMovements,
  };
}
