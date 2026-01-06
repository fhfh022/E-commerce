import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Server } from 'lucide-react';

export const metadata = {
  title: "Privacy Policy - PRT Store",
  description: "นโยบายความเป็นส่วนตัวของ PRT Store",
};

export default function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* Header Section */}
      <div className="bg-slate-50 border-b border-slate-100 py-16 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          นโยบายความเป็นส่วนตัว
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          ที่ PRT Store เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ เรามุ่งมั่นที่จะปกป้องข้อมูลส่วนบุคคลของคุณและใช้อย่างโปร่งใสที่สุด
        </p>
        <p className="text-xs text-slate-400 mt-6">
          อัปเดตล่าสุด: 4 มกราคม 2026
        </p>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {/* 1. ข้อมูลที่เราเก็บรวบรวม */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Eye size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            เราเก็บรวบรวมข้อมูลที่คุณให้เราโดยตรงเมื่อคุณสมัครสมาชิก สั่งซื้อสินค้า หรือติดต่อเรา ข้อมูลเหล่านี้รวมถึง:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <li><span className="font-medium text-slate-800">ข้อมูลส่วนตัว:</span> ชื่อ, นามสกุล, ที่อยู่อีเมล, เบอร์โทรศัพท์</li>
            <li><span className="font-medium text-slate-800">ข้อมูลการจัดส่ง:</span> ที่อยู่สำหรับจัดส่งสินค้า และใบเสร็จรับเงิน</li>
            <li><span className="font-medium text-slate-800">ข้อมูลการสั่งซื้อ:</span> ประวัติการสั่งซื้อ รายการสินค้าที่สนใจ (Favorites)</li>
            <li><span className="font-medium text-slate-800">ข้อมูลทางเทคนิค:</span> IP Address, ประเภท Browser, และคุกกี้ (Cookies) เพื่อปรับปรุงประสบการณ์การใช้งาน</li>
          </ul>
        </section>

        {/* 2. การนำข้อมูลไปใช้ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Server size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">2. เราใช้ข้อมูลของคุณอย่างไร</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            ข้อมูลที่เราเก็บรวบรวมจะถูกนำไปใช้เพื่อวัตถุประสงค์ดังต่อไปนี้:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border border-slate-100 rounded-lg hover:shadow-sm transition">
                <h3 className="font-bold text-slate-700 mb-2">ดำเนินการคำสั่งซื้อ</h3>
                <p className="text-sm text-slate-500">ใช้เพื่อจัดส่งสินค้า ออกใบเสร็จ และแจ้งสถานะการจัดส่ง</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg hover:shadow-sm transition">
                <h3 className="font-bold text-slate-700 mb-2">บริการลูกค้า</h3>
                <p className="text-sm text-slate-500">ใช้เพื่อตอบคำถาม แก้ไขปัญหา และให้ความช่วยเหลือผ่านระบบแชท</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg hover:shadow-sm transition">
                <h3 className="font-bold text-slate-700 mb-2">ปรับปรุงเว็บไซต์</h3>
                <p className="text-sm text-slate-500">วิเคราะห์ข้อมูลการใช้งานเพื่อพัฒนาหน้าเว็บและสินค้าให้น่าสนใจยิ่งขึ้น</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg hover:shadow-sm transition">
                <h3 className="font-bold text-slate-700 mb-2">การตลาด (ถ้าคุณยินยอม)</h3>
                <p className="text-sm text-slate-500">ส่งข่าวสารโปรโมชั่น หรือสินค้าใหม่ผ่าน Newsletter</p>
            </div>
          </div>
        </section>

        {/* 3. ความปลอดภัยของข้อมูล */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">3. ความปลอดภัยของข้อมูล</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            เราใช้มาตรการรักษาความปลอดภัยที่ได้มาตรฐานสากลเพื่อปกป้องข้อมูลของคุณจากการเข้าถึงโดยไม่ได้รับอนุญาต 
            เราใช้การเข้ารหัสข้อมูล (Encryption) ในการส่งผ่านข้อมูล และจำกัดสิทธิ์การเข้าถึงข้อมูลเฉพาะพนักงานที่เกี่ยวข้องเท่านั้น
          </p>
        </section>

        {/* 4. การเปิดเผยข้อมูลต่อบุคคลภายนอก */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">4. การเปิดเผยข้อมูล</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            <span className="font-bold text-red-500">เราไม่มีนโยบายขายข้อมูลส่วนตัวของคุณให้กับบุคคลที่สาม</span> 
            อย่างไรก็ตาม เราอาจจำเป็นต้องส่งต่อข้อมูลบางส่วนให้กับพาร์ทเนอร์เพื่อดำเนินการให้บริการ เช่น:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 ml-4">
            <li>บริษัทขนส่ง (เพื่อจัดส่งสินค้า)</li>
            <li>ผู้ให้บริการรับชำระเงิน (Payment Gateway)</li>
            <li>หน่วยงานราชการ (หากมีคำขอตามกฎหมาย)</li>
          </ul>
        </section>

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">ติดต่อเรา</h3>
            <p className="text-slate-600 mb-6">
                หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อเราได้ที่:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 uppercase font-bold">Email</p>
                    <a href="mailto:support@prtstore.com" className="text-indigo-600 font-medium hover:underline">support@prtstore.com</a>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 uppercase font-bold">Phone</p>
                    <a href="tel:+66900000000" className="text-indigo-600 font-medium hover:underline">087-212-2444</a>
                </div>
            </div>
        </div>

        <div className="text-center mt-12">
            <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition hover:underline">
                &larr; กลับสู่หน้าหลัก
            </Link>
        </div>

      </div>
    </div>
  );
}