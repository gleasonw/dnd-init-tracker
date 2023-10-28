"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logOut } from "@/app/dashboard/actions";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  const routes = [
    "/dashboard",
    "/dashboard/creatures",
    "/dashboard/settings",
  ] as const;

  const routeLabels = {
    "/dashboard": "Encounters",
    "/dashboard/creatures": "Creatures",
    "/dashboard/settings": "Settings",
  } as const;

  const path = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <nav className="border-bottom border flex items-center gap-3 flex-col sm:flex-row sm:gap-10">
        <Link href="/dashboard" className={"text-2xl p-5"}>
          LiDnD
        </Link>
        {routes.map((route) => (
          <Link
            key={route}
            href={route}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-gray-200 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-gray-200 font-bold": path === route,
              }
            )}
          >
            {routeLabels[route]}
          </Link>
        ))}
        <form action={logOut} className={"ml-auto pr-5"}>
          <button type="submit">
            <LogOut />
          </button>
        </form>
      </nav>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
