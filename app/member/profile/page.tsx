"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, updatePassword } from "firebase/auth";
import Link from "next/link";

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({ id: user.uid, ...data });
          setNewName(data.fullName || "");
          setNewDept(data.department || "");
        }
      }
    });
    return () => unsub();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userProfile.id), { fullName: newName, department: newDept });
      if (newPass.length > 0) {
        if (newPass.length < 6) return alert("Şifre en az 6 karakter olmalı!");
        await updatePassword(auth.currentUser!, newPass);
      }
      alert("Bilgiler başarıyla güncellendi! ✅");
      setNewPass("");
    } catch (err: any) { alert("Hata: " + err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-16 text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <h1 className="text-5xl font-black text-[#1A458B] tracking-tighter uppercase italic">Profil</h1>
          <Link href="/member/events"><button className="bg-white p-5 rounded-3xl border border-slate-100 font-black text-xs text-slate-400 uppercase tracking-widest">← Geri</button></Link>
        </header>
        <div className="bg-white rounded-[50px] p-12 shadow-2xl border border-slate-50">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex justify-center mb-6"><div className="w-24 h-24 bg-gradient-to-br from-[#1A458B] to-[#40E0D0] rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-lg uppercase ring-8 ring-[#F8FAFC]">{newName?.[0] || "?"}</div></div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest font-sans">İsim Soyisim</label>
              <input type="text" value={newName || ""} onChange={e => setNewName(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] font-bold border-none font-sans" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest font-sans">Bölüm</label>
              <input type="text" value={newDept || ""} onChange={e => setNewDept(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] font-bold border-none font-sans" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest font-sans leading-none">Öğrenci No</label>
              <input type="text" readOnly value={userProfile?.studentId || ""} className="w-full p-5 bg-slate-100 rounded-3xl text-slate-300 font-bold border-none font-sans" />
            </div>
            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-black text-[#40E0D0] uppercase ml-2 tracking-widest font-sans leading-none">Yeni Şifre</label>
              <input type="password" value={newPass || ""} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#1A458B] font-bold border-none font-sans" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#1A458B] text-white py-6 rounded-3xl font-black shadow-xl hover:bg-[#40E0D0] hover:text-[#1A458B] transition-all uppercase tracking-widest text-sm font-sans">{loading ? "İŞLENİYOR..." : "KAYDET ✨"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}