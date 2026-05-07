# Rencana Pengembangan Lanjutan & Ide Fitur

Dokumen ini berisi daftar fitur dan rencana pengembangan aplikasi Dramabox Lite ke depan. Ini adalah "buku pintar" kita sebelum berevolusi menjadi Aplikasi React Native (Raja Terakhir).

## 1. Sistem Monetisasi (Penghasilan) & Iklan
Karena tujuan ke depan adalah untuk menghasilkan uang dari aplikasi ini, kita perlu menyiapkan kerangka iklan:
- **Banner Ads:** Iklan statis yang muncul di bagian bawah layar atau di sela-sela daftar drama di halaman beranda.
- **Interstitial Ads (Iklan Layar Penuh):** Iklan yang muncul saat pengguna berpindah halaman (misal: saat mau masuk ke halaman pemutar video).
- **Rewarded Video Ads (Iklan Reward):** Fitur khusus di mana pengguna harus menonton iklan video sampai habis untuk membuka episode yang dikunci (sangat efektif untuk aplikasi short drama).
- **Sistem Pembayaran / VIP (Opsional):** Fitur langganan premium (bulanan) agar user bisa menonton tanpa iklan sama sekali.

## 2. Manajemen Pengguna (User Account & Auth)
Aplikasi profesional harus bisa mengenali user-nya:
- **Login / Register:** Auth menggunakan Google atau Email (Siapkan Firebase Auth).
- **Profil User:** Halaman khusus untuk melihat status akun (Regular/VIP), avatar, dan koin yang dimiliki.
- **Riwayat Tontonan (Watch History):** Menyimpan episode dan posisi durasi (timestamp) terakhir yang ditonton, agar bisa `resume` tanpa mencari ulang.
- **Daftar Favorit / Watchlist (My Library):** Fitur Bookmark agar pengguna bisa menyimpan drama untuk ditonton nanti.

## 3. Engagement & Gamifikasi (Membuat User Betah)
Cara agar pengguna sering membuka aplikasi dan meningkatkan retensi:
- **Sistem Koin (Virtual Currency):** Pengguna mengumpulkan koin dari menonton iklan, share, atau Top-Up. Koin dipakai untuk membuka episode lanjutan.
- **Misi Harian (Daily Check-in):** Login berturut-turut untuk mendapatkan Daily Reward koin.
- **Sistem Referral:** Undang teman pakai kode referral dapat koin, biar user yang promosikan aplikasi kita.
- **Notifikasi Pintar (Push Notifications):** Memberikan alert jika ada episode baru rilis, reset misi harian, atau promo top-up (Migrasi ke Firebase Cloud Messaging di tahap Native).

## 4. Peningkatan Player Video & UI/UX (React Native Ready)
- **Vertical Short Video Player:** Pemutar video ala TikTok / Reels / Shorts. Layar penuh (full screen portrait), tinggal swipe up untuk episode berikutnya.
- **Resolusi Video Dinamis & HLS:** Streaming adaptif sesuai kecepatan internet user (kalo ngelag otomatis turunin resolusi ke 480p, kalo kenceng naik ke 1080p).
- **Skeleton Loading:** Tampilan shimmer abu-abu yang bergerak saat loading, lebih elegan dari sekadar muter-muter.
- **Sistem Komentar & interaksi Live:** Pengguna bisa meninggalkan komentar per episode dan memberikan like (mirip fitur komentar di Webtoon / TikTok).

## 5. Algoritma & Fitur Pencarian Lebih Cerdas
- **Filter & Sortir Spesifik:** Pencarian berdasarkan Tag/Genre (Romantis, CEO, Reinkarnasi, Menantu Tersakiti, Pria Sigma), Status (Tamat / Ongoing), atau Jumlah Episode.
- **Trending & Top Chart:** Menampilkan "Top 10 Hari Ini" agar user FOMO dan ikut nonton yang lagi ramai.
- **Rekomendasi Pintar (You May Also Like):** Menyarankan drama lain yang mirip dengan drama yang sering ditonton user (berdasarkan Tag).

---
**Catatan Penting:** 
Daftar fitur di atas adalah pondasi yang bisa mulai kita cicil sedikit demi sedikit di versi Web (PWA) saat ini. Begitu logic bisnisnya (Backend, Database, State Management) sudah matang, transisi menuju fase **React Native** akan jauh lebih mudah karena kerangkanya sudah jadi!

