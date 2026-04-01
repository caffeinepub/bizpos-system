import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        if (session.isSuperUser) {
          navigate({ to: "/company-select" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } catch {
        navigate({ to: "/dashboard" });
      }
    } else {
      setError("Invalid email or password. Please try again.");
    }
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
              <Label htmlFor="password">Password</Label>
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
    </div>
  );
}
