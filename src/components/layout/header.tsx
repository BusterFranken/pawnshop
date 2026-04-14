"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Gem, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Gem className="h-6 w-6 text-amber-500" />
          <span>PawnShop</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/account"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            My Appraisals
          </Link>

          {role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          )}
          {role === "SHOP_OWNER" && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}

          {session ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/account/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link href="/appraisal">
                <Button size="sm">Start Free Appraisal</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-3">
          <Link
            href="/account"
            className="block text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            My Appraisals
          </Link>
          {role === "ADMIN" && (
            <Link
              href="/admin"
              className="block text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
          )}
          {role === "SHOP_OWNER" && (
            <Link
              href="/dashboard"
              className="block text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {session ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Link
                href="/account/login"
                className="block text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link href="/appraisal" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Start Free Appraisal
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
