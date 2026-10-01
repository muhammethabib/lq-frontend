# Video script — LQ-KB-2, the page comes to the keyboard

**Who this is for.** Whoever is recording. You do not need to know the
feature; everything you have to do is written out below.

**Language.** The headings, the purpose lines and the notes for the
developers are English. **Everything you have to do or look at is in
Turkish**, on purpose. Please keep it that way if you edit this file.

**Length.** About 3 minutes in six scenes. Record each scene as its own clip.

**What makes this video different from LQ-KB-1.** That one was about the
pointer. This one is about **the whole window** — what moves, how far, and
whether it stops in the same place every time. So the window has to be in
frame, not just the keyboard.

---

## Before you record

**Kurulum:**

1. **Chrome** kullan.
2. Ekran kaydını **bütün tarayıcı penceresini** alacak şekilde ayarla.
   Sadece klavyeyi değil, pencerenin tamamını kaydet — bu videonun konusu
   sayfanın nasıl kaydığı.
3. Yakınlaştırma **%100** (Ctrl+0 / Cmd+0).
4. Sayfayı aç: `pages/home.html`.
5. **Hafızayı temizle.** Klavye daha önce taşındıysa tarayıcı o yeri
   hatırlar ve sahneler yanlış çıkar. F12 → *Console* → yapıştır, Enter:

   ```
   localStorage.clear(); sessionStorage.clear(); location.reload();
   ```

   **Hangi sahneden önce temizleyeceğin aşağıdaki tabloda.**

   | Sahne | Nasıl başlar |
   |---|---|
   | 1 | Hafızayı temizle |
   | 2 | Hafızayı temizle |
   | 3 | Hafızayı temizle |
   | 4 | Sahne 3'ün devamı, temizleme — klavye açık kalsın |
   | 5 | Başında bir kez temizle, sahnenin içinde bir daha temizleme |
   | 6 | Hafızayı temizle |
6. Arayüz dilini **Türkçe** yap.
7. Fare imlecini **görünür** yap.
8. Ses kaydetme.

**Pencere boyu — bu videonun can alıcı noktası.** Aynı şeyi iki farklı
pencere boyunda göstereceğiz. Boyu şöyle ayarla: F12 → sağ üstteki ⋮ →
*Dock to bottom* → üstteki ölçü kutusuna yaz. Sonra **F12'yi kapat.**

- **Yüksek pencere: 1440 × 1000**
- **Alçak pencere: 1440 × 700**

**Note for the developers watching:** the point of scenes 1–3 is not that the
page scrolls. It is that it scrolls to **the same place every time**, by
every route in. Watch the top edge of the window, not the keyboard.

---

## Scene 1 — The first press, on a tall window

*Purpose: the block — tabs, boxes, keyboard — lands at the top of the window.*

**Çekim adımları:**

1. Pencereyi **1440 × 1000** yap. Hafızayı temizle.
2. Sayfa en üstte dururken **2 saniye bekle.** Sekmeler, kutular ve
   altındaki boşluk görünsün.
3. **"Kelime Çözücü"** sekmesine tıkla. **2 saniye bekle.**
4. Kutulardan birine tıkla.
5. Sayfanın yukarı kaydığını ve klavyenin kutuların hemen altına oturduğunu
   göster. **4 saniye hiç dokunmadan bekle.**

> Note: the tabs end 16px from the top of the window; the keyboard sits 26px
> under the boxes. That is the target position for every scene that follows.

---

## Scene 2 — The same press, four different ways in

*Purpose: the result does not depend on the route. This is the scene the
ticket exists for.*

**Çekim adımları:**

Pencere yine **1440 × 1000**. Hafızayı temizle, sonra **"Kelime Çözücü"**
sekmesine geç. Dört adımı **arka arkaya, kesmeden** çek:

1. **Birinci yol — düz açılış.** Bir kutuya tıkla, klavye yerine otursun,
   2 saniye bekle. Klavyeyi **kapat** (sağ üstteki ✕), 1 saniye bekle.
2. **İkinci yol — ikinci basış.** Başka bir kutuya tıkla. **Aynı yere
   oturacak.** 2 saniye bekle. Kapat.
3. **Üçüncü yol — önce elle kaydırdıktan sonra.** Fare tekerleğiyle sayfayı
   biraz aşağı kaydır (iki üç tık yeter), 1 saniye bekle, sonra bir kutuya
   tıkla. **Yine aynı yere oturacak.** 2 saniye bekle. Kapat.
4. **Dördüncü yol — sekmeler arasında gidip geldikten sonra.**
   "Ara" → "Kelime Çözücü" → "Ara" → "Kelime Çözücü" diye **üç kez** gidip
   gel, sonra bir kutuya tıkla. **Yine aynı yere.** 3 saniye bekle.

> Note for the developers: before the fix, routes 3 and 4 were the ones that
> failed — the board landed wherever the page happened to be standing.

---

## Scene 3 — The same thing on a short window

*Purpose: the rule holds at a size where the block does not comfortably fit.*

**Çekim adımları:**

1. Pencereyi **1440 × 700** yap. Hafızayı temizle.
2. Bir kutuya tıkla. Sayfanın bu sefer **daha çok** kaydığını göster.
   3 saniye bekle.
3. Klavyeyi kapat, sayfayı elle biraz aşağı kaydır, tekrar bir kutuya tıkla.
   **Yine aynı yere oturacak.** 3 saniye bekle.

---

## Scene 4 — The page still has somewhere to go

*Purpose: 140px of slack under the board, so the wheel always answers.*

**Çekim adımları:**

1. Pencere **1440 × 700**, klavye açık ve yerine oturmuş olsun.
2. Fare tekerleğini **aşağı doğru yavaşça bir tık** çevir. Sayfa biraz
   aşağı kayacak. 2 saniye bekle.
3. Bir tık daha aşağı, 2 saniye bekle. Sayfa toplamda **140 piksel** daha
   kayabiliyor; o kadarı var, fazlası yok.
4. Tekerleği **yukarı** çevirerek sayfayı başa döndür. 2 saniye bekle.

> Note: before the fix the page ended exactly where the board did, so the
> wheel did nothing and the page read as jammed.

---

## Scene 5 — A board left somewhere else

*Purpose: the page is brought to the boxes even when the board is parked, and
a place that would cover the boxes is let go.*

**Bu sahnede hafızayı sahne başında bir kez temizle, sonra temizleme** —
klavyenin hatırlanması bu sahnenin konusu.

**Çekim adımları:**

1. Pencere **1440 × 1000.** Hafızayı temizle, sayfayı yenile.
2. "Kelime Çözücü" sekmesine geç, bir kutuya tıkla.
3. Klavyeyi üst şeritten tutup **aşağı ve sağa** taşı, bırak. 2 saniye
   bekle, köşedeki düğme belirsin ve yazı kaybolsun.
4. **Sayfayı yenile** (F5).
5. "Kelime Çözücü" sekmesine geç, bir kutuya tıkla. İki şey birden olacak:
   **sayfa yine yukarı kayacak**, ve klavye **bıraktığın yerde** açılacak.
   3 saniye bekle.
6. Şimdi klavyeyi şeritten tutup **yukarı**, kutuların hizasına taşı ve
   bırak. 2 saniye bekle.
7. **Sayfayı yenile.** "Kelime Çözücü" sekmesine geç, bir kutuya tıkla.
   Klavye bu sefer **bıraktığın yerde değil, kutuların altında** açılacak ve
   köşedeki düğme olmayacak. 3 saniye bekle.

> Note for the developers: step 7 is deliberate, not a bug. A stored place is
> a window position and the boxes are not, so a place level with the boxes
> covers them at another scroll position. See LQ-KB-1 §4.

---

## Scene 6 — The page does not grow

*Purpose: the spacer is stable. This one is a console reading, not a gesture.*

**Çekim adımları:**

1. Hafızayı temizle, pencere **1440 × 1000.**
2. F12 ile konsolu aç ve **açık bırak** — bu sahnede görünmesi gerekiyor.
3. "Kelime Çözücü" sekmesine geç, bir kutuya tıkla.
4. Konsola şunu yapıştır ve Enter'a bas:

   ```
   document.documentElement.scrollHeight
   ```

   Çıkan sayıyı **3 saniye** göster.
5. Şimdi sayfayı tekerlekle beş kez aşağı yukarı kaydır. Aynı satırı tekrar
   çalıştır — **sayı aynı.** 2 saniye göster.
6. Klavyeyi **kapat**, sekmeler arasında bir kez gidip gel, sonra tekrar bir
   kutuya tıkla.
7. Aynı satırı bir kez daha çalıştır. **Sayı yine aynı.** 4 saniye göster.

> Önemli, iki nokta:
>
> - Ölçümü her seferinde **klavye açıkken** al. Klavye kapalıyken sayfa zaten
>   kısalıyor; kapalı bir okumayla açık bir okumayı karşılaştırma.
> - Konsol açıkken pencere kısalıyor, o yüzden **çıkan sayı aşağıdaki
>   örneklerle aynı olmayacak** — önemli olan üç okumanın **birbiriyle** aynı
>   olması. Konsolsuz ölçülen değerler: 1440 × 1000'de üç okumada da 1420;
>   1440 × 700'de üçünde de 1072.

> Note for the developers: before the fix this figure climbed past 11,000 on
> a window that needed 264. That is the runaway in §2a of the ticket.

---

## What the finished video has to show

A developer watching it once should be able to answer, without reading the
ticket:

1. Where exactly is the keyboard supposed to end up when a box is pressed?
2. Does the answer change if I scroll first, or switch tabs, or resize?
3. What happens to the page's own length while a board is open?
4. What happens when the reader has left the board somewhere else?
