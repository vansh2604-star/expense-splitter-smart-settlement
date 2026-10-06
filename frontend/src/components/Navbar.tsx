import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wallet, Users, LayoutDashboard, LogOut, Plus, ArrowUpRight } from "lucide-react";
import TopUpModal from "./TopUpModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTopUp, setShowTopUp] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const balance = Number(user?.wallet?.balance ?? 0);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-sm transition">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 shadow-md shadow-teal-600/20 group-hover:scale-105 transition duration-200 text-white">
              <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                SplitSmart
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-teal-600 -mt-1">
                Settlement Hub
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive("/") && location.pathname === "/"
                  ? "bg-white text-teal-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              to="/groups"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive("/groups")
                  ? "bg-white text-teal-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Users className="h-4 w-4" />
              Groups
            </Link>

            <Link
              to="/wallet"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive("/wallet")
                  ? "bg-white text-teal-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Wallet
            </Link>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* Wallet Pill */}
            <div className="flex items-center bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-1 pl-3">
              <div className="flex items-center gap-1.5 mr-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-800">Balance:</span>
                <span className="text-xs font-black text-emerald-700">
                  ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                title="Top-up Wallet"
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Top Up
              </button>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-slate-500 leading-tight truncate max-w-[130px]">
                  {user?.email}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-200 px-4 py-2 bg-slate-50 justify-around text-xs font-semibold text-slate-600">
          <Link
            to="/"
            className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              location.pathname === "/" ? "bg-white text-teal-700 font-bold border border-slate-200" : ""
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            to="/groups"
            className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              isActive("/groups") ? "bg-white text-teal-700 font-bold border border-slate-200" : ""
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Groups
          </Link>
          <Link
            to="/wallet"
            className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              isActive("/wallet") ? "bg-white text-teal-700 font-bold border border-slate-200" : ""
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Wallet
          </Link>
        </div>
      </header>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </>
  );
}
