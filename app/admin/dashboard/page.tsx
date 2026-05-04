"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, addDoc, deleteDoc, doc, updateDoc, 
  onSnapshot, setDoc, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Etkinlik Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quota, setQuota] = useState<string>("");

  // Galeri Yönetim State
  const [managingGallery, setManagingGallery] = useState<any>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Üye State (Ekleme & Düzenleme)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newDept, setNewDept] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("member");

  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubEvents(); unsubUsers(); };
  }, []);

  const handleLogout = async () => {
    if (confirm("Oturumu kapatmak istediğine emin misin?")) {
      await signOut(auth);
      router.push("/");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "events"), { 
        title, 
        date, 
        description: desc, 
        imageUrl, 
        gallery: [], 
        attendees: [],
        quota: quota ? Number(quota) : null
      });
      alert("Etkinlik oluşturuldu! ✨");
      setTitle(""); setDate(""); setDesc(""); setImageUrl(""); setQuota("");
    } catch (err) { alert("Hata!"); }
    setLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = `${newStudentId}@erbakan.edu.tr`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, newPassword);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: newName, 
        studentId: newStudentId, 
        department: newDept, 
        role: newRole, 
        createdAt: new Date().toISOString()
      });
      alert("Üye başarıyla eklendi! 🎉");
      setIsAddModalOpen(false);
      setNewName(""); setNewStudentId(""); setNewDept(""); setNewPassword("");
    } catch (err: any) { alert("Hata: " + err.message); }
    setLoading(false);
  };

  // ÜYE GÜNCELLEME FONKSİYONU
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", editingMember.id), { 
        fullName: newName, 
        studentId: newStudentId, 
        department: newDept, 
        role: newRole 
      });
      alert("Üye başarıyla güncellendi! ✅");
      setEditingMember(null);
      setNewName(""); setNewStudentId(""); setNewDept("");
    } catch (err) { alert("Güncellenirken hata oluştu!"); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      <aside className="w-80 bg-[#1A458B] p-10 flex flex-col shadow-2xl fixed h-full z-30">
        <div className="mb-12"><h2 className="text-[#40E0D0] text-3xl font-black uppercase tracking-tighter leading-none">NEÜ <br/> GELİŞİM</h2></div>
        <nav className="space-y-4 flex-1">
          <button onClick={() => setActiveTab("events")} className={`w-full p-5 rounded-3xl font-bold transition-all ${activeTab === 'events' ? 'bg-white text-[#1A458B] shadow-xl' : 'text-blue-100 hover:bg-white/10'}`}>📅 Etkinlikler</button>
          <button onClick={() => setActiveTab("members")} className={`w-full p-5 rounded-3xl font-bold transition-all ${activeTab === 'members' ? 'bg-white text-[#1A458B] shadow-xl' : 'text-blue-100 hover:bg-white/10'}`}>👥 Üyeler</button>
        </nav>
        <button onClick={handleLogout} className="mb-4 w-full p-5 bg-red-500/10 text-red-400 rounded-3xl font-black text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20">Oturumu Kapat 🔒</button>
        <Link href="/member/events" className="p-5 bg-white/10 rounded-3xl text-white text-center font-black text-sm uppercase group hover:bg-[#40E0D0] transition-all">🌐 SİTEYİ GÖR</Link>
      </aside>

      <main className="ml-80 flex-1 p-16">
        {activeTab === "events" ? (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
            <h1 className="text-4xl font-black text-[#1A458B] mb-12 uppercase tracking-tighter italic">Etkinlik Yönetimi</h1>
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 mb-16">
              <form onSubmit={handleAddEvent} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="Başlık" value={title || ""} onChange={e=>setTitle(e.target.value)} className="p-5 bg-slate-50 rounded-2xl outline-none font-sans font-bold" required />
                  <input type="date" value={date || ""} onChange={e=>setDate(e.target.value)} className="p-5 bg-slate-50 rounded-2xl outline-none font-sans font-bold" required />
                </div>
                <textarea placeholder="Açıklama..." value={desc || ""} onChange={e=>setDesc(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl h-32 outline-none border-none resize-none font-sans font-bold" />
                <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="Kapak URL (Cloudinary)" value={imageUrl || ""} onChange={e=>setImageUrl(e.target.value)} className="p-5 bg-slate-50 rounded-2xl outline-none border-2 border-dashed border-blue-100 font-sans" />
                  <input type="number" placeholder="Kontenjan (Boş bırakırsan sınırsız)" value={quota || ""} onChange={e=>setQuota(e.target.value)} className="p-5 bg-slate-50 rounded-2xl outline-none border-none font-sans font-bold" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#1A458B] text-white py-5 rounded-3xl font-black shadow-lg hover:bg-blue-900 transition-all uppercase tracking-widest">{loading ? "İŞLENİYOR..." : "Yayına Al 🚀"}</button>
              </form>
            </div>
            
            <div className="grid gap-6">
              {events.map(ev => (
                <div key={ev.id} className="bg-white p-6 rounded-[35px] shadow-sm flex items-center justify-between border border-slate-50 hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                      {ev.imageUrl ? <img src={ev.imageUrl} className="w-full h-full object-cover" /> : <div className="text-[10px] text-slate-300 font-black h-full flex items-center justify-center">FOTO YOK</div>}
                    </div>
                    <div>
                      <h4 className="font-black text-2xl text-slate-800 tracking-tight uppercase italic">{ev.title}</h4>
                      <p className="text-sm font-black text-[#40E0D0] uppercase tracking-widest mt-1 font-sans">
                        📅 {ev.date} • {ev.quota ? `${ev.attendees?.length || 0} / ${ev.quota} Kontenjan` : `${ev.attendees?.length || 0} Katılımcı`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setManagingGallery(ev)} className="bg-blue-50 text-[#1A458B] px-6 py-4 rounded-2xl font-black text-xs hover:bg-[#1A458B] hover:text-white transition-all uppercase font-sans tracking-widest">📸 Galeri</button>
                    <button onClick={() => {if(confirm("Silinsin mi?")) deleteDoc(doc(db, "events", ev.id))}} className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-black">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-right-5 duration-700">
            <header className="flex justify-between items-center mb-12">
              <h1 className="text-4xl font-black text-[#1A458B] uppercase tracking-tighter italic">Topluluk Üyeleri</h1>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-[#40E0D0] text-[#1A458B] px-8 py-4 rounded-3xl font-black shadow-lg uppercase text-xs tracking-widest">+ Yeni Kayıt</button>
            </header>
            <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden text-slate-700">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] font-sans"><th className="p-10">Üye Bilgisi</th><th className="p-10">Numara</th><th className="p-10 text-center font-sans">İşlem</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="p-10 flex items-center gap-5">
                        <div className="w-12 h-12 bg-[#1A458B] text-[#40E0D0] rounded-xl flex items-center justify-center font-black">{m.fullName?.[0] || "?"}</div>
                        <div><p className="font-black text-lg tracking-tight">{m.fullName}</p><span className="text-[10px] text-[#40E0D0] font-black uppercase tracking-widest font-sans">{m.department || "Bölüm Yok"}</span></div>
                      </td>
                      <td className="p-10 font-bold text-slate-500 text-lg">{m.studentId}</td>
                      <td className="p-10"><div className="flex justify-center gap-3">
                        <button onClick={() => {setEditingMember(m); setNewName(m.fullName); setNewStudentId(m.studentId); setNewDept(m.department || ""); setNewRole(m.role || "member");}} className="p-4 bg-blue-50 text-[#1A458B] rounded-2xl font-black text-[10px] uppercase tracking-tighter hover:bg-[#1A458B] hover:text-white transition-all">Edit</button>
                        <button onClick={() => {if(confirm("Silinsin mi?")) deleteDoc(doc(db, "users", m.id))}} className="p-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-tighter hover:bg-red-500 hover:text-white transition-all">Sil</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* GALERİ MODALI */}
      {managingGallery && (
        <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-2xl rounded-[50px] p-12 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-3xl font-black text-[#1A458B] mb-2 uppercase tracking-tighter">Galeri Yönetimi</h3>
            <div className="flex gap-3 mb-8">
              <input type="text" value={newGalleryUrl || ""} onChange={e=>setNewGalleryUrl(e.target.value)} placeholder="Foto URL" className="flex-1 p-5 bg-slate-50 rounded-3xl outline-none font-sans" />
              <button onClick={() => {if(newGalleryUrl) updateDoc(doc(db, "events", managingGallery.id), { gallery: arrayUnion(newGalleryUrl) }); setNewGalleryUrl("");}} className="bg-[#1A458B] text-white px-8 rounded-3xl font-black text-xs uppercase font-sans">Ekle</button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 pr-2">
              {managingGallery.gallery?.map((url: string, index: number) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border">
                  <img src={url} className="w-full h-full object-cover" />
                  <button onClick={() => updateDoc(doc(db, "events", managingGallery.id), { gallery: arrayRemove(url) })} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setManagingGallery(null)} className="mt-8 w-full py-5 rounded-3xl font-black text-slate-400 border uppercase text-xs font-sans">Kapat</button>
          </div>
        </div>
      )}

      {/* YENİ ÜYE EKLEME MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
          <form onSubmit={handleAddMember} className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-[#1A458B] mb-8 uppercase tracking-tighter italic">Yeni Kayıt</h3>
            <div className="space-y-4">
              <input type="text" value={newName || ""} onChange={e=>setNewName(e.target.value)} placeholder="Ad Soyad" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold border-none focus:ring-2 focus:ring-[#40E0D0]" required />
              <input type="text" value={newStudentId || ""} onChange={e=>setNewStudentId(e.target.value)} placeholder="Öğrenci No" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold border-none focus:ring-2 focus:ring-[#40E0D0]" required />
              <input type="text" value={newDept || ""} onChange={e=>setNewDept(e.target.value)} placeholder="Bölüm" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold border-none focus:ring-2 focus:ring-[#40E0D0]" required />
              <input type="password" value={newPassword || ""} onChange={e=>setNewPassword(e.target.value)} placeholder="Şifre" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold border-none focus:ring-2 focus:ring-[#40E0D0]" required />
              <select value={newRole || "member"} onChange={e=>setNewRole(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold border-none focus:ring-2 focus:ring-[#40E0D0]"><option value="member">MEMBER</option><option value="admin">ADMIN</option></select>
              <div className="flex gap-4 pt-6"><button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 font-black text-slate-400 uppercase text-xs">İptal</button><button type="submit" disabled={loading} className="flex-1 bg-[#1A458B] text-white p-5 rounded-3xl font-black uppercase text-xs shadow-lg">Kaydet ✨</button></div>
            </div>
          </form>
        </div>
      )}

      {/* ÜYE DÜZENLEME MODALI */}
      {editingMember && (
        <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
          <form onSubmit={handleUpdateMember} className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-[#1A458B] mb-8 uppercase tracking-tighter italic">Bilgileri Güncelle</h3>
            <div className="space-y-4">
              <input type="text" value={newName || ""} onChange={e=>setNewName(e.target.value)} placeholder="Ad Soyad" className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] border-none font-bold" required />
              <input type="text" value={newStudentId || ""} placeholder="Öğrenci No" className="w-full p-5 bg-slate-100 rounded-3xl outline-none border-none cursor-not-allowed font-bold" readOnly />
              <input type="text" value={newDept || ""} onChange={e=>setNewDept(e.target.value)} placeholder="Bölüm" className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-[#40E0D0] border-none font-bold" required />
              <select value={newRole || "member"} onChange={e=>setNewRole(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none border-none font-bold"><option value="member">MEMBER</option><option value="admin">ADMIN</option></select>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditingMember(null)} className="flex-1 font-black text-slate-400 uppercase text-xs">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#1A458B] text-white p-5 rounded-3xl font-black uppercase text-xs shadow-lg">Güncelle ✨</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}