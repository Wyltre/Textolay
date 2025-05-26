# Textolay – Yaz, Düzelt, Paylaş

Textolay'daki mesajlar, yazım kurallarına uygun hâle getirilir.

Bunu yapabilmek için **Gemini 2.0 Flash API** kullandım.  
*Neden diye soracaksınız:* Ücretsiz API alabiliyorsunuz.

---

## Nasıl Kullanılır?

İlk adım olarak tabii ki de Gemini API lazım.  
Peki bu Gemini API'yi nasıl alırız?  
Çok basit bir şekilde alabiliyoruz, tabii ki de ücretsiz. :D

---

### 🔑 API Anahtarı Alma

Eğer daha önceden oluşturduğunuz bir Google Cloud projeniz varsa, direkt aşağıdaki siteye girip **"Create API Key"** yazan yerden alabilirsiniz:

🔗 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

Eğer Google Cloud projeniz yoksa da aşağıdaki siteye gidip giriş yapın. Ardından projenizi oluşturabilirsiniz. Daha sonra tekrar yukarıdaki API anahtarı alma kısmına bakın:

🔗 [https://console.cloud.google.com/](https://console.cloud.google.com/)

---

### 📦 Eklentiyi Kurma

Evet, API anahtarımızı aldık. Şimdi ise eklentiyi kurma vakti!

Aşağıdaki linke tıklayıp GitHub'a girin, ardından **"Code"** butonuna tıklayıp **Download ZIP** ile indirebilirsiniz.  
Ardından ZIP dosyasını çıkartın.

🔗 [https://github.com/Wyltre/Textolay](https://github.com/Wyltre/Textolay)

---

### 🧩 Chrome'a Eklemek

Şimdi ise Chrome'a eklememiz gerekiyor.

1. Chrome'dan **"Eklentiler"**e basın.  
2. **"Uzantıları Yönet"**e tıklayın.  
3. **Geliştirici Modu**'nu açın.  
4. **"Paketlenmemiş Öğe Yükle"**ye basın.  
5. Çıkarttığımız klasörü seçin ve eklentimiz kuruldu.

---

### 🔐 API Anahtarını Girme

Ardından bu konuya gelin ve eklentiyi açın.  
Aldığınız Gemini API'yi buraya girin ve kaydedin.  
**Merak etmeyin, API'niz güvende.**

---

### ✅ Test Edin

Son olarak sayfayı yenileyin ve mesaj yazın.  
Şimdi ise en iyi kısım: **Düzelt** butonuna basarak mesajın nasıl düzeldiğini kontrol edin.

---

## 🧪 Kısa Bir Test Metni

**Bozuk metin:**

> "chrome açılır ve üstteki arama çubuğuna istediğin adres yazılır sonra enter basılır biraz beklenir sayfa açılır işte budur kolay değil mi"

**Düzeltilmiş metin:**

> "Chrome açılır ve üstteki arama çubuğuna istediğin adres yazılır. Sonra Enter'a basılır, biraz beklenir ve sayfa açılır. İşte bu kadar, kolay değil mi?"

---

Açıkçası şu an için kusursuz sayılmaz; bulduğunuz hataları bana iletirseniz sevinirim.  
Ayrıca projeyi beğendiyseniz, yıldız atmayı unutmayın. ⭐
