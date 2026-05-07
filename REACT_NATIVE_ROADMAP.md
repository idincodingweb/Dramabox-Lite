# Visi & Tujuan Akhir "Raja Terakhir": Migrasi ke React Native (Menuju Makrifat) 🚀

Dokumen ini adalah catatan untuk mengingat apa yang ada di otak developer (Idin) mengenai masa depan aplikasi Dramabox ini. Saat ini aplikasi berjalan di atas Web (React + Vite + PWA), namun hasil akhirnya nanti adalah sebuah aplikasi Native tulen.

## 📌 Fase Saat Ini: Web App & PWA
- Aplikasi berjalan sebagai Web Desktop / Mobile.
- Memiliki fitur notifikasi web (Service Worker) dan tampilan responsif (Tailwind dkk).
- Ada rencana PWA ini bisa dibungkus (repack) menjadi APK sementara, entah itu di-extract dan dimodifikasi via `apktool` (seperti proses modifikasi/reverse engineering base APK & split APK/apks), atau menggunakan TWA (Trusted Web Activity).

## 👑 Fase Akhir (Raja Terakhir): React Native
Tujuan hakiki (makrifat) dari project ini adalah ditulis ulang / di-porting sepenuhnya ke **React Native**.

### Hal-hal yang Perlu Disiapkan Saat Migrasi Nanti:
1. **Perubahan Komponen UI:**
   - Tag HTML (`<div>`, `<span>`, `<img>`) akan berubah menjadi komponen Native (`<View>`, `<Text>`, `<Image>`).
   - Tailwind CSS saat ini perlu disesuaikan dengan styling React Native (bisa pakai `NativeWind` agar masih mirip Tailwind, atau pindah ke `StyleSheet.create`).
2. **Navigasi:**
   - React Router DOM akan diganti menggunakan `React Navigation`.
3. **Notifikasi (Push Notifications):**
   - Service Worker Web Push (`sw.js`) terbatas di browser. Di RN nanti kita akan transisi menggunakan Firebase Cloud Messaging (FCM) Native lewat `@react-native-firebase/messaging`.
4. **Firebase & Backend:**
   - Logic Firebase Web SDK saat ini perlahan akan disesuaikan ke standar React Native Firebase (Native Modules) agar performanya ngebut dan bener-bener jadi aplikasi Native, bukan sekedar WebView.

*Catatan ini akan selalu ada di root project. Jika waktunya sudah tiba untuk eksekusi React Native, kita jadikan dokumen ini sebagai garis start!*
