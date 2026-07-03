"use client";
import { useState } from "react";
import { Share2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("คัดลอกลิงก์เรียบร้อยแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("คัดลอกลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-full font-bold shadow-sm hover:bg-slate-800 transition active:scale-95"
    >
      {copied ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
      {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
    </button>
  );
}
