"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dept, setDept] = useState("");
  const [phone, setPhone] = useState(""); // State zaten var, artık kullanıyoruz
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Kurumsal e-posta formatı oluşturuluyor
      const email = `${studentId}@erbakan.edu.tr`;
      
      // 1. Firebase Auth Kaydı
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Firestore'a Kullanıcı Bilgilerini Kaydetme
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: name,
        studentId: studentId,
        department: dept,
        phoneNumber: phone, // TELEFON NUMARASI BURAYA EKLENDİ ✨
        role: "member",
        createdAt: new Date().toISOString()
      });

      alert("Aramıza hoş geldin! Kaydın başarıyla oluşturuldu. 🎉");
      router.push("/member/events");
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[50px] p-12 shadow-2xl shadow-blue-100 border border-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <h2 className="text-[#1A458B] text-4xl font-black uppercase tracking-tighter">NEÜ GELİŞİM</h2>
          <p className="text-[#40E0D0] font-bold text-sm mt-2 tracking-widest uppercase">Yeni Üye Kaydı</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Ad Soyad</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] border-none font-bold" placeholder="Adınız ve Soyadınız" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Öğrenci Numarası</label>
            <input type="text" value={studentId} onChange={e=>setStudentId(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] border-none font-bold" placeholder="Öğrenci No" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bölüm</label>
            <input type="text" value={dept} onChange={e=>setDept(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] border-none font-bold" placeholder="Bölümünüz" required />
          </div>

          {/* TELEFON NUMARASI GİRİŞ ALANI ✨ */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Telefon Numarası</label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] border-none font-bold" placeholder="05XX XXX XX XX" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Şifre Belirle</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#1A458B] border-none font-bold" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#1A458B] text-white py-6 rounded-3xl font-black shadow-xl hover:bg-[#40E0D0] hover:text-[#1A458B] transition-all uppercase tracking-widest text-sm mt-4">
            {loading ? "İŞLENİYOR..." : "Kayıt Ol ve Başla ✨"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">
            Zaten üye misin? <Link href="/" className="text-[#1A458B] hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}