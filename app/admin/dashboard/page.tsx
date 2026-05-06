"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, addDoc, deleteDoc, doc, updateDoc, 
  onSnapshot, setDoc, arrayUnion, arrayRemove, getDoc 
} from "firebase/firestore";
import { signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Giriş Yap State'leri
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Etkinlik Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quota, setQuota] = useState<string>("");

  // Galeri Yönetim State
  const [managingGallery, setManagingGallery] = useState<any>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Katılımcı Yönetim State
  const [managingAttendees, setManagingAttendees] = useState<any>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Üye State (Ekleme & Düzenleme)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newDept, setNewDept] = useState(""); 
  const [newPhone, setNewPhone] = useState(""); // YENİ: Telefon numarası state'i
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("member");

  // Auth ve Veri Dinleme
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          alert("Bu alana yalnızca adminler erişebilir!");
          await signOut(auth);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribeAuth(); unsubEvents(); unsubUsers(); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        setIsAdmin(true);
      } else {
        alert("Yetkisiz giriş denemesi! Sadece adminler erişebilir.");
        await signOut(auth);
        setIsAdmin(false);
      }
    } catch (err: any) {
      alert("Hatalı giriş: " + err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (confirm("Oturumu kapatmak istediğine emin misin?")) {
      await signOut(auth);
      setIsAdmin(false);
      router.push("/");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "events"), { 
        title, date, description: desc, imageUrl, gallery: [], attendees: [], quota: quota ? Number(quota) : null
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
        phoneNumber: newPhone, // YENİ: Veritabanına kaydet
        role: newRole, 
        createdAt: new Date().toISOString()
      });
      alert("Üye başarıyla eklendi! 🎉");
      setIsAddModalOpen(false);
      setNewName(""); setNewStudentId(""); setNewDept(""); setNewPhone(""); setNewPassword("");
    } catch (err: any) { alert("Hata: " + err.message); }
    setLoading(false);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", editingMember.id), { 
        fullName: newName, 
        studentId: newStudentId, 
        department: newDept, 
        phoneNumber: newPhone, // YENİ: Veritabanında güncelle
        role: newRole 
      });
      alert("Üye başarıyla güncellendi! ✅");
      setEditingMember(null);
      setNewName(""); setNewStudentId(""); setNewDept(""); setNewPhone("");
    } catch (err) { alert("Güncellenirken hata oluştu!"); }
    setLoading(false);
  };

  const handleAddAttendee = async () => {
    if (!selectedMemberId) return alert("Lütfen bir üye seçin!");
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const isAlreadyAttendee = managingAttendees.attendees?.some((a: any) => a.studentId === member.studentId);
    if (isAlreadyAttendee) return alert("Bu üye zaten etkinliğe kayıtlı!");

    if (managingAttendees.quota && (managingAttendees.attendees?.length || 0) >= managingAttendees.quota) {
      return alert("Kontenjan dolu!");
    }

    try {
      const eventRef = doc(db, "events", managingAttendees.id);
      const newAttendee = {
        name: member.fullName,
        studentId: member.studentId,
        department: member.department || "Belirtilmemiş",
        phoneNumber: member.phoneNumber || "Belirtilmemiş", // YENİ: Katılımcıya telefonu ekle
        time: new Date().toISOString()
      };
      await updateDoc(eventRef, { attendees: arrayUnion(newAttendee) });
      setManagingAttendees({
        ...managingAttendees,
        attendees: [...(managingAttendees.attendees || []), newAttendee]
      });
      setSelectedMemberId("");
      alert("Katılımcı eklendi! 🎉");
    } catch (err) { alert("Hata oluştu."); }
  };

  const handleRemoveAttendee = async (attendee: any) => {
    if (!confirm("Katılımcıyı silmek istediğine emin misin?")) return;
    try {
      const eventRef = doc(db, "events", managingAttendees.id);
      await updateDoc(eventRef, { attendees: arrayRemove(attendee) });
      setManagingAttendees({
        ...managingAttendees,
        attendees: managingAttendees.attendees.filter((a: any) => a.studentId !== attendee.studentId)
      });
      alert("Katılımcı silindi! 🗑️");
    } catch (err) { alert("Silinirken hata oluştu."); }
  };

  if (isAdmin === null) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="text-[#1A458B] font-black text-xl tracking-widest animate-pulse font-sans">YÜKLENİYOR...</div></div>;

  if (isAdmin === false) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-800 font-sans">
      <form onSubmit={handleLogin} className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-2xl animate-in fade-in duration-500">
        <div className="mb-8 text-center"><h2 className="text-[#1A458B] text-4xl font-black uppercase tracking-tighter italic">Admin Girişi</h2></div>
        <div className="space-y-4">
          <input type="email" placeholder="E-posta Adresi" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
          <input type="password" placeholder="Şifre" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
          <button type="submit" disabled={loading} className="w-full bg-[#1A458B] text-white py-5 rounded-3xl font-black">{loading ? "İŞLENİYOR..." : "Giriş Yap 🚀"}</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      <aside className="w-80 bg-[#1A458B] p-10 flex flex-col shadow-2xl fixed h-full z-30">
        <div className="mb-12"><h2 className="text-[#40E0D0] text-3xl font-black uppercase tracking-tighter leading-none">NEÜ <br/> GELİŞİM</h2></div>
        <nav className="space-y-4 flex-1">
          <button onClick={() => setActiveTab("events")} className={`w-full p-5 rounded-3xl font-bold transition-all ${activeTab === 'events' ? 'bg-white text-[#1A458B]' : 'text-blue-100'}`}>📅 Etkinlikler</button>
          <button onClick={() => setActiveTab("members")} className={`w-full p-5 rounded-3xl font-bold transition-all ${activeTab === 'members' ? 'bg-white text-[#1A458B]' : 'text-blue-100'}`}>👥 Üyeler</button>
        </nav>
        <button onClick={handleLogout} className="mb-4 w-full p-5 text-red-400 rounded-3xl font-black text-xs">Oturumu Kapat 🔒</button>
        <Link href="/member/events" className="p-5 bg-white/10 rounded-3xl text-white text-center font-black text-sm uppercase">🌐 SİTEYİ GÖR</Link>
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
                  <input type="text" placeholder="Kapak URL (Cloudinary)" value={imageUrl || ""} onChange={e=>setImageUrl(e.target.value)} className="p-5 bg-slate-50 rounded-2xl outline-none" />
                  <input type="number" placeholder="Kontenjan (Boş bırakırsan sınırsız)" value={quota || ""} onChange={e=>setQuota(e.target.value)} className="p-5 bg-slate-50 rounded-2xl outline-none font-sans font-bold" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#1A458B] text-white py-5 rounded-3xl font-black uppercase tracking-widest">{loading ? "İŞLENİYOR..." : "Yayına Al 🚀"}</button>
              </form>
            </div>
            
            <div className="grid gap-6">
              {events.map(ev => (
                <div key={ev.id} className="bg-white p-6 rounded-[35px] shadow-sm flex items-center justify-between border">
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
                    <button onClick={() => setManagingAttendees(ev)} className="bg-green-50 text-green-600 px-6 py-4 rounded-2xl font-black text-xs hover:bg-green-600 hover:text-white transition-all uppercase tracking-widest font-sans">👥 Katılımcılar</button>
                    <button onClick={() => setManagingGallery(ev)} className="bg-blue-50 text-[#1A458B] px-6 py-4 rounded-2xl font-black text-xs hover:bg-[#1A458B] hover:text-white transition-all uppercase tracking-widest">📸 Galeri</button>
                    <button onClick={() => {if(confirm("Silinsin mi?")) deleteDoc(doc(db, "events", ev.id))}} className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl font-black">✕</button>
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
                <thead><tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] font-sans"><th className="p-10">Üye Bilgisi</th><th className="p-10">İletişim & Numara</th><th className="p-10 text-center font-sans">İşlem</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="p-10 flex items-center gap-5">
                        <div className="w-12 h-12 bg-[#1A458B] text-[#40E0D0] rounded-xl flex items-center justify-center font-black">{m.fullName?.[0] || "?"}</div>
                        <div><p className="font-black text-lg tracking-tight">{m.fullName}</p><span className="text-[10px] text-[#40E0D0] font-black uppercase tracking-widest font-sans">{m.department || "Bölüm Yok"}</span></div>
                      </td>
                      <td className="p-10">
                        <div className="font-bold text-slate-600 text-lg">{m.studentId}</div>
                        <div className="text-xs text-slate-400 mt-1 font-bold">📞 {m.phoneNumber || "Belirtilmemiş"}</div>
                      </td>
                      <td className="p-10"><div className="flex justify-center gap-3">
                        <button onClick={() => {setEditingMember(m); setNewName(m.fullName); setNewStudentId(m.studentId); setNewDept(m.department || ""); setNewPhone(m.phoneNumber || ""); setNewRole(m.role || "member");}} className="p-4 bg-blue-50 text-[#1A458B] rounded-2xl font-black text-[10px] uppercase hover:bg-[#1A458B] hover:text-white transition-all">Edit</button>
                        <button onClick={() => {if(confirm("Silinsin mi?")) deleteDoc(doc(db, "users", m.id))}} className="p-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all">Sil</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* KATILIMCI YÖNETİM MODALI */}
      {managingAttendees && (
        <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-2xl rounded-[50px] p-12 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-3xl font-black text-[#1A458B] mb-2 uppercase tracking-tighter">{managingAttendees.title}</h3>
            <p className="text-slate-400 text-sm mb-6 font-bold uppercase tracking-widest font-sans">
              {managingAttendees.quota ? `${managingAttendees.attendees?.length || 0} / ${managingAttendees.quota} Kontenjan` : `${managingAttendees.attendees?.length || 0} Kayıtlı`}
            </p>

            <div className="flex gap-3 mb-8">
              <select value={selectedMemberId} onChange={e=>setSelectedMemberId(e.target.value)} className="flex-1 p-5 bg-slate-50 rounded-3xl outline-none font-sans font-bold text-sm">
                <option value="">Bir üye seçin...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName} ({m.studentId})</option>
                ))}
              </select>
              <button onClick={handleAddAttendee} className="bg-[#1A458B] text-white px-8 rounded-3xl font-black text-xs uppercase font-sans tracking-widest">Ekle</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 divide-y divide-slate-100">
              {managingAttendees.attendees && managingAttendees.attendees.length > 0 ? (
                managingAttendees.attendees.map((attendee: any, index: number) => (
                  <div key={index} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-black text-base text-slate-800">{attendee.name}</p>
                      <p className="text-xs text-slate-400 font-bold font-sans">
                        {attendee.studentId} • {attendee.department} <br/>
                        <span className="text-[#1A458B]">📞 {attendee.phoneNumber || "Belirtilmemiş"}</span>
                      </p>
                    </div>
                    <button onClick={() => handleRemoveAttendee(attendee)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white font-black text-xs font-sans">Kaldır</button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-300 font-black text-sm tracking-widest font-sans">HİÇ KATILIMCI YOK</div>
              )}
            </div>

            <button onClick={() => setManagingAttendees(null)} className="mt-8 w-full py-5 rounded-3xl font-black text-slate-400 border uppercase text-xs font-sans">Kapat</button>
          </div>
        </div>
      )}

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

      {/* ÜYE EKLEME MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
          <form onSubmit={handleAddMember} className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-2xl">
            <h3 className="text-3xl font-black text-[#1A458B] mb-8 uppercase tracking-tighter italic">Yeni Kayıt</h3>
            <div className="space-y-4">
              <input type="text" value={newName || ""} onChange={e=>setNewName(e.target.value)} placeholder="Ad Soyad" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <input type="text" value={newStudentId || ""} onChange={e=>setNewStudentId(e.target.value)} placeholder="Öğrenci No" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <input type="text" value={newDept || ""} onChange={e=>setNewDept(e.target.value)} placeholder="Bölüm" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <input type="tel" value={newPhone || ""} onChange={e=>setNewPhone(e.target.value)} placeholder="Telefon Numarası (Örn: 05XX...)" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <input type="password" value={newPassword || ""} onChange={e=>setNewPassword(e.target.value)} placeholder="Şifre" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <select value={newRole || "member"} onChange={e=>setNewRole(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold"><option value="member">MEMBER</option><option value="admin">ADMIN</option></select>
              <div className="flex gap-4 pt-6"><button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 font-black text-slate-400 uppercase text-xs">İptal</button><button type="submit" disabled={loading} className="flex-1 bg-[#1A458B] text-white p-5 rounded-3xl font-black uppercase text-xs">Kaydet ✨</button></div>
            </div>
          </form>
        </div>
      )}

      {/* ÜYE DÜZENLEME MODALI */}
      {editingMember && (
        <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
          <form onSubmit={handleUpdateMember} className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-2xl">
            <h3 className="text-3xl font-black text-[#1A458B] mb-8 uppercase tracking-tighter italic">Bilgileri Güncelle</h3>
            <div className="space-y-4">
              <input type="text" value={newName || ""} onChange={e=>setNewName(e.target.value)} placeholder="Ad Soyad" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <input type="text" value={newStudentId || ""} placeholder="Öğrenci No" className="w-full p-5 bg-slate-100 rounded-3xl outline-none cursor-not-allowed font-bold" readOnly />
              <input type="text" value={newDept || ""} onChange={e=>setNewDept(e.target.value)} placeholder="Bölüm" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <input type="tel" value={newPhone || ""} onChange={e=>setNewPhone(e.target.value)} placeholder="Telefon Numarası" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" required />
              <select value={newRole || "member"} onChange={e=>setNewRole(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold"><option value="member">MEMBER</option><option value="admin">ADMIN</option></select>
              <div className="flex gap-4 pt-6"><button type="button" onClick={() => setEditingMember(null)} className="flex-1 font-black text-slate-400 uppercase text-xs">İptal</button><button type="submit" disabled={loading} className="flex-1 bg-[#1A458B] text-white p-5 rounded-3xl font-black uppercase text-xs">Güncelle ✨</button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}