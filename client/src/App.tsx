import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CardGenerator from "./pages/CardGenerator";
import LogoManager from "./pages/LogoManager";
import AdminPanel from "./pages/AdminPanel";

// 🔐 AUTH
import { AuthProvider } from "@/auth/useAuth";
import AuthGuard from "@/auth/AuthGuard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/generator"} component={CardGenerator} />
      <Route path={"/generator/admin"} component={AdminPanel} />
      <Route path={"/logos"} component={LogoManager} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <AppContent />
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
