"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import { UserMinus, UserCheck, AlertTriangle } from "lucide-react"; // เพิ่ม icon AlertTriangle

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // State สำหรับ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalProcessing, setModalProcessing] = useState(false); // Add loading state for modal buttons

  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    let isMounted = true;

    const checkPermissionAndFetch = async () => {
      if (!currentUser) return;

      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (!isMounted) return;

        if (error || userData?.role !== "master_admin") {
          toast.error("Access Denied: Master Admin only!", {
            id: "access-denied",
          });
          router.replace("/admin");
          return;
        }

        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    };

    checkPermissionAndFetch();

    return () => {
      isMounted = false;
    };
  }, [currentUser, router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, targetRole) => {
    setUpdatingUserId(userId);

    try {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser?.clerk_id) {
        throw new Error("Clerk ID not found");
      }

      const { error: supabaseError } = await supabase
        .from("users")
        .update({ role: targetRole })
        .eq("id", userId);

      if (supabaseError) throw supabaseError;

      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: targetUser.clerk_id,
          role: targetRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync with Clerk");
      }

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      toast.success(`Role updated to ${targetRole} successfully!`);
    } catch (error) {
      console.error("Update Role Error:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // 1. Function to open Modal (called from table button)
  const openBlockModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // 2. Actual Block function (removed old confirm)
  const toggleBlockStatus = async (userId, currentBlockStatus) => {
    setModalProcessing(true); // Start loading in modal
    try {
      const newStatus = !currentBlockStatus;
      
      // *** Removed old confirm() because we use Modal now ***

      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser?.clerk_id) {
        toast.error("Clerk ID not found for this user");
        return;
      }

      // 1. อัปเดตใน Supabase
      const { error } = await supabase
        .from("users")
        .update({ is_blocked: newStatus })
        .eq("id", userId);

      if (error) throw error;

      // 2. Sync to Clerk
      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: targetUser.clerk_id,
          isBlocked: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to sync with Clerk");

      // 3. Update UI
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_blocked: newStatus } : u
        )
      );
      toast.success(
        newStatus ? "User blocked & kicked out!" : "User unblocked"
      );
      
      // Close Modal when done
      setIsModalOpen(false); 

    } catch (error) {
      console.error("Block Error:", error);
      toast.error(error.message || "Failed to update block status");
    } finally {
      setModalProcessing(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
      <PageTitle
        heading="Master Control"
        text="Manage Admins and User Access"
      />

      <div className="mt-8 mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left">
            <thead className="bg-slate-50 text-base uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Current Role</th>
                <th className="px-4 py-3 text-right">Set Role</th>
                <th className="px-4 py-3 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-2.5 text-center text-base text-slate-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-800 text-base">
                        {u.name || "No Name"}
                      </div>
                      <div className="text-base text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-base font-black uppercase ${
                          u.role === "master_admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {u.role !== "master_admin" && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => updateRole(u.id, "admin")}
                            disabled={updatingUserId === u.id}
                            className="px-2 py-1 text-base font-bold bg-white border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingUserId === u.id ? "..." : "Set Admin"}
                          </button>
                          <button
                            onClick={() => updateRole(u.id, "user")}
                            disabled={updatingUserId === u.id}
                            className="px-2 py-1 text-base font-bold bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingUserId === u.id ? "..." : "Set User"}
                          </button>
                        </div>
                      )}
                      {u.role === "master_admin" && (
                        <span className="text-base text-slate-400 italic">
                          Protected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        // Changed here: call openBlockModal instead
                        onClick={() => openBlockModal(u)}
                        disabled={u.role === "master_admin"}
                        className={`p-1.5 rounded-lg border transition ${
                          u.is_blocked
                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                            : "bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={u.is_blocked ? "Unblock User" : "Block User"}
                      >
                        {u.is_blocked ? (
                          <UserMinus size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL UI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              
              {/* Icon */}
              <div
                className={`p-4 rounded-full mb-4 ${
                  selectedUser?.is_blocked
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {selectedUser?.is_blocked ? <UserCheck size={32} /> : <AlertTriangle size={32} />}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {selectedUser?.is_blocked
                  ? "Unblock User?"
                  : "Block & Kick User?"}
              </h3>

              {/* Description */}
              <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed">
                {selectedUser?.is_blocked
                  ? `Do you want to restore access for "${selectedUser?.name}"?`
                  : `User "${selectedUser?.name}" will be kicked out immediately and cannot log in until unblocked.`}
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalProcessing}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toggleBlockStatus(selectedUser.id, selectedUser.is_blocked);
                  }}
                  disabled={modalProcessing}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center ${
                    selectedUser?.is_blocked
                      ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                      : "bg-red-600 hover:bg-red-700 shadow-red-200"
                  }`}
                >
                  {modalProcessing ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}