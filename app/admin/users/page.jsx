"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import { UserMinus, UserCheck } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
  let isMounted = true; // ✅ ใช้ Flag เพื่อป้องกันการทำงานซ้ำ

  const checkPermissionAndFetch = async () => {
    // 1. ถ้ายังไม่มี user หรือสิทธิ์ยังไม่โหลด ให้รอตัวถัดไป
    if (!currentUser) return;

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (!isMounted) return;

      if (error || userData?.role !== "master_admin") {
        // ✅ เช็คเพิ่มว่าถ้าไม่ใช่ master_admin จริงๆ ถึงจะแจ้งเตือน
        toast.error("Access Denied: Master Admin only!", { id: "access-denied" }); // ใช้ id เพื่อให้ toast ทับอันเดิม ไม่ขึ้นซ้ำ
        router.replace("/admin");
        return;
      }

      // 2. ถ้าเป็น Master Admin จริง ถึงจะโหลดรายชื่อ
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  checkPermissionAndFetch();

  return () => {
    isMounted = false; // ✅ Cleanup เมื่อ Component Unmount
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

  // ✅ ฟังก์ชันเปลี่ยน Role + Sync กับ Clerk
  const updateRole = async (userId, targetRole) => {
    setUpdatingUserId(userId);
    
    try {
      // 1. หา clerk_id ของ user คนนั้น
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser?.clerk_id) {
        throw new Error("Clerk ID not found");
      }

      // 2. อัพเดท Role ใน Supabase
      const { error: supabaseError } = await supabase
        .from("users")
        .update({ role: targetRole })
        .eq("id", userId);

      if (supabaseError) throw supabaseError;

      // 3. ✅ Sync Role ไปที่ Clerk ผ่าน API Route
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

      // 4. อัพเดท UI
      setUsers(users.map(u => u.id === userId ? { ...u, role: targetRole } : u));
      toast.success(`Role updated to ${targetRole} successfully!`);
    } catch (error) {
      console.error("Update Role Error:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ✅ ฟังก์ชัน Block/Unblock User
  const toggleBlockStatus = async (userId, currentBlockStatus) => {
    try {
      const newStatus = !currentBlockStatus;
      
      const { error } = await supabase
        .from("users")
        .update({ is_blocked: newStatus })
        .eq("id", userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: newStatus } : u));
      toast.success(newStatus ? "User blocked" : "User unblocked");
    } catch (error) {
      toast.error("Failed to update block status");
    }
  };

  // ✅ Filter Users
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
      <PageTitle heading="Master Control" text="Manage Admins and User Access" />
      
      {/* Search Bar */}
      <div className="mt-8 mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Set Role</th>
                <th className="px-6 py-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-xs">{u.name || "No Name"}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        u.role === 'master_admin' ? 'bg-indigo-100 text-indigo-700' : 
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'master_admin' && (
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => updateRole(u.id, 'admin')} 
                            disabled={updatingUserId === u.id}
                            className="px-2 py-1 text-[9px] font-bold bg-white border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingUserId === u.id ? "..." : "Set Admin"}
                          </button>
                          <button 
                            onClick={() => updateRole(u.id, 'user')} 
                            disabled={updatingUserId === u.id}
                            className="px-2 py-1 text-[9px] font-bold bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingUserId === u.id ? "..." : "Set User"}
                          </button>
                        </div>
                      )}
                      {u.role === 'master_admin' && (
                        <span className="text-[9px] text-slate-400 italic">Protected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleBlockStatus(u.id, u.is_blocked)}
                        disabled={u.role === 'master_admin'}
                        className={`p-1.5 rounded-lg border transition ${
                          u.is_blocked 
                            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                            : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={u.is_blocked ? "Unblock User" : "Block User"}
                      >
                        {u.is_blocked ? <UserMinus size={16} /> : <UserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}