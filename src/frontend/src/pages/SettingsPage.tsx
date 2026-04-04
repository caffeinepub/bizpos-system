import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Save, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "SAR", "AED", "INR"];

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState({ ...settings });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });

  const handleSave = () => {
    updateSettings(form);
    toast.success("Settings saved successfully");
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "This will delete ALL data and reload with fresh seed data. Are you sure?",
      )
    )
      return;
    for (const k of Object.keys(localStorage).filter((k) =>
      k.startsWith("bizpos_"),
    )) {
      localStorage.removeItem(k);
    }
    window.location.reload();
  };

  const handlePasswordChange = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      toast.error("All password fields are required");
      return;
    }
    if (pwForm.newPw.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("New password and confirm password do not match");
      return;
    }
    try {
      const session = JSON.parse(
        localStorage.getItem("bizpos_session") || "{}",
      );
      const userId = session.id;
      const users = JSON.parse(localStorage.getItem("bizpos_users") || "[]");
      const user = users.find(
        (u: { id: string; password: string }) => u.id === userId,
      );
      if (!user) {
        toast.error("User not found");
        return;
      }
      if (user.password !== pwForm.current) {
        toast.error("Current password is incorrect");
        return;
      }
      const updatedUsers = users.map((u: { id: string }) =>
        u.id === userId ? { ...u, password: pwForm.newPw } : u,
      );
      localStorage.setItem("bizpos_users", JSON.stringify(updatedUsers));
      setPwForm({ current: "", newPw: "", confirm: "" });
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to update password");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure system preferences</p>
        </div>
        <Button onClick={handleSave} data-ocid="settings.save_button">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="BizPOS Technologies"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm({ ...form, currency: v })}
              >
                <SelectTrigger data-ocid="settings.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              <img
                src="/assets/generated/company-logo-transparent.dim_200x200.png"
                alt="Logo"
                className="h-16 w-16 rounded-lg border"
              />
              <div>
                <p className="text-sm text-gray-500">Current logo</p>
                <p className="text-xs text-gray-400">
                  Replace file at:
                  /assets/generated/company-logo-transparent.dim_200x200.png
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Invoice Footer Text</Label>
            <Textarea
              value={form.invoiceFooter}
              onChange={(e) =>
                setForm({ ...form, invoiceFooter: e.target.value })
              }
              rows={3}
              placeholder="Thank you for your business!"
              data-ocid="settings.textarea"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "System Version", value: "2.0.0" },
              { label: "Storage", value: "localStorage (Browser)" },
              { label: "Backend", value: "None (Client-only)" },
              { label: "Authentication", value: "Email/Password" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Change your account password.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={pwForm.current}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, current: e.target.value }))
                }
                placeholder="Current password"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={pwForm.newPw}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, newPw: e.target.value }))
                }
                placeholder="Min 4 characters"
                data-ocid="settings.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={pwForm.confirm}
                onChange={(e) =>
                  setPwForm((p) => ({ ...p, confirm: e.target.value }))
                }
                placeholder="Repeat new password"
                data-ocid="settings.input"
              />
            </div>
          </div>
          <Button
            onClick={handlePasswordChange}
            data-ocid="settings.save_button"
          >
            <Lock className="h-4 w-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Developer Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Clear all stored data and reload with fresh seed data. Use this to
            reset the system to its initial state.
          </p>
          <Button
            variant="destructive"
            onClick={handleReset}
            data-ocid="settings.delete_button"
          >
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
