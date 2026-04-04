import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Link2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Account, AccountMapping } from "../store/useStore";
import { useStore } from "../store/useStore";

import PageHelp from "@/components/PageHelp";

interface MappingField {
  key: keyof AccountMapping;
  label: string;
  description: string;
  types: Account["type"][];
}

const MAPPING_FIELDS: MappingField[] = [
  {
    key: "cashAccountId",
    label: "Cash Account",
    description: "Default cash account for sales, payments, and expenses",
    types: ["Asset"],
  },
  {
    key: "bankAccountId",
    label: "Bank Account",
    description: "Default bank account for bank transactions",
    types: ["Asset"],
  },
  {
    key: "accountsReceivableId",
    label: "Accounts Receivable",
    description: "For credit sales — amount owed by customers",
    types: ["Asset"],
  },
  {
    key: "accountsPayableId",
    label: "Accounts Payable",
    description: "For purchases — amount owed to suppliers",
    types: ["Liability"],
  },
  {
    key: "inventoryAssetId",
    label: "Inventory Asset",
    description: "Stock in hand — debited on purchase, credited on COGS",
    types: ["Asset"],
  },
  {
    key: "cogsAccountId",
    label: "Cost of Goods Sold (COGS)",
    description: "Cost of items sold — debited when a sale is recorded",
    types: ["COGS"],
  },
  {
    key: "salesRevenueId",
    label: "Sales Revenue",
    description: "Default revenue account — credited on every sale",
    types: ["Income"],
  },
  {
    key: "salesTaxPayableId",
    label: "Sales Tax Payable",
    description: "Tax collected on sales, owed to tax authority",
    types: ["Liability"],
  },
  {
    key: "salaryExpenseId",
    label: "Salary Expense",
    description: "Employee salaries — debited on payroll finalization",
    types: ["Expense"],
  },
  {
    key: "salaryPayableId",
    label: "Salary Payable",
    description:
      "Salaries owed to employees — credited on payroll finalization",
    types: ["Liability"],
  },
];

const DEFAULTS: AccountMapping = {
  cashAccountId: "acc-100-02-01-0002",
  bankAccountId: "acc-100-02-02-0001",
  accountsReceivableId: "acc-100-02-04",
  accountsPayableId: "acc-300-02-01-0001",
  inventoryAssetId: "acc-100-02-03",
  cogsAccountId: "acc-500-01-01",
  salesRevenueId: "acc-400-01-01-0001",
  salesTaxPayableId: "acc-300-02-01-0003",
  salaryExpenseId: "acc-600-01-01-0001",
  salaryPayableId: "acc-300-02-01-0002",
};

export default function AccountMappingPage() {
  const { accounts, accountMapping, saveAccountMapping } = useStore();
  const [mapping, setMapping] = useState<AccountMapping>(
    accountMapping || DEFAULTS,
  );

  useEffect(() => {
    if (accountMapping) setMapping(accountMapping);
  }, [accountMapping]);

  // Only leaf (non-group) accounts, filtered by type
  const getLeafAccounts = (types: Account["type"][]) =>
    accounts
      .filter(
        (a) => !a.isGroup && a.status === "Active" && types.includes(a.type),
      )
      .sort((a, b) => a.code.localeCompare(b.code));

  const handleSave = () => {
    saveAccountMapping(mapping);
    toast.success("Account mapping saved successfully");
  };

  const handleReset = () => {
    setMapping(DEFAULTS);
    toast.info("Mapping reset to defaults (not saved yet)");
  };

  const typeColor: Record<Account["type"], string> = {
    Asset: "text-blue-600 bg-blue-50",
    Liability: "text-orange-600 bg-orange-50",
    Equity: "text-purple-600 bg-purple-50",
    Income: "text-green-600 bg-green-50",
    Expense: "text-red-600 bg-red-50",
    COGS: "text-yellow-700 bg-yellow-50",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="h-7 w-7 text-blue-600" />
              Account Mapping
            </h1>
            <PageHelp pageId="account-mapping" />
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Map each financial transaction type to the correct Chart of Accounts
            entry. These mappings drive automatic journal entry generation
            across all modules.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            data-ocid="account_mapping.secondary_button"
          >
            Reset Defaults
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            data-ocid="account_mapping.save_button"
          >
            <Save className="h-4 w-4 mr-2" /> Save Mapping
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            How It Works
          </CardTitle>
          <CardDescription>
            When a sale, purchase, payment, expense, payroll, or bank
            transaction is recorded, BizPOS automatically creates a double-entry
            journal entry using the accounts mapped below. Changes take effect
            immediately for new transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {(
              [
                ["Sale (Cash)", "Dr Cash → Cr Sales Revenue + Tax Payable"],
                ["Sale (Credit)", "Dr A/R → Cr Sales Revenue + Tax Payable"],
                ["COGS on Sale", "Dr COGS → Cr Inventory Asset"],
                ["Purchase Received", "Dr Inventory → Cr Accounts Payable"],
                ["Payment Received", "Dr Cash → Cr Accounts Receivable"],
                ["Expense", "Dr Expense Account → Cr Cash"],
                ["Payroll Finalized", "Dr Salary Expense → Cr Salary Payable"],
                ["Bank Deposit (Credit)", "Dr Bank → Cr Cash"],
                ["Bank Withdrawal (Debit)", "Dr Cash → Cr Bank"],
              ] as [string, string][]
            ).map(([tx, entry]) => (
              <div key={tx} className="bg-gray-50 rounded p-2">
                <p className="font-semibold text-gray-700">{tx}</p>
                <p className="text-gray-500 mt-0.5">{entry}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Account Assignments</CardTitle>
          <CardDescription>
            Select the leaf account for each role. Only active, non-group
            accounts are shown, filtered by account type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MAPPING_FIELDS.map((field, idx) => {
            const leafAccounts = getLeafAccounts(field.types);
            const selectedAcc = accounts.find(
              (a) => a.id === mapping[field.key],
            );
            return (
              <div key={field.key}>
                {idx > 0 && <Separator className="mb-6" />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{field.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {field.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.types.map((t) => (
                        <span
                          key={t}
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            typeColor[t] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={mapping[field.key] || "none"}
                      onValueChange={(v) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field.key]: v === "none" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger data-ocid="account_mapping.select">
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Select Account —</SelectItem>
                        {leafAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            <span className="font-mono text-xs text-gray-400 mr-2">
                              {acc.code}
                            </span>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAcc && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {selectedAcc.code}
                        </span>
                        <span>{selectedAcc.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full ${
                            typeColor[selectedAcc.type] ?? ""
                          }`}
                        >
                          {selectedAcc.type}
                        </span>
                      </div>
                    )}
                    {!mapping[field.key] && (
                      <p className="text-xs text-amber-600">
                        ⚠ No account selected — transactions may not post
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              data-ocid="account_mapping.cancel_button"
            >
              Reset Defaults
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
              data-ocid="account_mapping.submit_button"
            >
              <Save className="h-4 w-4 mr-2" /> Save Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
