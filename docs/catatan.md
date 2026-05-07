# Catatan Pembelajaran: Cara Filter Drama yang Bisa Diputar

Dokumen ini menjelaskan bagaimana sistem kita melakukan filterisasi sehingga hanya drama yang memiliki video tanpa enkripsi (bisa diputar) yang akan muncul di halaman utama.

## Konsep Dasar

Masalah utama sebelumnya adalah banyak video dari API yang dienkripsi (memiliki kata `.encrypt.` atau param `encrypt=1` di URL videonya), sehingga tidak bisa diputar langsung di server kita. 

Untuk mengatasinya, kita perlu "mengecek" terlebih dahulu semua episode 1 dari masing-masing drama, apakah mereka memiliki minimal satu link video yang **tidak dienkripsi**. Jika iya, drama tersebut dianggap lolos dan akan ditampilkan. Jika tidak, drama itu disembunyikan.

## Implementasi Kode (`server.ts`)

Berikut adalah langkah-langkah yang dilakukan di sisi server (backend) Express kita:

### 1. Mengambil Daftar ID Drama yang Valid (Playable)

Kita membuat fungsi bernama `getPlayableDramaIds()`. Fungsi ini bertugas untuk:
- Mengakses repository GitHub API (folder `Raw Episode` yang berisi JSON untuk setiap drama).
- Mengunduh data JSON dari setiap file secara *batch* (berkelompok) agar tidak terlalu memberatkan jaringan secara bersamaan.
- Membaca data episode (biasanya episode pertama).
- Mengecek array `cdnList -> videoPathList`.
- Mencari apakah ada URL video yang **tidak memiliki** kata kunci enkripsi.
- Jika ketemu video yang bersih (bisa diputar), maka ID Drama (bookId) dari file tersebut akan dimasukkan ke dalam sebuah daftar ID yang lolos (menggunakan struktur data `Set`).

```typescript
// Contoh logika pencarian video yang bisa diputar:
let playable = false;
for (const cdn of firstEp.cdnList || []) {
  for (const vp of cdn.videoPathList || []) {
    // Mengecek apakah string URL tidak mengandung penanda enkripsi
    if (vp.videoPath && !vp.videoPath.includes('.encrypt.') && !vp.videoPath.includes('encrypt=1')) {
      playable = true;
      break;
    }
  }
  if (playable) break;
}
if (playable) {
  playableIds.add(bookId);
}
```

### 2. Menerapkan Sistem Caching (Penyimpanan Sementara)

Proses pengecekan file JSON satu persatu di atas membutuhkan waktu yang lama (ada ratusan request). Jika dilakukan setiap kali user membuka halaman utama, web akan terasa sangat lambat (loading lama).

Oleh karena itu, kita membuat sistem **Cache**:
- Variabel cache: `let cachedPlayableIds: Set<string> | null = null;`
- Hasil filterisasi disimpan di memori server untuk jangka waktu tertentu (misalnya 1 Jam atau `1000 * 60 * 60` milidetik).
- Jika ada pengguna yang membuka web dalam jeda waktu 1 jam tersebut, server tidak perlu mengecek ulang ke GitHub API, melainkan langsung memberikan data hasil filter yang sudah disimpan sebelumnya.

### 3. Memfilter Daftar Drama Utama (`/api/dramas`)

Pada endpoint utama yang memberikan daftar drama ke halaman Home (`app.get('/api/dramas')`), kita memanfaatkannya dengan cara:
- Kita ambil seluruh daftar drama dari *Listdata_satu* dan *Listdata_dua*.
- Bersamaan dengan itu, kita ambil daftar ID yang lolos sensor dengan memanggil `getPlayableDramaIds()`.
- Terakhir, kita saring (filter) seluruh drama menggunakan metode array JavaScript `.filter()` mencocokan `bookId`.

```typescript
// Hanya simpan drama yang ID-nya ada di dalam daftar playableIds
allDramas = allDramas.filter(d => playableIds.has(String(d.bookId)));
```

Setelah difilter, barulah data (yang ukurannya sekarang sudah lebih bersih / sedikit) dikirimkan dari backend ke frontend (browser) untuk ditampilkan.

---

Semoga catatan ini bermanfaat untuk pembelajaran! Pendekatan serupa bisa kamu pakai ketika menghadapi data API yang bercampur antara valid dan tidak valid, yaitu **Scrape/Check di Background -> Cache hasilnya -> Filter data utama sebelum dikirim ke Frontend.**
