import { canViewRiskDetails } from "@/lib/setu/authz";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  FileStack,
  Gauge,
  HelpCircle,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSetu, type Language } from "@/lib/setu/store";
import type { RoleId } from "@/lib/setu/types";
import { ROLE_LABELS } from "@/lib/setu/data";
import { StatusPill, riskTone } from "./badges";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Gauge;
  roles?: RoleId[];
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquareText },
  { to: "/passport", label: "Security Passport", icon: IdCard },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/reviews", label: "Human Review", icon: ClipboardList },
  {
    to: "/security",
    label: "Security Dashboard",
    icon: Gauge,
    roles: ["security_officer", "admin"],
  },
  { to: "/audit", label: "Audit Logs", icon: ScrollText, roles: ["security_officer", "admin"] },
  { to: "/policies", label: "Policy Management", icon: FileStack, roles: ["admin"] },
  { to: "/users", label: "Users & Roles", icon: Users, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help / About", icon: HelpCircle },
];

const LANGS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "gu", label: "ગુજરાતી" },
];

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { user, hydrated, sessionRisk, language, setLanguage, logout, notifications, markNotificationsRead } =
    useSetu();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/", replace: true });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    );
  }

  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const unread = notifications.filter((n) => !n.read).length;

  const sidebar = (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full gov-stripe" aria-hidden />
      <header className="sticky top-0 z-40 border-b bg-gov-navy text-gov-navy-foreground">
        <div className="flex h-16 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gov-navy-foreground hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu className="size-5" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight">SetuAI 2.0</span>
              <span className="hidden text-[11px] text-white/70 sm:block">
                Zero-Trust AI Gateway for Government Knowledge
              </span>
            </span>
          </Link>

          <span className="ml-2 hidden rounded border border-gov-saffron/60 bg-gov-saffron/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gov-saffron md:inline">
            Demo Environment
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:inline">
              {canViewRiskDetails(user.role) ? (
                <StatusPill tone={riskTone(sessionRisk)}>Session {sessionRisk}</StatusPill>
              ) : (
                <StatusPill tone="safe">Session protected</StatusPill>
              )}
            </span>

            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger
                className="h-9 w-[104px] border-white/20 bg-white/10 text-xs text-gov-navy-foreground"
                aria-label="Language"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu onOpenChange={(o) => o && markNotificationsRead()}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gov-navy-foreground hover:bg-white/10"
                  aria-label={`Notifications (${unread} unread)`}
                >
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-gov-saffron" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notification centre</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 && (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </p>
                )}
                {notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className="px-2 py-2 text-sm">
                    <p className="leading-snug">{n.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(n.at).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/10">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                    {user.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="hidden leading-tight sm:block">
                    <span className="block text-sm font-medium">{user.name}</span>
                    <span className="block text-[11px] text-white/70">
                      {user.department} · {ROLE_LABELS[user.role]}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {user.employeeId} · Clearance L{user.clearance}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/passport">Security Passport</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    logout();
                    navigate({ to: "/", replace: true });
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-[68px] hidden h-[calc(100vh-68px)] w-64 shrink-0 overflow-y-auto border-r bg-card lg:block">
          {sidebar}
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 top-[68px] z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="h-full w-64 overflow-y-auto bg-card" onClick={(e) => e.stopPropagation()}>
              {sidebar}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
          <p className="mt-10 border-t pt-4 text-xs text-muted-foreground">
            DEMO / FICTIONAL DATA · SetuAI 2.0 prototype. AI informs; authorised human officers
            decide.
          </p>
        </main>
      </div>
    </div>
  );
}
