import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, History, Receipt } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBillingStore } from "@/lib/billing-store";

const tabs = [
  { to: "/", label: "Bill", icon: Receipt, exact: true },
  { to: "/menu", label: "Admin", icon: BookOpen, exact: true },
  { to: "/bills", label: "Bills", icon: History, exact: false },
] as const;

function isTabActive(pathname: string, to: string, exact: boolean) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function Brand() {
  const name = useBillingStore((state) => state.profile.restaurantName).trim();
  return (
    <div className="flex min-w-0 items-baseline gap-3">
      <span className="font-display text-xl">Hisab</span>
      {name ? <span className="truncate text-sm text-muted">{name}</span> : null}
    </div>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
  exact,
  pathname,
}: {
  to: "/" | "/menu" | "/bills";
  label: string;
  icon: typeof Receipt;
  exact: boolean;
  pathname: string;
}) {
  const active = isTabActive(pathname, to, exact);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-sm",
        active ? "font-medium text-fg" : "text-muted",
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="app-shell min-h-dvh bg-bg text-fg">
      <header className="no-print fixed inset-x-0 top-0 z-30 hidden h-16 items-center border-b border-line bg-bg md:flex">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6">
          <Brand />
          <nav className="flex items-center gap-1" aria-label="Primary">
            {tabs.map((tab) => {
              const active = isTabActive(pathname, tab.to, tab.exact);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press inline-flex h-10 items-center rounded-sm px-3 text-sm",
                    active ? "bg-fg font-medium text-surface" : "text-muted",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl md:pt-16">{children}</div>
      <nav className="tabbar no-print md:hidden" aria-label="Primary">
        <div className="mx-auto flex max-w-5xl">
          {tabs.map((tab) => (
            <TabLink key={tab.to} {...tab} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Boot() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4">
      <p className="font-display text-3xl">Hisab</p>
    </div>
  );
}
