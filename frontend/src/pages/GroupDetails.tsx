import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getGroupDetails } from "../api/groupApi";
import { getGroupSettlements, getSettlementHistory } from "../api/settlementApi";
import { useAuth } from "../context/AuthContext";
import AddExpenseModal from "../components/AddExpenseModal";
import AddMemberModal from "../components/AddMemberModal";
import SettlePaymentModal from "../components/SettlePaymentModal";
import {
  Users,
  Plus,
  Receipt,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
} from "lucide-react";

interface Member {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Split {
  id: string;
  amount: string | number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Expense {
  id: string;
  description: string;
  amount: string | number;
  createdAt: string;
  paidBy: {
    id: string;
    name: string;
    email: string;
  };
  splits: Split[];
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  members: Member[];
  expenses: Expense[];
}

interface MemberBalance {
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  balance: number;
}

interface SettlementPlan {
  fromUserId: string;
  toUserId: string;
  from?: {
    id: string;
    name: string;
    email: string;
  };
  to?: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
}

interface PaymentHistoryItem {
  id: string;
  amount: string | number;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
}

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [settlements, setSettlements] = useState<SettlementPlan[]>([]);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"expenses" | "settlement" | "members" | "history">("expenses");

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementPlan | null>(null);

  const loadData = useCallback(async () => {
    if (!groupId) return;
    try {
      setError("");
      const [groupRes, settlementRes, historyRes] = await Promise.all([
        getGroupDetails(groupId),
        getGroupSettlements(groupId),
        getSettlementHistory(groupId).catch(() => ({ payments: [] })),
      ]);

      setGroup(groupRes.group);
      setBalances(settlementRes.balances || []);
      setSettlements(settlementRes.settlements || []);
      setHistory(historyRes.payments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load group details");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">Loading group details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-600 mb-3" />
            <h2 className="text-lg font-bold text-rose-900">Group Not Found</h2>
            <p className="mt-1 text-sm text-rose-700">{error || "Could not fetch group details."}</p>
            <Link
              to="/groups"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = group.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Top Navigation Back Button */}
        <button
          onClick={() => navigate("/groups")}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
          Back to All Groups
        </button>

        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                <Users className="h-4 w-4" />
                <span>Group • Created by {group.createdBy.name}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {group.name}
              </h1>
              {group.description && (
                <p className="mt-2 text-sm text-slate-600 max-w-2xl">{group.description}</p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-4 py-2.5 text-xs font-bold text-slate-800 transition"
              >
                <Plus className="h-4 w-4 text-teal-700" />
                Add Member
              </button>

              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-md shadow-teal-600/20"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>
          </div>

          {/* Group Stat Pills */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Expenses</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Members</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{group.members.length}</p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Settlements</span>
              <p className="text-2xl font-black text-purple-700 mt-1">{settlements.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="mt-8 flex border-b border-slate-200/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === "expenses"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Receipt className="h-4 w-4" />
            Expenses ({group.expenses.length})
          </button>

          <button
            onClick={() => setActiveTab("settlement")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === "settlement"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Smart Settlement ({settlements.length})
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === "members"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Members ({group.members.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === "history"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="h-4 w-4" />
            Settlement History ({history.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          {/* TAB 1: EXPENSES */}
          {activeTab === "expenses" && (
            <div>
              {group.expenses.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
                  <Receipt className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No expenses logged yet</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Add your first group expense to start splitting costs automatically.
                  </p>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-md shadow-teal-600/20"
                  >
                    <Plus className="h-4 w-4" /> Add First Expense
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {group.expenses.map((expense) => {
                    const isUserPayer = expense.paidBy.id === user?.id;
                    const dateStr = new Date(expense.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={expense.id}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-teal-300 transition shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 font-bold">
                              ₹
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-base leading-snug">
                                {expense.description}
                              </h4>
                              <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-2">
                                <span>
                                  Paid by{" "}
                                  <strong className={isUserPayer ? "text-teal-700" : "text-slate-800"}>
                                    {isUserPayer ? "You" : expense.paidBy.name}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {dateStr}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-black text-slate-900">
                              ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Split among {expense.splits.length} member{expense.splits.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {/* Splits breakdown pill drawer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                          <span className="text-[11px] font-bold text-slate-400 uppercase self-center mr-1">
                            Splits:
                          </span>
                          {expense.splits.map((s) => (
                            <span
                              key={s.id}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                                s.user.id === user?.id
                                  ? "bg-teal-50 border-teal-200 text-teal-800"
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              {s.user.id === user?.id ? "You" : s.user.name}: ₹{Number(s.amount).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SMART SETTLEMENT */}
          {activeTab === "settlement" && (
            <div className="space-y-8">
              {/* Algorithm Highlight Header */}
              <div className="rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 border border-teal-200/80 p-6 text-slate-800">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="h-4 w-4" />
                  Greedy Min-Cash-Flow Settlement Engine
                </div>
                <h3 className="text-lg font-black text-slate-900">Smart Recommended Settlements</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  Our algorithm minimizes the total number of transactions required to settle all debts in this group. You can settle debt directly with 1-click using your wallet balance.
                </p>
              </div>

              {/* Recommended Settlement Payments */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Suggested Transactions ({settlements.length})
                </h4>

                {settlements.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-slate-900 text-base">All Settled Up!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      No pending debts exist in this group. Everyone is even!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {settlements.map((s, idx) => {
                      const isDebtor = s.fromUserId === user?.id;
                      const isCreditor = s.toUserId === user?.id;

                      const fromName = isDebtor ? "You" : s.from?.name || "Member";
                      const toName = isCreditor ? "You" : s.to?.name || "Member";

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                            isDebtor
                              ? "bg-rose-50/40 border-rose-200"
                              : isCreditor
                              ? "bg-emerald-50/40 border-emerald-200"
                              : "bg-white border-slate-200/80 shadow-xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400">
                                Transaction #{idx + 1}
                              </span>
                              <span className="text-lg font-black text-slate-900">
                                ₹{s.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 text-xs shadow-2xs">
                              <span className="font-bold text-rose-700">{fromName}</span>
                              <div className="flex items-center gap-1 text-slate-400">
                                <span>owes</span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-teal-600" />
                              </div>
                              <span className="font-bold text-emerald-700">{toName}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            {isDebtor ? (
                              <button
                                onClick={() => setSelectedSettlement(s)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs transition shadow-sm"
                              >
                                Settle Now (Pay ₹{s.amount})
                              </button>
                            ) : isCreditor ? (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                <ArrowDownLeft className="h-4 w-4" /> You are owed this payment
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Pending between peers
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group Net Balances Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Member Net Balances
                </h4>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="divide-y divide-slate-100">
                    {balances.map((b) => {
                      const isMe = b.userId === user?.id;
                      const isPositive = b.balance > 0;
                      const isNegative = b.balance < 0;

                      return (
                        <div
                          key={b.userId}
                          className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {b.user?.name || "Member"}{" "}
                              {isMe && (
                                <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{b.user?.email}</p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-base font-black ${
                                isPositive
                                  ? "text-emerald-700"
                                  : isNegative
                                  ? "text-rose-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {isPositive ? "+" : ""}₹
                              {Math.abs(b.balance).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              {isPositive ? "gets back" : isNegative ? "owes total" : "settled"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS */}
          {activeTab === "members" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.members.map((m) => {
                const isMe = m.user.id === user?.id;
                const isCreator = m.user.id === group.createdBy.id;

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 text-sm border border-teal-200/60">
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {m.user.name}
                          {isMe && <span className="text-teal-700 text-xs font-normal">(You)</span>}
                        </h4>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{m.user.email}</p>
                      </div>
                    </div>

                    {isCreator && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-1 rounded-lg">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: SETTLEMENT HISTORY */}
          {activeTab === "history" && (
            <div>
              {history.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
                  <History className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No payment history yet</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Settlements paid using wallet balance will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => {
                    const isSender = item.fromUser.id === user?.id;
                    const isReceiver = item.toUser.id === user?.id;
                    const dateStr = new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200/80 bg-white p-4 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold border ${
                              isSender
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : isReceiver
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {isSender ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {isSender
                                ? `Paid to ${item.toUser.name}`
                                : isReceiver
                                ? `Received from ${item.fromUser.name}`
                                : `${item.fromUser.name} paid ${item.toUser.name}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-base font-black ${
                              isSender
                                ? "text-rose-700"
                                : isReceiver
                                ? "text-emerald-700"
                                : "text-slate-900"
                            }`}
                          >
                            {isSender ? "-" : isReceiver ? "+" : ""}₹
                            {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-emerald-700">
                            Completed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          groupId={group.id}
          members={group.members}
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={loadData}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          groupId={group.id}
          onClose={() => setShowAddMember(false)}
          onMemberAdded={loadData}
        />
      )}

      {selectedSettlement && (
        <SettlePaymentModal
          groupId={group.id}
          toUserId={selectedSettlement.toUserId}
          toUserName={selectedSettlement.to?.name || "Peer User"}
          toUserEmail={selectedSettlement.to?.email || ""}
          suggestedAmount={selectedSettlement.amount}
          onClose={() => setSelectedSettlement(null)}
          onPaymentComplete={loadData}
        />
      )}
    </div>
  );
}
