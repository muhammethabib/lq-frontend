# Video script — LQ-KB-1, the floating keyboards can be moved

**Who this is for.** Whoever is recording. You do not need to know the
feature; everything you have to do is written out below.

**Language.** The headings, the purpose lines and the notes for the
developers are English. **Everything you have to do or look at is in
Turkish**, on purpose. Please keep it that way if you edit this file.

**Length.** About 3 minutes 30 in eight scenes. Record each scene as its own
clip — do not try to do it in one take.

---

## Before you record

**Kurulum — bunları atlama, yoksa klavye yanlış yerde açılır:**

1. **Chrome** kullan. Başka tarayıcı kullanma.
2. Pencereyi **1440 × 900** yap. (Chrome'da F12 → sağ üstteki ⋮ → *Dock to
   bottom*; üstteki ölçü kutusuna 1440 × 900 yaz. Sonra F12 ile geliştirici
   panelini **kapat**, çekim sırasında görünmesin.)
3. Tarayıcı yakınlaştırmasını **%100** yap (Ctrl+0 / Cmd+0).
4. Sayfayı aç: `pages/home.html`.
5. **Hafızayı temizle.** Bu en önemli adım: klavye daha önce taşındıysa
   tarayıcı o yeri hatırlar ve video yanlış çıkar. F12 → *Console* sekmesi →
   şunu yapıştır ve Enter'a bas:

   ```
   localStorage.clear(); sessionStorage.clear(); location.reload();
   ```

   **Hangi sahneden önce temizleyeceğin aşağıdaki tabloda.** Gereksiz yere
   temizleme: bazı sahneler bir öncekinin bıraktığı durumdan devam ediyor.
6. Arayüz dilini **Türkçe** yap (sağ üstteki dil anahtarı).
7. Ekran kaydında **fare imlecini görünür** yap. Bu videonun tamamı fareyle
   ilgili; imleç görünmezse hiçbir şey anlaşılmaz.
8. Ses kaydetme. Anlatım sonradan eklenecek.
9. Fareyi **yavaş** hareket ettir. Her şey farenin nereye geldiğine bağlı;
   hızlı geçersen efektler kayda girmez.

**Sahne zinciri — hangisi temiz başlıyor, hangisi devam ediyor:**

| Sahne | Nasıl başlar |
|---|---|
| 1 | Hafızayı temizle |
| 2 | Sahne 1'in devamı, temizleme |
| 3 | Hafızayı temizle |
| 4 | Sahne 3'ün devamı, temizleme — klavye taşınmış durumda kalsın |
| 5 | Sahne 4'ün devamı, temizleme |
| 6 | Hafızayı temizle |
| 7 | Hafızayı temizle |
| 8 | Sahne 7'nin devamı, temizleme — klavye taşınmış durumda kalsın |

---

**Note for the developers watching:** the recording is made on the mock in
this repository, not on the live site. The live site does not have this
behaviour yet — that is what the ticket asks for.

---

## Scene 1 — The handle appears under the hand

*Purpose: the panel advertises that it can be held, before the pointer is on
the bar.*

**Çekim adımları:**

1. Sayfa açıkken **"Kelime Çözücü"** sekmesine tıkla.
2. Kutulardan birine tıkla. Klavye kutuların altında açılacak.
3. Fareyi **sayfanın boş bir yerinde** 2 saniye bekleterek başla.
4. Fareyi yavaşça klavyenin **üst şeridine** götür — "Temizle" düğmesi ile
   yıldız tuşunun arasındaki boşluğa.
5. Orada **3 saniye bekle**. Noktaların belirdiğini ve panelin hafifçe
   kabardığını (gölgesinin arttığını) göster.
6. Fareyi şeridin üzerinde sağa sola yavaşça gezdir, 3 saniye.
7. Fareyi şeritten çıkar, noktaların kaybolduğunu göster, 2 saniye bekle.

---

## Scene 2 — The empty space beside the keys is a handle too

*Purpose: the ragged margin the key rows leave is one mark per area, not one
per row, and the mark covers exactly the area that answers.*

**Çekim adımları:**

1. Aynı klavye açık dursun.
2. **"ظ" harfinin üstündeki** büyük boşluğa fareyi götür (klavyenin sol
   tarafı, üst kısım). Noktalar belirecek. **3 saniye bekle.**
3. Fareyi o boşluğun **en geniş yerine** doğru yavaşça kaydır (sağa doğru,
   harflere yaklaşarak). Noktaların orada da olduğunu göster.
4. Fareyi şimdi **"ظ" harfinin altındaki** boşluğa indir. Üstteki noktaların
   söndüğünü, alttakilerin yandığını göster. **3 saniye bekle.**
5. İki bölme arasında bir kez daha yavaşça gidip gel.

---

## Scene 3 — Moving it

*Purpose: the drag itself, and the cursor.*

**Çekim adımları:**

1. Hafızayı temizledikten sonra: **"Kelime Çözücü"** sekmesine tıkla, bir
   kutuya tıkla, klavye açılsın. Sonra fareyi üst şeritteki boşluğa götür,
   imlecin **açık el** şeklini aldığını göster, 2 saniye bekle.
2. Sol tuşa bas ve **bırakmadan** klavyeyi yavaşça sağ aşağı doğru sürükle,
   ekranın sağ alt bölgesine götür. Sürükleme **3 saniye** sürsün.
3. Tuşu bırak.
4. **2 saniye bekle** — sol üst köşede küçük bir düğme belirecek ve bir kez
   bordo yanıp sönecek, üstünde de "Tıkla, eski yerini alsın" yazısı
   çıkacak. Yazı kendiliğinden kaybolana kadar bekle.

> Note for the developers: the label appears once per visit, on whichever
> board is parked first. The blink happens on every drop.

---

## Scene 4 — Sending it back by hand

*Purpose: the dashed outline of the home position, and the magnet.*

**Çekim adımları:**

1. Klavye hâlâ taşıdığın yerde dursun.
2. Üst şeritten tut ve **çok yavaş** bir şekilde kutuların altına, yani
   geldiği yere doğru sürükle.
3. Eski yerine **yaklaşınca** arkada kesik çizgili bir çerçeve belirecek.
   O çerçeve belirir belirmez **1 saniye orada dur**, izleyici görsün.
4. Biraz daha yaklaş — çerçeve belirginleşecek. Yine **1 saniye dur.**
5. Çerçevenin içine gelince tuşu bırak. Klavye kendiliğinden tam yerine
   oturacak ve köşedeki düğme kaybolacak.
6. **2 saniye bekle.**

---

## Scene 5 — Sending it back with the button

*Purpose: the control, its hover, and what it does.*

**Çekim adımları:**

1. Klavyeyi tekrar şeritten tutup sağ üst bölgeye taşı ve bırak.
2. Köşedeki düğme belirsin. **2 saniye bekle**, yazı kaybolsun.
3. Fareyi **yavaşça o düğmenin üzerine** götür. İki şey olacak: düğme bordoya
   dolacak, **ve sayfada klavyenin eski yeri bordo bir çerçeveyle
   belirecek.** **3 saniye bekle**, ikisi de net görünsün.
4. Fareyi düğmeden çek, çerçevenin söndüğünü göster, 1 saniye.
5. Tekrar düğmenin üzerine gel ve **tıkla**. Klavye eski yerine dönecek,
   düğme solarak kaybolacak.
6. **2 saniye bekle.**

---

## Scene 6 — It stays where it was put

*Purpose: a move survives closing the board and reloading the page.*

**Çekim adımları:**

1. Önce hafızayı temizle (yukarıdaki konsol satırı) ve sayfayı yenile.
2. "Kelime Çözücü" sekmesine geç, bir kutuya tıkla.
3. Klavyeyi şeritten tutup **aşağı ve sağa** taşı, bırak. (Önemli: yukarı
   değil aşağı taşı. Kutuların hizasına taşırsan davranış kasıtlı olarak
   farklı — bkz. Sahne 8.)
4. Klavyeyi **kapat** (sağ üstteki ✕).
5. **2 saniye bekle.** Sonra tekrar bir kutuya tıkla — klavye bıraktığın
   yerde açılacak. **2 saniye bekle.**
6. Şimdi **sayfayı yenile** (F5).
7. Tekrar "Kelime Çözücü" sekmesine geç ve bir kutuya tıkla — klavye yine
   aynı yerde açılacak. **3 saniye bekle.**

---

## Scene 7 — The same thing on the Search board

*Purpose: both boards behave identically, and the label is said only once for
the two of them together.*

**Çekim adımları:**

1. Hafızayı temizle ve sayfayı yenile.
2. **"Ara"** sekmesinde arama kutusunun **sağ yarısına** tıkla — Osmanlıca
   yazanın olduğu taraf ("عثمانلى حرفلريله آره..."). Arama klavyesi
   açılacak. (Sol yarı Latin harfleri içindir ve klavyeyi açmaz.)
3. Üst şeritten tut, sağ aşağı taşı, bırak. Köşedeki düğme belirecek, bir
   kez yanıp sönecek ve **"Tıkla, eski yerini alsın"** yazısı çıkacak.
   Yazı kaybolana kadar bekle.
4. Şimdi **"Kelime Çözücü"** sekmesine geç, bir kutuya tıkla.
5. O klavyeyi de şeritten tutup taşı ve bırak. **Düğme yine belirecek ve yine
   yanıp sönecek, ama yazı bu sefer çıkmayacak** — bu kasıtlı. **3 saniye
   bekle** ki izleyici yazının çıkmadığını görsün.

---

## Scene 8 — The two corners

*Purpose: the two controls this ticket moves — the pin in the top-left
corner, the Advanced/Basic key in the bottom-left.*

**Çekim adımları:**

1. Klavye taşınmış ve köşedeki düğme görünür hâlde olsun.
2. Klavyenin **sol üst köşesini** 3 saniye göster (fareyi oraya yaklaştır ama
   düğmenin üstüne gelme, yoksa çerçeve yanar).
3. Fareyi yavaşça klavyenin **sol alt köşesine** indir — "GELİŞMİŞ" tuşunun
   olduğu yere. **3 saniye bekle.**
4. "GELİŞMİŞ" tuşuna **tıkla.** Gelişmiş tahta açılacak ve tuş "TEMEL"e
   dönecek — **aynı köşede.** **3 saniye bekle.**
5. "TEMEL" tuşuna tıklayıp geri dön, 2 saniye bekle.
6. Son olarak arayüz dilini **İngilizce** yap ve 3. ve 4. adımı tekrarla —
   tuş iki dilde de aynı köşede duruyor.

---

## What the finished video has to show

A developer watching it once should be able to answer, without reading the
ticket:

1. Where can I grab a board, and how do I know before I try?
2. What happens when I drop it somewhere, and how do I undo that?
3. How do I know the board remembers where I put it?
4. Where do the pin and the Advanced/Basic key live?
