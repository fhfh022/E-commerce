"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import { UserMinus, UserCheck, AlertTriangle, Search, ShieldAlert } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // State สำหรับ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalProcessing, setModalProcessing] = useState(false);

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
          toast.error("ปฏิเสธการเข้าถึง: สำหรับ Master Admin เท่านั้น!", {
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
      toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, targetRole) => {
    setUpdatingUserId(userId);

    try {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser?.clerk_id) {
        throw new Error("ไม่พบ Clerk ID");
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
        throw new Error(result.error || "การซิงค์ข้อมูลกับ Clerk ล้มเหลว");
      }

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      toast.success(`อัปเดตสิทธิ์เป็น ${targetRole} เรียบร้อยแล้ว!`);
    } catch (error) {
      console.error("Update Role Error:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปเดตสิทธิ์");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const openBlockModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const toggleBlockStatus = async (userId, currentBlockStatus) => {
    setModalProcessing(true);
    try {
      const newStatus = !currentBlockStatus;
      
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser?.clerk_id) {
        toast.error("ไม่พบ Clerk ID สำหรับผู้ใช้นี้");
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "การซิงค์ข้อมูลกับ Clerk ล้มเหลว");
      }

      // 3. Update UI
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_blocked: newStatus } : u
        )
      );
      toast.success(
        newStatus ? "บล็อกและตัดผู้ใช้ออกจากระบบแล้ว!" : "ปลดบล็อกผู้ใช้แล้ว"
      );
      
      setIsModalOpen(false); 

    } catch (error) {
      console.error("Block Error:", error);
      toast.error(error.message);
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
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 animate-in fade-in duration-500">
      <PageTitle
        heading="จัดการผู้ใช้งาน (Master Control)"
        text="จัดการสิทธิ์แอดมินและการเข้าถึงระบบ"
      />

      <div className="mt-8 mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="ค้นหาชื่อ หรือ อีเมล..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-sm uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">ผู้ใช้งาน</th>
                <th className="px-6 py-4">สิทธิ์ปัจจุบัน</th>
                <th className="px-6 py-4 text-right">กำหนดสิทธิ์</th>
                <th className="px-6 py-4 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {u.name || "ไม่ระบุชื่อ"}
                      </div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wide ${
                          u.role === "master_admin"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : u.role === "admin"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {u.role === "master_admin" ? "Master Admin" : u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== "master_admin" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateRole(u.id, "admin")}
                            disabled={updatingUserId === u.id}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                                u.role === "admin" 
                                    ? "bg-purple-50 border-purple-200 text-purple-600 opacity-50 cursor-default"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                            }`}
                          >
                            {updatingUserId === u.id ? "กำลังโหลด..." : "ตั้งเป็น Admin"}
                          </button>
                          <button
                            onClick={() => updateRole(u.id, "user")}
                            disabled={updatingUserId === u.id}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                                u.role === "user" || !u.role
                                    ? "bg-slate-100 border-slate-200 text-slate-500 opacity-50 cursor-default"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                          >
                            {updatingUserId === u.id ? "กำลังโหลด..." : "ตั้งเป็น User"}
                          </button>
                        </div>
                      )}
                      {u.role === "master_admin" && (
                        <span className="flex items-center justify-end gap-1 text-sm text-slate-400 italic">
                          <ShieldAlert size={14} /> สงวนสิทธิ์
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openBlockModal(u)}
                        disabled={u.role === "master_admin"}
                        className={`p-2 rounded-lg border transition ${
                          u.is_blocked
                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                            : "bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={u.is_blocked ? "ปลดบล็อกผู้ใช้" : "บล็อกผู้ใช้"}
                      >
                        {u.is_blocked ? (
                          <UserMinus size={18} />
                        ) : (
                          <UserCheck size={18} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-in zoom-in-95">
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
                  ? "ปลดบล็อกผู้ใช้?"
                  : "บล็อกและตัดออกจากระบบ?"}
              </h3>

              {/* Description */}
              <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed">
                {selectedUser?.is_blocked
                  ? <span>คุณต้องการคืนสิทธิ์การใช้งานให้กับ <br/><span className="font-bold text-slate-800">"{selectedUser?.name}"</span> ใช่หรือไม่?</span>
                  : <span>ผู้ใช้ <span className="font-bold text-slate-800">"{selectedUser?.name}"</span> จะถูกตัดออกจากระบบทันที และไม่สามารถเข้าใช้งานได้จนกว่าจะปลดบล็อก</span>}
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalProcessing}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  ยกเลิก
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
                    "ยืนยัน"
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