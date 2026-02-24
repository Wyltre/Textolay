# Textolay – Yaz, Düzelt, Paylaş

Techolay'daki mesajlarınızı yazım kurallarına uygun hâle getirir.

Bunu yapabilmek için **Gemini Flash Lite API** kullanıyoruz.  
*Neden diye soracaksınız:* Ücretsiz API alabiliyorsunuz.

> **🌐 Chrome ve Firefox desteklidir.**

---

## 📥 Kurulum

| Tarayıcı | Kurulum |
|---|---|
| 🦊 **Firefox** | [Firefox Add-ons'tan indir(Yakında!)](https://addons.mozilla.org/tr/firefox/addon/textolay/) |
| � **Chrome** | Aşağıdaki manuel kurulum adımlarını izleyin |

---

## �🆕 v2.0.0 — Neler Değişti?

- **Yeni Mimari:** API çağrıları Background Service Worker üzerinden — CSP/CORS sorunları çözüldü.
- **Hızlı Model:** `gemini-flash-lite-latest` modeli — daha hızlı yanıtlar.
- **Sağ Tık Menüsü:** Seçili metni sağ tıklayıp "AI ile Düzelt" ile düzeltin.
- **Klavye Kısayolu:** `Alt + Shift + Y` ile anında düzeltme.
- **Geri Alma:** Düzeltme sonrası "Geri Al" butonu ile orijinal metne dönün.
- **Düzeltme Sayacı:** Toplam düzeltme sayınızı takip edin.
- **Tema Desteği:** Açık / Koyu / Otomatik tema.
- **Bildirim Sistemi:** Sayfa içi bildirimler.
- **Froala Editör Uyumu:** Techolay editörüyle tam uyumlu, draft otomatik güncellenir.
- **Cross-Browser:** Chrome ve Firefox'ta sorunsuz çalışır.
- **Otomatik Yeniden Deneme:** API kota sınırına ulaşıldığında otomatik bekleme ve yeniden deneme.
- **Güvenlik:** Tüm DOM manipülasyonları güvenli API'ler ile yapılır (innerHTML kullanılmaz).

---

## Nasıl Kullanılır?

### 🔑 API Anahtarı Alma

Ücretsiz bir Gemini API anahtarı almanız gerekiyor:

🔗 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

> Google Cloud projeniz yoksa önce [console.cloud.google.com](https://console.cloud.google.com/) adresinden bir proje oluşturun.

---

### 🧩 Chrome'a Eklemek (Manuel)

1. Bu repoyu ZIP olarak indirin veya `git clone` yapın.
2. Chrome'da `chrome://extensions` adresine gidin.
3. **Geliştirici Modu**'nu açın.
4. **"Paketlenmemiş Öğe Yükle"**ye basın.
5. İndirdiğiniz klasörü seçin.

---

### 🦊 Firefox'a Eklemek

**Önerilen:** [Firefox Add-ons'tan doğrudan kurun. (Yakında!)](https://addons.mozilla.org/tr/firefox/addon/textolay/)

**Manuel kurulum (geliştirici):**
1. `about:debugging#/runtime/this-firefox` adresine gidin.
2. **"Geçici Eklenti Yükle…"** → `manifest.json` seçin.

> **Not:** Geçici eklentiler Firefox kapandığında kaldırılır.

---

### 🔐 API Anahtarını Girme

1. Eklenti simgesine tıklayın.
2. Gemini API anahtarınızı girin ve **Kaydet**'e basın.
3. **API'niz yalnızca cihazınızda saklanır, güvende.**

---

### ✅ Kullanım Yolları

| Yöntem | Nasıl |
|---|---|
| **Popup Butonu** | Eklenti simgesi → "Metni Düzelt" |
| **Sağ Tık** | Metin seç → Sağ tık → "AI ile Düzelt" |
| **Kısayol** | `Alt + Shift + Y` |

---

## 🧪 Test Metni

**Bozuk:**
> "chrome açılır ve üstteki arama çubuğuna istediğin adres yazılır sonra enter basılır biraz beklenir sayfa açılır işte budur kolay değil mi"

**Düzeltilmiş:**
> "Chrome açılır ve üstteki arama çubuğuna istediğin adres yazılır. Sonra Enter'a basılır, biraz beklenir ve sayfa açılır. İşte bu kadar, kolay değil mi?"

---

## 📄 Lisans

Bu proje [GPL v3](LICENSE) lisansı ile lisanslanmıştır.

---

Bulduğunuz hataları bana iletirseniz sevinirim.  
Projeyi beğendiyseniz ⭐ yıldız atmayı unutmayın!
