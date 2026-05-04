"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase"; // Firebase bağlantımız
import { onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında giriş yapılmış mı kontrol ediyoruz
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-[#1A458B]">
      {/* Logo Bölümü */}
      <div className="relative flex place-items-center mb-8">
        <Image
          src="/logo.jpeg" 
          alt="NEÜ Gelişim ve Farkındalık Topluluğu Logosu"
          width={250}
          height={250}
          priority
        />
      </div>

      {/* Başlık Bölümü */}
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl mb-4">
          Gelişim ve Farkındalık Topluluğu
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
          Necmettin Erbakan Üniversitesi kişisel gelişim topluluğu.
        </p>
      </div>

      {/* Butonlar Bölümü */}
      <div className="mt-10 flex items-center justify-center gap-x-6">
        
        {/* SADECE GİRİŞ YAPILDIYSA GÖZÜKSÜN */}
        {!loading && user && (
          <Link href="/member/events">
            <button className="rounded-md bg-[#1A458B] px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-[#D4AF37] transition-all">
              Etkinlik Takvimi
            </button>
          </Link>
        )}

        {/* HER ZAMAN GÖZÜKSÜN AMA GİRİŞ YAPILDIYSA 'PANELİM' DİYESİN */}
        {!loading && (
          <Link href={user ? (user.email?.includes('admin') ? "/admin/dashboard" : "/member/events") : "/login"}>
            <button className="text-lg font-semibold leading-6 text-[#1A458B] border-2 border-[#1A458B] px-8 py-4 rounded-md hover:bg-gray-50 transition-all">
              {user ? "Panelime Git" : "Üye Girişi"}
            </button>
          </Link>
        )}
      </div>

      {/* Çıkış Butonu (Sadece giriş yapılmışsa altta küçük gözüksün) */}
      {user && (
        <button 
          onClick={() => auth.signOut()}
          className="mt-8 text-sm text-red-600 hover:underline"
        >
          Çıkış Yap
        </button>
      )}
    </main>
  );
}