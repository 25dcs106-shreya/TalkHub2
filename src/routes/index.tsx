import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Lock, ScanEye, FileCheck2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useSetu } from "@/lib/setu/store";
import { DEMO_USERS, DEPARTMENTS } from "@/lib/setu/data";
import {
  DEPARTMENT_KEYS,
  LANGUAGE_OPTIONS,
  ROLE_KEYS,
  type Language,
} from "@/lib/setu/i18n";
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
      { title: "Sign in — TalkHub Zero-Trust AI Gateway" },
      {
        name: "description",
        content:
          "Secure demo sign-in for TalkHub, the zero-trust AI gateway that protects government knowledge with RBAC, PII scanning and human oversight.",
      },
      { property: "og:title", content: "Sign in — TalkHub Zero-Trust AI Gateway" },
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
  const { login, user, hydrated, language, setLanguage, t } = useSetu();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [mfa, setMfa] = useState(true);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /**
   * Inputs stay disabled until React has hydrated. Typing into the
   * server-rendered form before hydration is wiped when controlled inputs
   * attach, which made the form look like it was "not taking input".
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hydrated && user) navigate({ to: "/dashboard", replace: true });
  }, [hydrated, user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mfa && otp.trim().length !== 6) {
      setError(t("login.errorMfa"));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const res = login(identifier, password, department);
      setLoading(false);
      if (!res.ok) {
        const deptKey = res.errorDept ? DEPARTMENT_KEYS[res.errorDept] : undefined;
        setError(
          res.errorKey
            ? t(res.errorKey, { dept: deptKey ? t(deptKey) : (res.errorDept ?? "") })
            : t("login.errorFailed"),
        );
        return;
      }
      toast.success(t("login.passportIssued"));
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

  const heroPoints = [
    { icon: UserCheck, key: "login.heroPoint1" as const },
    { icon: ScanEye, key: "login.heroPoint2" as const },
    { icon: FileCheck2, key: "login.heroPoint3" as const },
    { icon: Lock, key: "login.heroPoint4" as const },
  ];

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
              <p className="text-lg font-bold tracking-tight">{t("app.name")}</p>
              <p className="text-xs text-white/70">{t("app.govLine")}</p>
            </div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-3xl font-bold leading-tight">{t("login.heroTitle")}</h2>
            <p className="mt-4 text-sm text-white/75">{t("login.heroBody")}</p>
            <ul className="mt-8 space-y-3 text-sm">
              {heroPoints.map((f) => (
                <li key={f.key} className="flex items-center gap-3">
                  <f.icon className="size-4 text-gov-saffron" aria-hidden />
                  {t(f.key)}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">{t("login.demoNotice")}</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 lg:hidden">
                <span className="flex size-10 items-center justify-center rounded-md bg-gov-navy text-gov-navy-foreground">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-lg font-bold">{t("app.name")}</p>
                  <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
                </div>
              </div>
              <div className="ml-auto">
                <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  <SelectTrigger className="w-[130px]" aria-label={t("header.language")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gov-saffron/50 bg-gov-saffron/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gov-saffron">
              {t("app.demoBadge")}
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{t("login.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("login.subtitle")}</p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="identifier">{t("login.identifier")}</Label>
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
                <Label htmlFor="password">{t("login.password")}</Label>
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
                <Label htmlFor="department">{t("login.department")}</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder={t("login.selectDepartment")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => {
                      const key = DEPARTMENT_KEYS[d];
                      return (
                        <SelectItem key={d} value={d}>
                          {key ? t(key) : d}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border bg-card p-3">
                <div>
                  <Label htmlFor="mfa" className="text-sm">
                    {t("login.mfa")}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t("login.mfaHint")}</p>
                </div>
                <Switch id="mfa" checked={mfa} onCheckedChange={setMfa} />
              </div>

              {mfa && (
                <div className="space-y-1.5">
                  <Label htmlFor="otp">{t("login.otp")}</Label>
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
                <p
                  role="alert"
                  className="rounded-md border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical"
                >
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("login.verifying") : t("login.signIn")}
              </Button>
            </form>

            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("login.demoAccounts")}
                </p>
                <div className="mt-3 grid gap-2">
                  {DEMO_USERS.map((u) => {
                    const roleKey = ROLE_KEYS[u.role];
                    const deptKey = DEPARTMENT_KEYS[u.department];
                    return (
                      <button
                        key={u.username}
                        type="button"
                        onClick={() => quickLogin(u.username)}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span>
                          <span className="font-medium">{u.username}</span>
                          <span className="block text-xs text-muted-foreground">
                            {t(roleKey)} · {deptKey ? t(deptKey) : u.department}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">L{u.clearance}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
