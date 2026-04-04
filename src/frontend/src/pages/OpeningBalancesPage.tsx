import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

interface OpeningBalance {
  entityId: string;
  entityType: "account" | "customer" | "supplier";
  amount: number;
  date: string;
}

const STORAGE_KEY = "bizpos_opening_balances";
function load(): OpeningBalance[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveAll(data: OpeningBalance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function OpeningBalancesPage() {
  const { accounts, customers, suppliers } = useStore();
  const [data, setData] = useState<OpeningBalance[]>(load);

  const leafAccounts = accounts.filter((a) => !a.isGroup);

  const get = (entityId: string, entityType: OpeningBalance["entityType"]) =>
    data.find(
      (d) => d.entityId === entityId && d.entityType === entityType,
    ) ?? {
      entityId,
      entityType,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
    };

  const update = (
    entityId: string,
    entityType: OpeningBalance["entityType"],
    field: "amount" | "date",
    value: string | number,
  ) => {
    setData((prev) => {
      const exists = prev.find(
        (d) => d.entityId === entityId && d.entityType === entityType,
      );
      if (exists) {
        return prev.map((d) =>
          d.entityId === entityId && d.entityType === entityType
            ? { ...d, [field]: value }
            : d,
        );
      }
      return [
        ...prev,
        {
          entityId,
          entityType,
          amount: field === "amount" ? Number(value) : 0,
          date:
            field === "date"
              ? String(value)
              : new Date().toISOString().slice(0, 10),
        },
      ];
    });
  };

  const handleSaveAll = () => {
    const toSave = data.filter((d) => d.amount !== 0);
    saveAll(toSave);
    // Update COA account balances for account-type entries
    try {
      const coaAccounts = JSON.parse(
        localStorage.getItem("bizpos_accounts_v3") || "[]",
      );
      const updatedAccounts = coaAccounts.map(
        (acc: {
          id: string;
          openingBalance: number;
          currentBalance: number;
        }) => {
          const ob = toSave.find(
            (d) => d.entityId === acc.id && d.entityType === "account",
          );
          if (ob) {
            return {
              ...acc,
              openingBalance: ob.amount,
              currentBalance: ob.amount,
            };
          }
          return acc;
        },
      );
      localStorage.setItem(
        "bizpos_accounts_v3",
        JSON.stringify(updatedAccounts),
      );
    } catch {
      /* ignore */
    }
    toast.success("Opening balances saved");
  };

  const downloadTemplate = () => {
    const header = "EntityType,EntityID,EntityName,OpeningBalance,Date\n";
    const rows = [
      ...leafAccounts.map(
        (a) =>
          `account,${a.id},${a.name},0,${new Date().toISOString().slice(0, 10)}`,
      ),
      ...customers.map(
        (c) =>
          `customer,${c.id},${c.name},0,${new Date().toISOString().slice(0, 10)}`,
      ),
      ...suppliers.map(
        (s) =>
          `supplier,${s.id},${s.name},0,${new Date().toISOString().slice(0, 10)}`,
      ),
    ];
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opening-balances-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opening Balances</h1>
          <p className="text-gray-600 mt-1">
            Set opening balances before recording any transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={handleSaveAll}
            data-ocid="opening_balances.save_button"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
        ⚠️ <strong>Important:</strong> Opening balances should be set before
        recording any transactions. Changes after transactions may cause ledger
        imbalances.
      </div>

      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="accounts">
            <TabsList className="mb-4">
              <TabsTrigger value="accounts" data-ocid="opening_balances.tab">
                COA Accounts ({leafAccounts.length})
              </TabsTrigger>
              <TabsTrigger value="customers" data-ocid="opening_balances.tab">
                Customers ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="suppliers" data-ocid="opening_balances.tab">
                Suppliers ({suppliers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accounts">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>As of Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leafAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                        data-ocid="opening_balances.empty_state"
                      >
                        No leaf accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leafAccounts.map((acc, i) => {
                      const bal = get(acc.id, "account");
                      return (
                        <TableRow
                          key={acc.id}
                          data-ocid={`opening_balances.item.${i + 1}`}
                        >
                          <TableCell className="font-mono text-sm">
                            {acc.code}
                          </TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell>{acc.type}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={bal.amount}
                              onChange={(e) =>
                                update(
                                  acc.id,
                                  "account",
                                  "amount",
                                  Number(e.target.value),
                                )
                              }
                              className="w-32"
                              data-ocid="opening_balances.input"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={bal.date}
                              onChange={(e) =>
                                update(
                                  acc.id,
                                  "account",
                                  "date",
                                  e.target.value,
                                )
                              }
                              className="w-36"
                              data-ocid="opening_balances.input"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="customers">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>As of Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c, i) => {
                    const bal = get(c.id, "customer");
                    return (
                      <TableRow
                        key={c.id}
                        data-ocid={`opening_balances.item.${i + 1}`}
                      >
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={bal.amount}
                            onChange={(e) =>
                              update(
                                c.id,
                                "customer",
                                "amount",
                                Number(e.target.value),
                              )
                            }
                            className="w-32"
                            data-ocid="opening_balances.input"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={bal.date}
                            onChange={(e) =>
                              update(c.id, "customer", "date", e.target.value)
                            }
                            className="w-36"
                            data-ocid="opening_balances.input"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="suppliers">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>As of Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s, i) => {
                    const bal = get(s.id, "supplier");
                    return (
                      <TableRow
                        key={s.id}
                        data-ocid={`opening_balances.item.${i + 1}`}
                      >
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.phone}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={bal.amount}
                            onChange={(e) =>
                              update(
                                s.id,
                                "supplier",
                                "amount",
                                Number(e.target.value),
                              )
                            }
                            className="w-32"
                            data-ocid="opening_balances.input"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={bal.date}
                            onChange={(e) =>
                              update(s.id, "supplier", "date", e.target.value)
                            }
                            className="w-36"
                            data-ocid="opening_balances.input"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
