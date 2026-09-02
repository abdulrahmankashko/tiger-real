# Tiger ERP // Textile — Gerçek Proje Kurulumu

Bu, sizin AI Studio'da yazdığınız gerçek uygulamanın kodudur. Yaptığım değişiklik: artık kendi Express sunucunuza değil, **doğrudan Supabase'e** bağlanıyor. Böylece sunucu barındırmaya hiç gerek kalmadı, tamamen ücretsiz statik + APK olarak çalışır.

## 1. Supabase — veritabanını hazırlayın
1. Zaten kullandığınız Supabase projesine girin (aynı proje — kodda zaten bağlı)
2. **SQL Editor > New query**'ye `schema.sql` dosyasının tamamını yapıştırıp **RUN**'a basın
   - Bu dosya `profiles` tablonuz zaten varsa onu SİLMEZ, sadece eksikse oluşturur
   - `app_state` adında yeni bir tablo oluşturur — tüm modeller/BOM/envanter/finans verileriniz burada tutulacak

## 2. Hesaplarınız
`celil@gmail.com` ve `abdulrahmankashko3@gmail.com` zaten kodun içinde "master_admin" olarak sabit tanımlı — ekstra bir şey yapmanıza gerek yok. Müşteri hesaplarını (`damasquino@gmail.com` gibi) admin panelinden ("Yeni Marka/Müşteri Ekle" ekranından) ekleyebilirsiniz; bu artık doğrudan Supabase Auth'ta gerçek bir hesap oluşturur.

## 3. ⚠️ Güvenlik — önce bunu yapın
`server.ts` dosyanızda gerçek Supabase **service_role (gizli) key**'iniz koda gömülüydü. Bu anahtar artık kullanılmıyor (sunucu tamamen kaldırıldı) ama daha önce görüldüğü/paylaşıldığı için yine de Supabase panelinde **Settings > API**'ye girip bu anahtarı **regenerate** etmenizi öneririm.

## 4. Önce bir kere GitHub'a yükleyin (bir bilgisayardan, ~10 dakika)
1. github.com'da ücretsiz hesap açın (yoksa), **New repository** ile `tiger-erp-textile` adında bir repo oluşturun
2. Size verdiğim proje klasörünün İÇİNDEKİ tüm dosya ve klasörleri (zip'i önce bilgisayarda çıkarın) GitHub'ın "Add file > Upload files" sayfasına **sürükleyip bırakın** (klasör yapısı korunur)
3. "Commit changes" deyin

Bundan sonraki her şey telefondan yapılabilir.

## 5. Web sitesi linkini alın (ücretsiz, GitHub Pages)
Bu proje artık tamamen statik (sunucu yok), en hızlı sonuç bu:

1. Repo sayfasında **Settings > Pages**'e girin, "Build and deployment" altında **Source**'u **GitHub Actions** olarak seçin
2. **Actions** sekmesine girin, "Web sitesini yayinla (GitHub Pages)" iş akışını bulup **Run workflow**'a basın
3. ~1-2 dakika sonra **Settings > Pages** sayfasının en üstünde yeşil bir kutuda linkiniz görünür: `https://kullaniciadiniz.github.io/tiger-erp-textile/`
4. Bu linki artık herkesle paylaşabilir, telefondan/bilgisayardan açabilirsiniz — kod her güncellendiğinde site de otomatik güncellenir

## 6. İsterseniz sonra APK'ya da çevirin (aynı repo, ekstra yükleme yok)
1. **Actions** sekmesinde "Build Android APK" iş akışını bulup **Run workflow**'a basın
2. ~5-8 dakika bekleyin (sayfayı yenileyerek durumu görebilirsiniz)
3. İşlem yeşil tik olunca, aynı çalıştırma sayfasında altta **Artifacts** bölümünde `tiger-erp-apk` göreceksiniz — dokunup indirin (bir zip iner, içinden `app-debug.apk` çıkar)
4. Telefonunuzda "Bilinmeyen kaynaklardan yükleme" iznini açıp APK'yı kurun

Her iki iş akışı da her kod güncellemesinde otomatik tekrar çalışabilir (`main` dalına push olduğunda) — bilgisayara ikinci kez ihtiyacınız olmaz.

## 7. Kaybedilen/basitleştirilen özellikler
- **El yazısı ile beden tanıma (Gemini AI):** Sunucu kaldırıldığı için bu özellik şu an devre dışı — sistem otomatik olarak "elle yazın" moduna düşer, hata vermez. İsterseniz ileride bunu küçük bir Supabase Edge Function ile (yine ücretsiz) geri getirebiliriz.
- **Veritabanı Ayarları / "Buluta Eşitle" ekranı:** Artık gerekmiyor çünkü zaten her kayıt anında Supabase'e yazılıyor. Bu ekranlar arayüzde duruyor ama artık bilgilendirme mesajı veriyor.

## Notlar
- `dist/`, `node_modules/`, `android/` klasörlerini GitHub'a yüklemenize gerek yok (`.gitignore` zaten hariç tutuyor, GitHub Actions bunları her seferinde kendisi üretir)
- Projeyi büyütmeye devam edeceksek (yeni modül, yeni ekran) bundan sonrasını yine ben kodlarım, siz sadece güncellenen dosyaları GitHub'a yükleyip Actions'ı tekrar çalıştırırsınız
