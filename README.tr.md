# Shellon

[English](README.md) | **Türkçe**

**Shellon**, Windows için geliştirilmiş modern bir SSH terminal ve bağlantı yöneticisidir. Sunucularınızı klasörler halinde organize eder, tek tıkla bağlanır ve terminal, SFTP ile port yönlendirmeyi aynı arayüzde birleştirir.

Bağlantı bilgileri yalnızca bilgisayarınızda saklanır; buluta gönderilmez. Yerel veriler AES-256-GCM ile şifrelenir, yedek dosyaları ise sizin belirlediğiniz şifreyle korunur.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/Electron-33-47848F)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Özellikler

### Bağlantı yönetimi
- Klasörlerle host organizasyonu ve sürükle-bırak taşıma
- Şifre veya SSH anahtarı ile kimlik doğrulama
- Kayıtlı anahtar yönetimi
- Bağlantı arama, düzenleme, çoğaltma
- Şifreli dışa / içe aktarma (`.shellon`)

### Terminal
- xterm.js tabanlı tam terminal emülasyonu
- Çoklu sekme; orta tuş ile sekme kapatma
- Fare ile seç → kopyala, sağ tık → yapıştır
- Birden fazla terminal teması ve font seçeneği
- Snippet'ler ve komut geçmişi paneli

### Uzak sunucu araçları
- SFTP dosya yöneticisi (yükle, indir, sil, klasör oluştur)
- Local ve remote port yönlendirme
- Keep-alive ve otomatik yeniden bağlanma

### Güvenlik
- Yerel veri dosyaları **AES-256-GCM** ile şifrelenir
- Anahtar **Windows DPAPI** (`safeStorage`) ile korunur
- Export dosyaları **PBKDF2 + AES-256-GCM** ile şifrelenir

---

## Kısayollar

| İşlem | Kısayol / Davranış |
|--------|---------------------|
| Yeni bağlantı | `Ctrl+T` |
| Sekmeyi kapat | `Ctrl+W` veya sekmede orta tuş |
| Ayarlar | `Ctrl+,` |
| Bağlan | Host'a çift tık |
| Bağlam menüsü | Sağ tık |
| Terminalde kopyala | Metni fare ile seç |
| Terminalde yapıştır | Sağ tık |

---

## Teknolojiler

- [Electron](https://www.electronjs.org/) 33
- [ssh2](https://github.com/mscdex/ssh2) — SSH / SFTP
- [xterm.js](https://xtermjs.org/) — Terminal emülasyonu
- [electron-builder](https://www.electron.build/) — Windows paketleme

---

## Veri saklama

| Dosya | Konum | Açıklama |
|-------|--------|----------|
| Bağlantılar, snippet'ler | `%APPDATA%\shellon\shellon-data.json` | Şifreli |
| Ayarlar | `%APPDATA%\shellon\shellon-settings.json` | Şifreli |
| Şifreleme anahtarı | `%APPDATA%\shellon\.shellon-key` | DPAPI korumalı |

Export yedekleri `.shellon` uzantılıdır ve import sırasında sizin belirlediğiniz şifreyi gerektirir.

---

## Lisans

MIT — ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

---

## Kurulum

### Gereksinimler

- Windows 10 / 11 (x64)
- [Node.js](https://nodejs.org/) 18 veya üzeri
- npm

### Geliştirme ortamı

Depoyu klonlayın ve bağımlılıkları yükleyin:

```bash
git clone https://github.com/KULLANICI/shellon.git
cd shellon
npm install
```

Uygulamayı çalıştırın:

```bash
npm start
```

Geliştirici modu (DevTools açık):

```bash
npm run dev
```

### Windows kurulum dosyası oluşturma

Kurulum sihirbazı (önerilen):

```bash
npm run build:setup
```

Çıktı: `dist/Shellon Setup 1.0.0.exe`

Kurulum + portable birlikte:

```bash
npm run build
```

Yalnızca portable sürüm:

```bash
npm run build:portable
```

Çıktı: `dist/Shellon 1.0.0.exe`

### Son kullanıcı kurulumu

1. `Shellon Setup 1.0.0.exe` dosyasını çalıştırın
2. Kurulum sihirbazını tamamlayın
3. Masaüstü veya Başlat menüsünden **Shellon**'u açın

> Uygulama kod imzalı değilse Windows SmartScreen uyarısı çıkabilir. **Ek bilgi** → **Yine de çalıştır** seçin.

### İlk kullanım

1. Sol panelden **+** ile yeni bağlantı ekleyin
2. Host, kullanıcı adı ve şifre veya SSH anahtarı girin
3. Kaydedin ve host'a çift tıklayarak bağlanın
