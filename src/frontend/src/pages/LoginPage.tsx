import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, KeyRound, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

function writeLog(
  module: string,
  action: string,
  details: string,
  userName: string,
  userId?: string,
) {
  try {
    const entry = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      user: userName,
      userId: userId ?? "",
      module,
      action,
      details,
    };
    const existing = JSON.parse(localStorage.getItem("bizpos_logs") || "[]");
    localStorage.setItem(
      "bizpos_logs",
      JSON.stringify([...existing.slice(-999), entry]),
    );
  } catch {}
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpFoundUser, setFpFoundUser] = useState<{
    id: string;
    name: string;
    password: string;
  } | null>(null);
  const [fpError, setFpError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = login(email.trim(), password);
    setLoading(false);
    if (ok) {
      try {
        const session = JSON.parse(
          localStorage.getItem("bizpos_session") || "{}",
        );
        writeLog(
          "Auth",
          "login",
          `User logged in: ${session.name ?? email.trim()}`,
          session.name ?? email.trim(),
          session.id ?? "",
        );
        if (session.isSuperUser) {
          navigate({ to: "/company-select" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } catch {
        writeLog(
          "Auth",
          "login",
          `User logged in: ${email.trim()}`,
          email.trim(),
        );
        navigate({ to: "/dashboard" });
      }
    } else {
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleForgotLookup = () => {
    setFpError("");
    setFpFoundUser(null);
    try {
      const users = JSON.parse(localStorage.getItem("bizpos_users") || "[]");
      const found = users.find(
        (u: { email: string; status: string }) =>
          u.email.toLowerCase() === fpEmail.toLowerCase() &&
          u.status === "Active",
      );
      if (found) {
        setFpFoundUser(found);
        setFpNewPassword("");
      } else {
        setFpError("No active account found with this email address.");
      }
    } catch {
      setFpError("Error looking up account.");
    }
  };

  const handlePasswordReset = () => {
    if (!fpNewPassword || fpNewPassword.length < 4) {
      setFpError("New password must be at least 4 characters.");
      return;
    }
    try {
      const users = JSON.parse(localStorage.getItem("bizpos_users") || "[]");
      const updated = users.map((u: { id: string }) =>
        u.id === fpFoundUser?.id ? { ...u, password: fpNewPassword } : u,
      );
      localStorage.setItem("bizpos_users", JSON.stringify(updated));
      toast.success("Password updated successfully. You can now log in.");
      setForgotOpen(false);
      setFpEmail("");
      setFpFoundUser(null);
      setFpNewPassword("");
    } catch {
      setFpError("Error updating password.");
    }
  };

  const openForgot = () => {
    setFpEmail("");
    setFpFoundUser(null);
    setFpError("");
    setFpNewPassword("");
    setForgotOpen(true);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "url(/assets/generated/login-background.dim_1920x1080.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/assets/generated/company-logo-transparent.dim_200x200.png"
              alt="Company Logo"
              className="h-20 w-20"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            BizPOS System
          </CardTitle>
          <CardDescription className="text-base">
            Point of Sale + Inventory + Warehouse + Accounting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bizpos.com"
                required
                data-ocid="login.input"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  data-ocid="login.link"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-ocid="login.input"
              />
            </div>
            {error && (
              <div
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                data-ocid="login.error_state"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg"
              size="lg"
              data-ocid="login.submit_button"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Demo Credentials</p>
            <p>Admin: admin@bizpos.com / admin123</p>
            <p>Cashier: cashier@bizpos.com / cashier123</p>
            <p>Super User: superuser@bizpos.com / super123</p>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-sm"
          data-ocid="login.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Account Recovery
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!fpFoundUser ? (
              <>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    placeholder="Enter your email"
                    data-ocid="login.input"
                  />
                </div>
                {fpError && (
                  <div
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
                    data-ocid="login.error_state"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {fpError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setForgotOpen(false)}
                    className="flex-1"
                    data-ocid="login.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleForgotLookup}
                    className="flex-1"
                    disabled={!fpEmail}
                    data-ocid="login.submit_button"
                  >
                    Look Up Account
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    Account found: {fpFoundUser.name}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Current password:{" "}
                    <code className="bg-green-100 px-1 rounded">
                      {fpFoundUser.password}
                    </code>
                  </p>
                </div>
                <div>
                  <Label>Set New Password</Label>
                  <Input
                    type="text"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    data-ocid="login.input"
                  />
                </div>
                {fpError && (
                  <div
                    className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
                    data-ocid="login.error_state"
                  >
                    {fpError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setFpFoundUser(null)}
                    className="flex-1"
                    data-ocid="login.cancel_button"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePasswordReset}
                    className="flex-1"
                    data-ocid="login.submit_button"
                  >
                    Update Password
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
