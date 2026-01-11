"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import Image from "next/image"; // ✅ เพิ่ม Image
import { UserMinus, UserCheck, AlertTriangle, Search, ShieldAlert, User, X, Clock, Mail, Shield } from "lucide-react"; // ✅ เพิ่ม Icon

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // State สำหรับ Block Modal
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);
  const [blockProcessing, setBlockProcessing] = useState(false);

  // ✅ State สำหรับ Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

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
    setSelectedUserForBlock(user);
    setIsBlockModalOpen(true);
  };

  // ✅ ฟังก์ชันเปิด Modal ดูรายละเอียด
  const openDetailModal = (user) => {
    setSelectedUserDetail(user);
    setIsDetailModalOpen(true);
  };

  const toggleBlockStatus = async (userId, currentBlockStatus) => {
    setBlockProcessing(true);
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
      
      setIsBlockModalOpen(false); 

    } catch (error) {
      console.error("Block Error:", error);
      toast.error(error.message);
    } finally {
      setBlockProcessing(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper สำหรับ Format วันที่
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

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
                    <td className="px-6 py-4 cursor-pointer group" onClick={() => openDetailModal(u)}>
                      <div className="font-bold text-slate-800 group-hover:text-blue-600 transition">
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

      {/* ✅ DETAIL MODAL */}
      {isDetailModalOpen && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95">
            
            {/* Header / Cover */}
            <div className="bg-slate-100 h-24 relative">
                <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Avatar & Main Info */}
            <div className="px-6 pb-6 -mt-12 text-center">
                <div className="relative size-24 mx-auto rounded-full border-4 border-white shadow-md bg-white overflow-hidden mb-3 flex items-center justify-center">
                    {selectedUserDetail.avatar ? (
                        <Image 
                            src={selectedUserDetail.avatar} 
                            alt={selectedUserDetail.name} 
                            fill 
                            className="object-cover" 
                        />
                    ) : (
                        <User size={40} className="text-slate-300" />
                    )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800">{selectedUserDetail.name || "ไม่ระบุชื่อ"}</h3>
                <p className="text-slate-500 text-sm mb-4">{selectedUserDetail.email}</p>

                {/* Status Badge */}
                <div className="flex justify-center gap-2 mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        selectedUserDetail.is_blocked 
                        ? "bg-red-50 text-red-600 border-red-200" 
                        : "bg-green-50 text-green-600 border-green-200"
                    }`}>
                        {selectedUserDetail.is_blocked ? "ถูกระงับการใช้งาน" : "ใช้งานปกติ"}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        selectedUserDetail.role === 'master_admin' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                        selectedUserDetail.role === 'admin' ? "bg-purple-50 text-purple-600 border-purple-200" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                        {selectedUserDetail.role === 'master_admin' ? "Master Admin" : selectedUserDetail.role === 'admin' ? "Admin" : "User"}
                    </span>
                </div>

                {/* Detail List */}
                <div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Shield size={16} className="text-slate-400" />
                        <span className="font-medium w-24">Clerk ID:</span>
                        <span className="text-slate-500 font-mono text-xs truncate">{selectedUserDetail.clerk_id || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-medium w-24">สมัครเมื่อ:</span>
                        <span>{formatDate(selectedUserDetail.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-medium w-24">อัปเดตล่าสุด:</span>
                        <span>{formatDate(selectedUserDetail.updated_at || selectedUserDetail.created_at)}</span>
                    </div>
                </div>
            </div>

          </div>
        </div>
      )}

      {/* BLOCK MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              
              <div
                className={`p-4 rounded-full mb-4 ${
                  selectedUserForBlock?.is_blocked
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {selectedUserForBlock?.is_blocked ? <UserCheck size={32} /> : <AlertTriangle size={32} />}
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {selectedUserForBlock?.is_blocked
                  ? "ปลดบล็อกผู้ใช้?"
                  : "บล็อกและตัดออกจากระบบ?"}
              </h3>

              <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed">
                {selectedUserForBlock?.is_blocked
                  ? <span>คุณต้องการคืนสิทธิ์การใช้งานให้กับ <br/><span className="font-bold text-slate-800">"{selectedUserForBlock?.name}"</span> ใช่หรือไม่?</span>
                  : <span>ผู้ใช้ <span className="font-bold text-slate-800">"{selectedUserForBlock?.name}"</span> จะถูกตัดออกจากระบบทันที และไม่สามารถเข้าใช้งานได้จนกว่าจะปลดบล็อก</span>}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  disabled={blockProcessing}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    toggleBlockStatus(selectedUserForBlock.id, selectedUserForBlock.is_blocked);
                  }}
                  disabled={blockProcessing}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center ${
                    selectedUserForBlock?.is_blocked
                      ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                      : "bg-red-600 hover:bg-red-700 shadow-red-200"
                  }`}
                >
                  {blockProcessing ? (
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