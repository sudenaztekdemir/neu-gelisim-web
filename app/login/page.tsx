"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!studentId || !password) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    // Mühendislik hilesi: Numarayı e-posta formatına çeviriyoruz
    const email = `${studentId}@erbakan.edu.tr`;

    try {
      // 1. Firebase Auth ile giriş yapıyoruz
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore'dan kullanıcının rolünü (admin/member) çekiyoruz
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 3. Role göre yönlendirme yapıyoruz
        if (userData.role === "admin") {
          alert("Yönetici girişi başarılı. Paneline yönlendiriliyorsun.");
          router.push("/admin/dashboard");
        } else {
          alert("Giriş başarılı. Etkinliklere göz atabilirsin!");
          router.push("/member/events");
        }
      } else {
        alert("Kullanıcı kaydı bulundu ancak veritabanı bilgileri eksik.");
      }
    } catch (error: any) {
      console.error("Giriş Hatası:", error.code);
      alert("Hata: Numara veya şifre hatalı!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black p-4">
      <div className="w-full max-w-md p-8 bg-white border rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-[#1A458B] mb-8 text-center">Gelişim ve Farkındalık Girişi</h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1">Öğrenci Numarası</label>
            <input 
              type="text" 
              placeholder="Örn: 211216017" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A458B] outline-none" 
              onChange={(e) => setStudentId(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Şifre</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A458B] outline-none" 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            onClick={handleLogin} 
            disabled={loading}
            className={`w-full ${loading ? 'bg-gray-400' : 'bg-[#1A458B] hover:bg-[#D4AF37]'} text-white p-3 rounded-lg font-bold transition-colors shadow-md`}
          >
            {loading ? "Giriş yapılıyor..." : "Sisteme Giriş Yap"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Henüz üye değil misin? </span>
          <button 
            onClick={() => router.push("/signup")} 
            className="text-[#1A458B] font-bold hover:underline"
          >
            Kayıt Ol
          </button>
        </div>
      </div>
    </div>
  );
}