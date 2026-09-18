import { ReactNode } from "react";
import { useAuth } from "./useAuth";
import Login from "./Login";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E1116]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#E7A15E]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
}
