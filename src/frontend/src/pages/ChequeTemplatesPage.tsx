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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

// ---------- Import types ----------
interface ImportRow {
  TemplateName?: string;
  BankId?: string;
  "ChequeWidth(mm)"?: number;
  "ChequeHeight(mm)"?: number;
  BgColor?: string;
  PayeeName_X?: number;
  PayeeName_Y?: number;
  PayeeName_W?: number;
  PayeeName_FontSize?: number;
  AmountWords_X?: number;
  AmountWords_Y?: number;
  AmountWords_W?: number;
  AmountWords_FontSize?: number;
  AmountNumbers_X?: number;
  AmountNumbers_Y?: number;
  AmountNumbers_FontSize?: number;
  Date_X?: number;
  Date_Y?: number;
  Date_FontSize?: number;
  AccountNumber_X?: number;
  AccountNumber_Y?: number;
  AccountNumber_FontSize?: number;
  BankName_X?: number;
  BankName_Y?: number;
  BankName_FontSize?: number;
  SignatureLine_X?: number;
  SignatureLine_Y?: number;
  SignatureLine_W?: number;
  Memo_X?: number;
  Memo_Y?: number;
  Memo_W?: number;
  Memo_FontSize?: number;
  _error?: string;
  _valid?: boolean;
}

function rowToTemplate(row: ImportRow): ChequeTemplate {
  return {
    id: `ct${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: row.TemplateName || "",
    bankId: row.BankId || "",
    chequeWidth: Number(row["ChequeWidth(mm)"]) || 176,
    chequeHeight: Number(row["ChequeHeight(mm)"]) || 83,
    bgColor: row.BgColor || "#ffffff",
    fields: {
      payeeName: {
        x: Number(row.PayeeName_X) || 30,
        y: Number(row.PayeeName_Y) || 28,
        w: Number(row.PayeeName_W) || 100,
        fontSize: Number(row.PayeeName_FontSize) || 11,
      },
      amountWords: {
        x: Number(row.AmountWords_X) || 30,
        y: Number(row.AmountWords_Y) || 42,
        w: Number(row.AmountWords_W) || 120,
        fontSize: Number(row.AmountWords_FontSize) || 10,
      },
      amountNumbers: {
        x: Number(row.AmountNumbers_X) || 145,
        y: Number(row.AmountNumbers_Y) || 35,
        fontSize: Number(row.AmountNumbers_FontSize) || 12,
      },
      date: {
        x: Number(row.Date_X) || 130,
        y: Number(row.Date_Y) || 20,
        fontSize: Number(row.Date_FontSize) || 10,
      },
      accountNumber: {
        x: Number(row.AccountNumber_X) || 30,
        y: Number(row.AccountNumber_Y) || 55,
        fontSize: Number(row.AccountNumber_FontSize) || 9,
      },
      bankName: {
        x: Number(row.BankName_X) || 30,
        y: Number(row.BankName_Y) || 15,
        fontSize: Number(row.BankName_FontSize) || 9,
      },
      signatureLine: {
        x: Number(row.SignatureLine_X) || 110,
        y: Number(row.SignatureLine_Y) || 70,
        w: Number(row.SignatureLine_W) || 55,
      },
      memo: {
        x: Number(row.Memo_X) || 30,
        y: Number(row.Memo_Y) || 65,
        w: Number(row.Memo_W) || 70,
        fontSize: Number(row.Memo_FontSize) || 9,
      },
    },
  };
}

export default function ChequeTemplatesPage() {
  const [templates, setTemplates] = useState<ChequeTemplate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState<ChequeTemplate>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Import state
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importDone, setImportDone] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ---- Excel template download ----
  function downloadTemplate() {
    const headers = [
      "TemplateName",
      "BankId",
      "ChequeWidth(mm)",
      "ChequeHeight(mm)",
      "BgColor",
      "PayeeName_X",
      "PayeeName_Y",
      "PayeeName_W",
      "PayeeName_FontSize",
      "AmountWords_X",
      "AmountWords_Y",
      "AmountWords_W",
      "AmountWords_FontSize",
      "AmountNumbers_X",
      "AmountNumbers_Y",
      "AmountNumbers_FontSize",
      "Date_X",
      "Date_Y",
      "Date_FontSize",
      "AccountNumber_X",
      "AccountNumber_Y",
      "AccountNumber_FontSize",
      "BankName_X",
      "BankName_Y",
      "BankName_FontSize",
      "SignatureLine_X",
      "SignatureLine_Y",
      "SignatureLine_W",
      "Memo_X",
      "Memo_Y",
      "Memo_W",
      "Memo_FontSize",
    ];
    const sampleRow = [
      "Sample Cheque Template",
      "",
      176,
      83,
      "#ffffff",
      30,
      28,
      100,
      11,
      30,
      42,
      120,
      10,
      145,
      35,
      12,
      130,
      20,
      10,
      30,
      55,
      9,
      30,
      15,
      9,
      110,
      70,
      55,
      30,
      65,
      70,
      9,
    ];
    const XLSX = (window as any).XLSX;
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ChequeTemplates");
    XLSX.writeFile(wb, "cheque_templates_import.xlsx");
  }

  // ---- Excel file upload ----
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportDone(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const XLSX = (window as any).XLSX;
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: ImportRow[] = XLSX.utils.sheet_to_json(ws, {
        defval: "",
      });
      const validated = rows.map((r) => ({
        ...r,
        _valid: !!(r.TemplateName && String(r.TemplateName).trim()),
        _error: !r.TemplateName ? "TemplateName is required" : "",
      }));
      setImportRows(validated);
    };
    reader.readAsArrayBuffer(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  }

  function importValidRows() {
    const valid = importRows.filter((r) => r._valid);
    if (valid.length === 0) return;
    const newTemplates = valid.map(rowToTemplate);
    const updated = [...templates, ...newTemplates];
    save(LS_TEMPLATES, updated);
    setTemplates(updated);
    setImportDone(valid.length);
    setImportRows([]);
  }

  const importColumns = [
    "TemplateName",
    "BankId",
    "ChequeWidth(mm)",
    "ChequeHeight(mm)",
    "BgColor",
    "PayeeName_X",
    "PayeeName_Y",
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Cheque Templates
      </h1>

      <Tabs defaultValue="designer">
        <TabsList className="mb-4">
          <TabsTrigger value="designer">Template Designer</TabsTrigger>
          <TabsTrigger value="import">Import from Excel</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: DESIGNER ===== */}
        <TabsContent value="designer">
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
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        form.id === t.id
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : ""
                      }`}
                      onClick={() => selectTemplate(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") selectTemplate(t);
                      }}
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

                {/* Section A */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-1 border-b">
                    A. Cheque Dimensions & Settings
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <Label>Template Name *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
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
                            chequeWidth:
                              Number.parseFloat(e.target.value) || 176,
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
                            chequeHeight:
                              Number.parseFloat(e.target.value) || 83,
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
                      {/* FIX: value="" crashes shadcn Select — use "none" sentinel */}
                      <Select
                        value={form.bankId || "none"}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            bankId: v === "none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
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

                {/* Section B */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 pb-1 border-b">
                    B. Field Positions (all values in mm / pt)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs">
                          <th className="text-left py-2 pr-4 font-medium">
                            Field
                          </th>
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
                                  <span className="text-gray-300 text-xs">
                                    N/A
                                  </span>
                                )}
                              </td>
                              <td className="py-1">
                                {fd.key !== "signatureLine" ? (
                                  <Input
                                    type="number"
                                    value={(f as any).fontSize || 10}
                                    onChange={(e) =>
                                      setField(
                                        fd.key,
                                        "fontSize",
                                        e.target.value,
                                      )
                                    }
                                    className="w-20 h-8"
                                  />
                                ) : (
                                  <span className="text-gray-300 text-xs">
                                    N/A
                                  </span>
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
                        const pw = (f as any).w
                          ? (f as any).w * scale
                          : undefined;
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
        </TabsContent>

        {/* ===== TAB 2: IMPORT ===== */}
        <TabsContent value="import">
          <div className="bg-white rounded-lg border shadow-sm p-6 max-w-5xl">
            <h2 className="font-semibold text-gray-700 mb-4">
              Import Cheque Templates from Excel
            </h2>

            {/* Step 1: Download template */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Step 1 — Download the Excel Template
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Download the template file, fill in your cheque templates, then
                upload it below.
              </p>
              <Button
                variant="outline"
                className="border-blue-400 text-blue-700 hover:bg-blue-100"
                onClick={downloadTemplate}
                data-ocid="cheque_template.upload_button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel Template
              </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">
                Step 2 — Upload Your Filled Excel File
              </h3>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fileInputRef.current?.click();
                }}
                data-ocid="cheque_template.dropzone"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to select an .xlsx file
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported: .xlsx (Excel)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Success banner */}
            {importDone !== null && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Successfully imported {importDone} template
                  {importDone !== 1 ? "s" : ""}!
                </span>
              </div>
            )}

            {/* Preview table */}
            {importRows.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700">
                    Step 3 — Review & Import ({importRows.length} rows,{" "}
                    {importRows.filter((r) => !r._valid).length} errors)
                  </h3>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={importValidRows}
                    disabled={!importRows.some((r) => r._valid)}
                    data-ocid="cheque_template.submit_button"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Import {importRows.filter((r) => r._valid).length} Valid
                    Row(s)
                  </Button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">
                          Status
                        </th>
                        {importColumns.map((c) => (
                          <th
                            key={c}
                            className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap"
                          >
                            {c}
                          </th>
                        ))}
                        <th className="text-left px-3 py-2 font-medium text-gray-600">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row, idx) => (
                        <tr
                          key={`import-row-${idx}-${String((row as any).TemplateName ?? idx)}`}
                          className={`border-b ${
                            row._valid
                              ? "hover:bg-gray-50"
                              : "bg-red-50 hover:bg-red-100"
                          }`}
                        >
                          <td className="px-3 py-2">
                            {row._valid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </td>
                          {importColumns.map((c) => (
                            <td
                              key={c}
                              className={`px-3 py-2 ${
                                c === "TemplateName" && !row._valid
                                  ? "text-red-600 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {String((row as any)[c] ?? "")}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-red-500 text-xs">
                            {row._error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete dialog */}
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
