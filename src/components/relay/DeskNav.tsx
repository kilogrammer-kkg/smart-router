import { Wordmark } from "@/components/relay/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";

const LINKS = [
  { to: "/dashboard", label: "Approval queue", key: "desk" },
  { to: "/catalog", label: "Catalog", key: "catalog" },
] as const;

export function DeskNav({ active }: { active: "desk" | "catalog" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-4">
      <Link to="/dashboard" aria-label="SmartRouter desk">
        <Wordmark />
      </Link>

      <nav className="glass-chip order-3 flex w-full items-center gap-1 rounded-full p-1 sm:order-none sm:w-auto">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "flex-1 rounded-full px-3.5 py-1.5 text-center text-[12px] font-medium transition-colors sm:flex-none",
              active === link.key
                ? "bg-white/90 text-foreground shadow-[0_2px_8px_-4px_rgba(28,62,88,0.35)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <span className="hidden text-right text-[11px] leading-tight text-muted-foreground sm:block">
          <span className="block font-semibold text-foreground">
            {user?.name?.trim() || user?.email || "Team member"}
          </span>
          Internal desk
        </span>
        <span className="glass-chip grid size-9 place-items-center rounded-full text-[12px] font-semibold text-primary">
          {(user?.name ?? user?.email ?? "S").slice(0, 1).toUpperCase()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
