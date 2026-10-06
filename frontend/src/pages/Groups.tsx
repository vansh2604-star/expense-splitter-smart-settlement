import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createGroup, getMyGroups } from "../api/groupApi";
import { Users, Plus, Search, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface GroupMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  members: GroupMember[];
}

export default function Groups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    try {
      setError("");
      const data = await getMyGroups();
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setName("");
      setDescription("");
      setSuccess("Group created successfully!");
      await loadGroups();

      if (res.group?.id) {
        setTimeout(() => {
          navigate(`/groups/${res.group.id}`);
        }, 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Groups</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create trip groups, apartment expenses, or event splits
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create Group Form Card */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 font-bold">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Group</h2>
                <p className="text-xs text-slate-500">Start splitting expenses instantly</p>
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Goa Vacation 2026, Flatmates"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200/90 py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this group for?"
                  rows={3}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200/90 py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-xs font-bold text-white transition shadow-md shadow-teal-600/20 disabled:opacity-50"
              >
                {creating ? "Creating Group..." : "Create Group"}
              </button>
            </form>
          </div>

          {/* Groups List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search filter bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your groups..."
                className="w-full rounded-2xl bg-white border border-slate-200/80 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-xs"
              />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                Loading groups...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
                <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  {searchQuery ? "No matching groups found" : "You haven't joined any groups yet"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {searchQuery
                    ? "Try a different search term."
                    : "Use the form on the left to create your first group."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-6 text-left hover:border-teal-500/50 hover:shadow-md transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 font-bold text-base">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                        {group.name}
                      </h3>

                      {group.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:translate-x-1 transition duration-200">
                      <span>View Group & Settlements</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
