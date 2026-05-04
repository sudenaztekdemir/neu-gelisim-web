"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MemberEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joiningEvent, setJoiningEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserProfile(docSnap.data());
      }
    });
    const unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubAuth(); unsubEvents(); };
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); router.push("/"); } catch (err) { alert("Hata!"); }
  };

  const handleJoin = async () => {
    setLoading(true);
    try {
      const eventRef = doc(db, "events", joiningEvent.id);
      
      // YENİ: Anlık veri çekerek kontenjan doluluk kontrolü yapıyoruz
      const docSnap = await getDoc(eventRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        if (currentData.quota && (currentData.attendees?.length || 0) >= currentData.quota) {
          alert("Üzgünüz, bu etkinlik için kontenjan doldu!");
          setJoiningEvent(null);
          setLoading(false);
          return;
        }
      }

      await updateDoc(eventRef, {
        attendees: arrayUnion({ 
          name: userProfile.fullName, 
          studentId: userProfile.studentId,
          department: userProfile.department,
          time: new Date().toISOString() 
        })
      });
      alert("Harika! Kaydın yapıldı. 🎉");
      setJoiningEvent(null);
    } catch (err) { alert("Hata oluştu."); }
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredEvents = events.filter(ev => activeTab === "upcoming" ? ev.date >= today : ev.date < today).sort((a, b) => activeTab === "upcoming" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-16 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div><h1 className="text-5xl font-black text-[#1A458B] tracking-tighter uppercase leading-none italic">Takvim</h1></div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="p-4 bg-red-50 text-red-500 rounded-3xl font-black text-[10px] uppercase shadow-sm hover:bg-red-500 transition-all">Çıkış Yap 🚪</button>
            {userProfile?.role?.toLowerCase() === "admin" && (<Link href="/admin/dashboard"><button className="bg-[#40E0D0] text-[#1A458B] px-8 py-4 rounded-3xl font-black text-sm uppercase shadow-lg">🚀 Yönetim</button></Link>)}
            <Link href="/member/profile"><div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-100 hover:border-[#40E0D0] transition-all cursor-pointer group"><p className="text-[10px] font-black text-[#40E0D0] uppercase mb-1 leading-none font-sans">Hesabım ⚙️</p><p className="text-slate-800 font-bold text-lg group-hover:text-[#1A458B]">{userProfile?.fullName || "..."}</p></div></Link>
          </div>
        </header>

        <div className="flex bg-white/50 p-2 rounded-[2rem] border border-slate-100 w-fit mb-12 shadow-inner">
          <button onClick={() => setActiveTab("upcoming")} className={`px-10 py-4 rounded-3xl font-black text-xs transition-all ${activeTab === 'upcoming' ? 'bg-[#1A458B] text-white shadow-xl scale-105' : 'text-slate-400'}`}>GELECEK</button>
          <button onClick={() => setActiveTab("past")} className={`px-10 py-4 rounded-3xl font-black text-xs transition-all ${activeTab === 'past' ? 'bg-[#1A458B] text-white shadow-xl scale-105' : 'text-slate-400'}`}>GEÇMİŞ</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredEvents.map((ev) => {
            // YENİ: Kontenjanın Dolu Olup Olmadığı Kontrolü
            const isFull = ev.quota && (ev.attendees?.length || 0) >= ev.quota;

            return (
              <div key={ev.id} className={`group bg-white rounded-[45px] overflow-hidden shadow-sm border border-slate-50 transition-all duration-500 ${activeTab === 'past' ? 'opacity-95' : 'hover:shadow-2xl hover:-translate-y-2'}`}>
                <div className="h-56 bg-slate-100 relative overflow-hidden cursor-zoom-in" onClick={() => ev.imageUrl && setSelectedImage(ev.imageUrl)}>
                  {ev.imageUrl ? <img src={ev.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px] uppercase italic px-10 text-center">Görsel Yok</div>}
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-[#1A458B] shadow-md">📅 {ev.date}</div>
                </div>
                
                <div className="p-10">
                  <h3 className="text-2xl font-black text-slate-800 leading-tight mb-4 tracking-tight">{ev.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-8">{ev.description}</p>
                  
                  {activeTab === 'past' && ev.gallery?.length > 0 && (
                    <div className="mb-8">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-3 tracking-widest font-sans">Etkinlikten Kareler</p>
                      <div className="grid grid-cols-4 gap-2">
                        {ev.gallery.map((url: string, idx: number) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-50 cursor-zoom-in" onClick={() => setSelectedImage(url)}>
                            <img src={url} className="w-full h-full object-cover hover:scale-110 transition-all duration-500" />
                            {idx === 3 && ev.gallery.length > 4 && (<div className="absolute inset-0 bg-[#1A458B]/60 flex items-center justify-center text-white text-[10px] font-black">+{ev.gallery.length - 4}</div>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    {/* YENİ: Kontenjan Bilgisi Hali */}
                    <span className={`text-[10px] font-black uppercase tracking-widest font-sans ${isFull && activeTab !== 'past' ? 'text-red-400' : 'text-[#40E0D0]'}`}>
                      {activeTab === 'past' 
                        ? "✅ TAMAMLANDI" 
                        : isFull 
                        ? "❌ KONTENJAN DOLDU" 
                        : ev.quota 
                        ? `👤 ${ev.attendees?.length || 0} / ${ev.quota} Kişi` 
                        : `👤 ${ev.attendees?.length || 0} Kişi`}
                    </span>

                    {activeTab === "upcoming" && (
                      <button 
                        onClick={() => {
                          if(ev.attendees?.some((a:any)=>a.studentId === userProfile?.studentId)) return alert("Zaten kayıtlısın!");
                          if(isFull) return alert("Kontenjan doldu!");
                          setJoiningEvent(ev);
                        }} 
                        disabled={isFull}
                        className={`text-white px-8 py-3 rounded-2xl font-black text-xs transition-all uppercase font-sans ${isFull ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-[#1A458B] hover:bg-[#40E0D0] hover:text-[#1A458B]'}`}
                      >
                        {isFull ? "DOLDU" : "Kaydol"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOTOĞRAF BÜYÜTME MODALI (Lightbox) */}
        {selectedImage && (
          <div className="fixed inset-0 bg-[#1A458B]/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-20 animate-in fade-in duration-300 cursor-zoom-out" onClick={() => setSelectedImage(null)}>
            <div className="relative w-full h-full flex items-center justify-center">
              <img src={selectedImage} className="max-w-full max-h-full rounded-[40px] shadow-2xl object-contain animate-in zoom-in duration-300" />
              <button className="absolute top-0 right-0 text-white font-black text-4xl hover:text-[#40E0D0] transition-all">✕</button>
            </div>
          </div>
        )}

        {/* KATILIM ONAY MODALI */}
        {joiningEvent && (
          <div className="fixed inset-0 bg-[#1A458B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-800">
            <div className="bg-white w-full max-w-lg rounded-[50px] p-12 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-3xl font-black text-[#1A458B] mb-2 text-center uppercase tracking-tighter">Onayla</h3>
              <div className="space-y-3 mt-8">
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 font-sans">Ad Soyad</p><p className="font-bold text-base">{userProfile?.fullName || ""}</p></div>
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 font-sans">Numara</p><p className="font-bold text-base">{userProfile?.studentId || ""}</p></div>
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 font-sans">Bölüm</p><p className="font-bold text-base">{userProfile?.department || "Belirtilmemiş"}</p></div>
                <div className="flex gap-4 pt-6"><button onClick={() => setJoiningEvent(null)} className="flex-1 font-black text-slate-400 uppercase text-xs font-sans">Vazgeç</button><button onClick={handleJoin} className="flex-1 bg-[#1A458B] text-white p-5 rounded-3xl font-black shadow-lg hover:bg-[#40E0D0] transition-all uppercase text-xs font-sans">Onayla ✨</button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}