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
import { Copy, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Bank {
  id: string;
  name: string;
}

interface FieldConfig {
  x: number;
  y: number;
  w?: number;
  fontSize?: number;
}
interface ChequeTemplate {
  id: string;
  name: string;
  bankId: string;
  chequeWidth: number;
  chequeHeight: number;
  bgColor: string;
  fields: {
    payeeName: FieldConfig & { w: number; fontSize: number };
    amountWords: FieldConfig & { w: number; fontSize: number };
    amountNumbers: FieldConfig & { fontSize: number };
    date: FieldConfig & { fontSize: number };
    accountNumber: FieldConfig & { fontSize: number };
    bankName: FieldConfig & { fontSize: number };
    signatureLine: FieldConfig & { w: number };
    memo: FieldConfig & { w: number; fontSize: number };
  };
}

const defaultTemplate: Omit<ChequeTemplate, "id" | "name" | "bankId"> = {
  chequeWidth: 176,
  chequeHeight: 83,
  bgColor: "#ffffff",
  fields: {
    payeeName: { x: 30, y: 28, w: 100, fontSize: 11 },
    amountWords: { x: 30, y: 42, w: 120, fontSize: 10 },
    amountNumbers: { x: 145, y: 35, fontSize: 12 },
    date: { x: 130, y: 20, fontSize: 10 },
    accountNumber: { x: 30, y: 55, fontSize: 9 },
    bankName: { x: 30, y: 15, fontSize: 9 },
    signatureLine: { x: 110, y: 70, w: 55 },
    memo: { x: 30, y: 65, w: 70, fontSize: 9 },
  },
};

const SEED_TEMPLATE: ChequeTemplate = {
  id: "ct1",
  name: "Standard Cheque Layout",
  bankId: "b1",
  ...defaultTemplate,
};

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
  if (!stored) {
    localStorage.setItem(LS_TEMPLATES, JSON.stringify([SEED_TEMPLATE]));
    return [SEED_TEMPLATE];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

type FieldKey = keyof ChequeTemplate["fields"];
const FIELD_DEFS: { key: FieldKey; label: string; hasW: boolean }[] = [
  { key: "payeeName", label: "Payee Name", hasW: true },
  { key: "amountWords", label: "Amount in Words", hasW: true },
  { key: "amountNumbers", label: "Amount (Numbers)", hasW: false },
  { key: "date", label: "Date", hasW: false },
  { key: "accountNumber", label: "Account Number", hasW: false },
  { key: "bankName", label: "Bank Name", hasW: false },
  { key: "signatureLine", label: "Signature Line", hasW: true },
  { key: "memo", label: "Memo / Remarks", hasW: true },
];

function emptyForm(name = "", bankId = ""): ChequeTemplate {
  return {
    id: "",
    name,
    bankId,
    ...JSON.parse(JSON.stringify(defaultTemplate)),
  };
}

export default function ChequeTemplatesPage() {
  const [templates, setTemplates] = useState<ChequeTemplate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState<ChequeTemplate>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(loadTemplates());
    setBanks(load<Bank>(LS_BANKS));
  }, []);

  function selectTemplate(t: ChequeTemplate) {
    setForm(JSON.parse(JSON.stringify(t)));
  }
  function newTemplate() {
    setForm(emptyForm());
  }

  function setField<K extends FieldKey>(
    key: K,
    prop: string,
    value: number | string,
  ) {
    setForm((f) => ({
      ...f,
      fields: {
        ...f.fields,
        [key]: {
          ...f.fields[key],
          [prop]: typeof value === "string" ? value : Number(value),
        },
      },
    }));
  }

  function saveTemplate() {
    if (!form.name) return;
    let updated: ChequeTemplate[];
    if (form.id && templates.find((t) => t.id === form.id)) {
      updated = templates.map((t) => (t.id === form.id ? form : t));
    } else {
      const newT = { ...form, id: `ct${Date.now()}` };
      updated = [...templates, newT];
      setForm(newT);
    }
    save(LS_TEMPLATES, updated);
    setTemplates(updated);
  }

  function delTemplate(id: string) {
    const u = templates.filter((t) => t.id !== id);
    save(LS_TEMPLATES, u);
    setTemplates(u);
    if (form.id === id) setForm(emptyForm());
    setDeleteId(null);
  }

  function duplicate(t: ChequeTemplate) {
    const newT: ChequeTemplate = {
      ...JSON.parse(JSON.stringify(t)),
      id: `ct${Date.now()}`,
      name: `${t.name} (Copy)`,
    };
    const updated = [...templates, newT];
    save(LS_TEMPLATES, updated);
    setTemplates(updated);
  }

  // Preview scale: fit into 600px max width
  const PREVIEW_MAX_W = 560;
  const scale = PREVIEW_MAX_W / form.chequeWidth;
  const previewH = form.chequeHeight * scale;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Cheque Templates
      </h1>
      <div className="flex gap-6">
        {/* Left: template list */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm text-gray-700">
                Templates
              </span>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-7 px-2"
                onClick={newTemplate}
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
            <div className="divide-y">
              {templates.length === 0 && (
                <p className="text-center py-6 text-sm text-gray-400">
                  No templates
                </p>
              )}
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${form.id === t.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") selectTemplate(t);
                  }}
                  onClick={() => selectTemplate(t)}
                >
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.chequeWidth}×{t.chequeHeight} mm
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicate(t);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(t.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: configurator */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">
                {form.id ? "Edit Template" : "New Template"}
              </h2>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
                onClick={saveTemplate}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Template
              </Button>
            </div>

            {/* Section A: Dimensions */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-1 border-b">
                A. Cheque Dimensions & Settings
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. HBL Standard"
                  />
                </div>
                <div>
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={form.chequeWidth}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        chequeWidth: Number.parseFloat(e.target.value) || 176,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={form.chequeHeight}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        chequeHeight: Number.parseFloat(e.target.value) || 83,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Background Color</Label>
                  <input
                    type="color"
                    value={form.bgColor}
                    onChange={(e) =>
                      setForm({ ...form, bgColor: e.target.value })
                    }
                    className="w-full h-9 rounded border cursor-pointer"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Bank (optional)</Label>
                  <Select
                    value={form.bankId}
                    onValueChange={(v) => setForm({ ...form, bankId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section B: Field Positions */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-1 border-b">
                B. Field Positions (all values in mm / pt)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs">
                      <th className="text-left py-2 pr-4 font-medium">Field</th>
                      <th className="text-left py-2 pr-4 font-medium">
                        X (mm)
                      </th>
                      <th className="text-left py-2 pr-4 font-medium">
                        Y (mm)
                      </th>
                      <th className="text-left py-2 pr-4 font-medium">
                        Width (mm)
                      </th>
                      <th className="text-left py-2 font-medium">
                        Font Size (pt)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIELD_DEFS.map((fd) => {
                      const f = form.fields[fd.key] as FieldConfig & {
                        w?: number;
                        fontSize?: number;
                      };
                      return (
                        <tr key={fd.key} className="border-t">
                          <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">
                            {fd.label}
                          </td>
                          <td className="py-1 pr-2">
                            <Input
                              type="number"
                              value={f.x}
                              onChange={(e) =>
                                setField(fd.key, "x", e.target.value)
                              }
                              className="w-20 h-8"
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <Input
                              type="number"
                              value={f.y}
                              onChange={(e) =>
                                setField(fd.key, "y", e.target.value)
                              }
                              className="w-20 h-8"
                            />
                          </td>
                          <td className="py-1 pr-2">
                            {fd.hasW ? (
                              <Input
                                type="number"
                                value={(f as any).w || 0}
                                onChange={(e) =>
                                  setField(fd.key, "w", e.target.value)
                                }
                                className="w-20 h-8"
                              />
                            ) : (
                              <span className="text-gray-300 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="py-1">
                            {fd.key !== "signatureLine" ? (
                              <Input
                                type="number"
                                value={(f as any).fontSize || 10}
                                onChange={(e) =>
                                  setField(fd.key, "fontSize", e.target.value)
                                }
                                className="w-20 h-8"
                              />
                            ) : (
                              <span className="text-gray-300 text-xs">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section C: Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-1 border-b">
                C. Preview (scaled)
              </h3>
              <div className="overflow-x-auto">
                <div
                  style={{
                    width: PREVIEW_MAX_W,
                    height: previewH,
                    backgroundColor: form.bgColor,
                    position: "relative",
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {FIELD_DEFS.map((fd) => {
                    const f = form.fields[fd.key] as FieldConfig & {
                      w?: number;
                      fontSize?: number;
                    };
                    const px = f.x * scale;
                    const py = f.y * scale;
                    const pw = (f as any).w ? (f as any).w * scale : undefined;
                    if (fd.key === "signatureLine") {
                      return (
                        <div
                          key={fd.key}
                          style={{
                            position: "absolute",
                            left: px,
                            top: py,
                            width: pw || 60,
                            height: 1,
                            backgroundColor: "#374151",
                          }}
                          title="Signature Line"
                        />
                      );
                    }
                    return (
                      <div
                        key={fd.key}
                        style={{
                          position: "absolute",
                          left: px,
                          top: py,
                          maxWidth: pw,
                          fontSize: Math.max(
                            6,
                            ((f as any).fontSize || 10) * 0.55,
                          ),
                          color: "#2563eb",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          borderBottom: "1px dashed #93c5fd",
                          paddingBottom: 1,
                        }}
                        title={fd.label}
                      >
                        [{fd.label}]
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Preview at {Math.round(scale * 100)}% scale —{" "}
                  {form.chequeWidth}×{form.chequeHeight}mm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Delete this cheque template?</p>
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
