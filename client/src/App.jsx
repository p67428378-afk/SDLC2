import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { authService } from "./services/api";
import MortgageDetailsPage from "./pages/MortgageDetailsPage";
import MakePaymentPage from "./pages/MakePaymentPage";
import PaymentReviewPage from "./pages/PaymentReviewPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import ScheduledPaymentsPage from "./pages/ScheduledPaymentsPage";
import {
  LayoutDashboard,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  History,
  AlertCircle,
  Loader2,
} from "lucide-react";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.login(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-md">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl shadow-sm flex flex-col gap-lg">
        <div className="flex items-center gap-sm justify-center">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-lg">
            N
          </div>
          <span className="font-headline-md text-headline-md font-bold text-primary">
            Nexus Bank
          </span>
        </div>

        <div className="text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Welcome Back
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Sign in to manage your mortgage payments
          </p>
        </div>

        {error && (
          <div className="p-md bg-error-container text-on-error-container rounded-lg flex items-start gap-sm border border-error/20">
            <AlertCircle className="w-5 h-5 shrink-0 text-error" />
            <span className="font-body-sm text-body-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label
              htmlFor="email"
              className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label
              htmlFor="password"
              className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 px-md border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="p-md bg-surface-container-low rounded-lg border border-outline-variant text-center">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
            Test Credentials
          </p>
          <p className="font-body-sm text-body-sm text-on-surface font-medium">
            Email: <span className="font-mono">test@example.com</span>
          </p>
          <p className="font-body-sm text-body-sm text-on-surface font-medium">
            Password: <span className="font-mono">testpassword</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "#", label: "Dashboard", icon: LayoutDashboard },
    { path: "/", label: "Accounts", icon: Landmark, active: true },
    { path: "#", label: "Payments", icon: CreditCard },
    { path: "#", label: "Transfers", icon: ArrowLeftRight },
    { path: "#", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background text-on-background font-body-md text-body-md antialiased w-full">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col h-full py-lg fixed left-0 top-0 w-[260px] bg-surface border-r border-outline-variant z-20">
        <div className="px-md mb-xl flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold">
            N
          </div>
          <span className="font-headline-md text-headline-md font-bold text-primary">
            Nexus Bank
          </span>
        </div>

        <div className="px-md mb-xl">
          <div className="flex items-center gap-md">
            <img
              alt="User Profile"
              className="w-12 h-12 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrVVSDNAh7QBXaIwATd7NRkt-HPssGvGeHTeTYBLrE6lqJXvjL3wS0uGyfoiT2vTLcuBsQ9TwZ8L5KmZ1QOhw2k6QBebCFjj8O5lwMlpRbI2GfsVqiHyte-6BHR1XdHymcOZsk3DcQoZK0k8hsZj6xiYo57ezfOFvC_P_FpwvrjOqIqgJLuNEZ5eohJWYGopyBmy9GzlR6F2Vw8jZGmN3NQZbIA3peE_KWel8h4PhVJDxfRN3o_KbREN0N8KA8wG_W0VkEJyh0BOFW"
            />
            <div>
              <div className="font-headline-md text-headline-md font-semibold text-on-surface">
                Alex Thompson
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">
                Premium Account
              </div>
            </div>
          </div>
        </div>

        <div className="px-md mb-lg">
          <button className="w-full h-11 bg-primary-container text-on-primary rounded font-label-md text-label-md flex items-center justify-center gap-sm hover:bg-[#4338CA] transition-colors">
            New Transaction
          </button>
        </div>

        <ul className="flex flex-col flex-1 px-sm gap-xs">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.active || location.pathname === item.path;
            return (
              <li key={idx}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-md p-md hover:bg-surface-container transition-colors rounded ${
                    isActive
                      ? "bg-surface-container-low border-l-4 border-primary text-primary font-medium"
                      : "text-on-surface-variant"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto px-sm flex flex-col gap-xs border-t border-outline-variant pt-sm">
          <a
            href="#"
            className="flex items-center gap-md text-on-surface-variant p-md hover:bg-surface-container transition-colors rounded"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Support</span>
          </a>
          <button
            onClick={onLogout}
            className="flex items-center gap-md text-on-surface-variant p-md hover:bg-surface-container transition-colors rounded w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[260px] relative w-full">
        {/* TopNavBar */}
        <header className="flex items-center justify-between px-lg w-full h-[64px] bg-surface border-b border-outline-variant z-10 sticky top-0">
          <div className="flex items-center gap-md">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-on-surface-variant p-sm rounded hover:bg-surface-container transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-sm font-body-sm text-body-sm text-on-surface-variant">
              <Link to="/" className="hover:text-primary transition-colors">
                Accounts
              </Link>
              <span className="text-on-surface-variant">/</span>
              <span className="text-on-surface font-medium">
                Loan #30049182
              </span>
            </div>
          </div>

          <div className="flex items-center gap-md">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
              <History className="w-5 h-5" />
            </button>
            <button className="hidden sm:flex h-9 px-md items-center justify-center rounded border border-outline-variant text-primary font-label-md text-label-md hover:bg-surface-container transition-colors">
              Quick Pay
            </button>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isLoggedIn());
  const [paymentData, setPaymentData] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<MortgageDetailsPage />} />
          <Route
            path="/pay"
            element={<MakePaymentPage onSetPaymentData={setPaymentData} />}
          />
          <Route
            path="/review"
            element={
              <PaymentReviewPage
                paymentData={paymentData}
                onSetReceipt={setReceipt}
              />
            }
          />
          <Route
            path="/confirmation"
            element={<PaymentConfirmationPage receipt={receipt} />}
          />
          <Route path="/scheduled" element={<ScheduledPaymentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
