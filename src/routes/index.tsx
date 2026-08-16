import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Lock, ScanEye, FileCheck2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useSetu } from "@/lib/setu/store";
import { DEMO_USERS, DEPARTMENTS, ROLE_LABELS } from "@/lib/setu/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — SetuAI 2.0 Zero-Trust AI Gateway" },
      {
        name: "description",
        content:
          "Secure demo sign-in for SetuAI 2.0, the zero-trust AI gateway that protects government knowledge with RBAC, PII scanning and human oversight.",
      },
      { property: "og:title", content: "Sign in — SetuAI 2.0 Zero-Trust AI Gateway" },
      {
        property: "og:description",
        content:
          "Role-based, source-backed AI answers for government employees — with a security gateway between the employee and the model.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, hydrated } = useSetu();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [mfa, setMfa] = useState(true);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && user) navigate({ to: "/dashboard", replace: true });
  }, [hydrated, user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mfa && otp.trim().length !== 6) {
      setError("Enter the 6-digit demo MFA code (any six digits).");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const res = login(identifier, password, department);
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? "Sign-in failed.");
        return;
      }
      toast.success("Security Passport issued");
      navigate({ to: "/dashboard" });
    }, 500);
  }

  function quickLogin(username: string) {
    const u = DEMO_USERS.find((d) => d.username === username)!;
    setIdentifier(u.username);
    setPassword(u.password);
    setDepartment(u.department);
    setOtp("123456");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full gov-stripe" aria-hidden />
      <div className="grid min-h-[calc(100vh-4px)] lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gov-navy p-10 text-gov-navy-foreground lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">SetuAI 2.0</p>
              <p className="text-xs text-white/70">Government of India — Prototype</p>
            </div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-3xl font-bold leading-tight">
              We are not building another chatbot. We are building a Zero-Trust AI Gateway for
              Government Knowledge.
            </h2>
            <p className="mt-4 text-sm text-white/75">
              Every question is verified, scanned, risk-scored and authorised before any model sees
              it. Every answer carries its source. High-risk decisions escalate to authorised human
              officers.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                { icon: UserCheck, text: "Verify who is asking and what they may know" },
                { icon: ScanEye, text: "Strip credentials and PII before the model call" },
                { icon: FileCheck2, text: "Answer only from authorised, cited policy sources" },
                { icon: Lock, text: "Guard the output and log an auditable trail" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <f.icon className="size-4 text-gov-saffron" aria-hidden />
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            DEMO / FICTIONAL DATA. No real government credentials or records are used.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-md bg-gov-navy text-gov-navy-foreground">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-lg font-bold">SetuAI 2.0</p>
                  <p className="text-xs text-muted-foreground">Zero-Trust AI Gateway</p>
                </div>
              </div>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gov-saffron/50 bg-gov-saffron/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gov-saffron">
              Demo Environment
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Employee sign-in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask anything you're authorised to know — safely.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Employee ID or demo account</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  autoComplete="username"
                  placeholder="employee.demo"
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  placeholder="demo1234"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border bg-card p-3">
                <div>
                  <Label htmlFor="mfa" className="text-sm">
                    Multi-factor authentication
                  </Label>
                  <p className="text-xs text-muted-foreground">Simulated OTP for the demo</p>
                </div>
                <Switch id="mfa" checked={mfa} onCheckedChange={setMfa} />
              </div>

              {mfa && (
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-digit MFA code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    placeholder="123456"
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-md border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying identity…" : "Sign in securely"}
              </Button>
            </form>

            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Demo accounts (password: demo1234)
                </p>
                <div className="mt-3 grid gap-2">
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.username}
                      type="button"
                      onClick={() => quickLogin(u.username)}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span>
                        <span className="font-medium">{u.username}</span>
                        <span className="block text-xs text-muted-foreground">
                          {ROLE_LABELS[u.role]} · {u.department}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">L{u.clearance}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
