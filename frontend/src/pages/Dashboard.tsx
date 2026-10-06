import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import TopUpModal from "../components/TopUpModal";
import { useAuth } from "../context/AuthContext";
import { getMyGroups } from "../api/groupApi";
import {
  Wallet,
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: any[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      getMyGroups()
        .then((data) => setGroups(data.groups || []))
        .catch((err) => console.error(err))
        .finally(() => setLoadingGroups(false));
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading SplitSmart...</p>
        </div>
      </div>
    );
  }

  const balance = Number(user.wallet?.balance ?? 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 border border-teal-700/60 p-6 sm:p-10 shadow-lg text-white mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-200 uppercase tracking-wider mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Smart Settlement Platform</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Welcome back, {user.name}!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-teal-100/90 max-w-xl leading-relaxed">
                Split bills evenly with friends, track net balances, and resolve group debts with 1-click wallet settlements.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTopUp(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 text-xs transition shadow-md shadow-emerald-900/20"
              >
                <Plus className="h-4 w-4" />
                Top Up Wallet
              </button>

              <Link
                to="/groups"
                className="flex items-center gap-2 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold px-5 py-2.5 text-xs transition shadow-md shadow-teal-900/20"
              >
                <Users className="h-4 w-4" />
                Manage Groups
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          {/* Wallet Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Wallet Balance
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-900">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Demo Wallet</span>
              <Link to="/wallet" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                View History <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Active Groups Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Groups
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200/60">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-900">{groups.length}</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Joined Groups</span>
              <Link to="/groups" className="text-teal-700 font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Account Status
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xl font-bold text-emerald-700 flex items-center gap-2">
              <Zap className="h-5 w-5 fill-emerald-600 text-emerald-600" /> Fully Verified
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Smart Settlement:</span>
              <span className="font-bold text-teal-700">Enabled</span>
            </div>
          </div>
        </div>

        {/* Quick Groups List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Your Recent Groups
            </h2>

            <Link
              to="/groups"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 transition flex items-center gap-1"
            >
              View All Groups <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingGroups ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Loading your groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-xs">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No groups yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Create or join a group with friends to start splitting expenses.
              </p>
              <Link
                to="/groups"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm"
              >
                <Plus className="h-4 w-4" /> Create First Group
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.slice(0, 6).map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-6 text-left hover:border-teal-500/50 hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 font-bold text-sm">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {g.members?.length || 1} member{g.members?.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                      {g.name}
                    </h3>
                    {g.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{g.description}</p>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:translate-x-1 transition duration-200">
                    <span>Open Group Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </div>
  );
}
