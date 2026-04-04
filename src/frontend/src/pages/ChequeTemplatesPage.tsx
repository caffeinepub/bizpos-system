import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Bank {
  id: string;
  name: string;
}

export interface TemplateField {
  fieldName: string;
  prefix: string;
  postfix: string;
  fieldSize: number;
  fieldWidth: number;
  xAxis: number;
  yAxis: number;
}

export interface ChequeTemplate {
  id: string;
  name: string;
  bankId: string;
  chequeHeightInches: number;
  chequeWidthInches: number;
  fields: TemplateField[];
}

const DEFAULT_FIELD_NAMES = ["Amount", "Date", "Payee", "Rupees", "Bearer"];

function makeDefaultFields(): TemplateField[] {
  return DEFAULT_FIELD_NAMES.map((name) => ({
    fieldName: name,
    prefix: "",
    postfix: "",
    fieldSize: 10,
    fieldWidth: 50,
    xAxis: 20,
    yAxis: 20,
  }));
}

function emptyTemplate(): ChequeTemplate {
  return {
    id: "",
    name: "",
    bankId: "",
    chequeHeightInches: 3,
    chequeWidthInches: 8,
    fields: makeDefaultFields(),
  };
}

const LS_TEMPLATES = "bizpos_cheque_templates";
const LS_BANKS = "bizpos_banks";

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function save<T>(key: string, d: T[]) {
  localStorage.setItem(key, JSON.stringify(d));
}

function loadTemplates(): ChequeTemplate[] {
  const stored = localStorage.getItem(LS_TEMPLATES);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    // Migrate old format if needed
    return parsed.map((t: any) => {
      if (Array.isArray(t.fields)) return t as ChequeTemplate;
      // old format — convert to new
      return {
        id: t.id,
        name: t.name,
        bankId: t.bankId || "",
        chequeHeightInches: t.chequeHeight ? t.chequeHeight / 25.4 : 3,
        chequeWidthInches: t.chequeWidth ? t.chequeWidth / 25.4 : 8,
        fields: makeDefaultFields(),
      } as ChequeTemplate;
    });
  } catch {
    return [];
  }
}

export default function ChequeTemplatesPage() {
  const [templates, setTemplates] = useState<ChequeTemplate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ChequeTemplate>(emptyTemplate());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(loadTemplates());
    setBanks(load<Bank>(LS_BANKS));
  }, []);

  function openNew() {
    setForm(emptyTemplate());
    setDialogOpen(true);
  }

  function openEdit(t: ChequeTemplate) {
    setForm(JSON.parse(JSON.stringify(t)));
    setDialogOpen(true);
  }

  function saveTemplate() {
    if (!form.name.trim()) return;
    let updated: ChequeTemplate[];
    if (form.id && templates.find((t) => t.id === form.id)) {
      updated = templates.map((t) => (t.id === form.id ? form : t));
    } else {
      const newT = { ...form, id: `ct${Date.now()}` };
      updated = [...templates, newT];
    }
    save(LS_TEMPLATES, updated);
    setTemplates(updated);
    setDialogOpen(false);
  }

  function delTemplate(id: string) {
    const u = templates.filter((t) => t.id !== id);
    save(LS_TEMPLATES, u);
    setTemplates(u);
    setDeleteId(null);
  }

  function updateField(idx: number, patch: Partial<TemplateField>) {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((fld, i) =>
        i === idx ? { ...fld, ...patch } : fld,
      ),
    }));
  }

  const bankName = (id: string) => banks.find((b) => b.id === id)?.name || "—";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cheque Templates</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Template list */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-1">No cheque templates yet</p>
            <p className="text-sm">
              Click "New Template" to create your first template.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Template Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Bank
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Size (W × H inches)
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Fields
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {bankName(t.bankId)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.chequeWidthInches}″ × {t.chequeHeightInches}″
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {Array.isArray(t.fields)
                      ? t.fields.map((f) => f.fieldName).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(t)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[92vw] xl:max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              {form.id ? "Edit Cheque Template" : "Add Cheque Template"}
            </DialogTitle>
          </DialogHeader>

          {/* Header fields */}
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. HBL Standard Template"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.bankId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, bankId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select Bank —</SelectItem>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Cheque Height (inches)
              </Label>
              <Input
                type="number"
                className="mt-1"
                value={form.chequeHeightInches}
                onChange={(e) =>
                  setForm({
                    ...form,
                    chequeHeightInches: Number.parseFloat(e.target.value) || 0,
                  })
                }
                step="0.1"
                min="1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Cheque Width (inches)
              </Label>
              <Input
                type="number"
                className="mt-1"
                value={form.chequeWidthInches}
                onChange={(e) =>
                  setForm({
                    ...form,
                    chequeWidthInches: Number.parseFloat(e.target.value) || 0,
                  })
                }
                step="0.1"
                min="1"
              />
            </div>
          </div>

          {/* Template Details Table */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Template Details
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Sr# No.
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field Prefix
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field Name
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field Postfix
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field Size
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field Width
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field X-Axis
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Field Y-Axis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {form.fields.map((fld, idx) => (
                    <tr key={fld.fieldName} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={fld.prefix}
                          onChange={(e) =>
                            updateField(idx, { prefix: e.target.value })
                          }
                          className="h-8 w-20 text-xs"
                          placeholder="prefix"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-gray-800 font-medium whitespace-nowrap">
                          {fld.fieldName}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={fld.postfix}
                          onChange={(e) =>
                            updateField(idx, { postfix: e.target.value })
                          }
                          className="h-8 w-20 text-xs"
                          placeholder="postfix"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={fld.fieldSize}
                          onChange={(e) =>
                            updateField(idx, {
                              fieldSize: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-20 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={fld.fieldWidth}
                          onChange={(e) =>
                            updateField(idx, {
                              fieldWidth: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-20 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={fld.xAxis}
                          onChange={(e) =>
                            updateField(idx, {
                              xAxis: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-20 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={fld.yAxis}
                          onChange={(e) =>
                            updateField(idx, {
                              yAxis: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-20 text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={saveTemplate}
              disabled={!form.name.trim()}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this cheque template?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => delTemplate(deleteId!)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
