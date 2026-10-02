# Moving the keyboard — video script

*İlk bölüm canlı sitede çekiliyor: bugünkü durum. İkinci bölüm yeni ön yüzde
(GitHub sayfası) çekiliyor: istenen davranışın kendisi. İtalik satırlar senin
yapacağın hareketler, düz satırlar da o sırada okuyacağın metin.*

---

## On the live site

*Canlı sitede önbelleği ve site verisini temizle. Arama sayfasını aç, Word
Decoder sekmesine geç ve boş harf kutularından birine bas.*

This video is about moving the on-screen keyboard. Both keyboards on the
search page — this one on the Word Decoder, and the one on the Search tab —
float above the page, so sooner or later they cover something the user wants
to read. On the live site the keyboard can already be moved.

*Klavyeyi tutup sayfanın başka bir yerine taşı ve bırak.*

When the user drags it somewhere, that place is written to the browser's
memory for the site.

*Ctrl+Shift+R ile sayfayı sert yenile ve bir kutuya tekrar bas.*

It comes back on every later press and on every later visit, and even a hard
reload does not clear it. A moved keyboard should stay where it was put while
the page is open, and no longer. This is also what breaks the keyboard's
opening position in LQ-KB-2.

---

## On the new front-end

*Yeni ön yüzü (GitHub sayfası) aç, Word Decoder sekmesine geç ve bir kutuya
bas.*

Here is the same keyboard as it should behave.

*Fareyi klavyenin üst çubuğuna getir, birkaç saniye orada tut.*

When the pointer rests on the top bar, a faint field of small dots appears
along it and the panel lifts a little off the page. The cursor turns into an
open hand. Together these show the user that the keyboard can be picked up,
and where.

*Fareyi tuşların yanındaki boş alana getir.*

The empty space beside the key rows does the same. The dots follow the exact
shape of that space, so wherever they appear, the keyboard can be carried
from there. On this keyboard the narrow gaps between the keys and between the
rows carry it too.

*Bir tuşa bas ve harfin yazıldığını göster.*

The keys themselves are not handles: each one still takes its own press.

*Klavyeyi üst çubuğundan tutup sayfada gezdir, ama henüz bırakma. Sonra
pencerenin kenarına doğru it.*

While it is being carried, the cursor is a closed hand and the keyboard
follows the pointer exactly. It stops at the edge of the window — it can
never be carried out of sight.

*Klavyeyi bir yere bırak.*

As soon as it is dropped, a small button appears in the top-left corner of
the keyboard and flashes once.

*Butonun üstünde beliren yazıyı göster, kaybolana kadar bekle.*

The first time in a visit, a short label appears over that button: "Put it
back". It stays for about two seconds and then goes. It is shown once —
moving the keyboard again does not repeat it — until the page is reloaded:
after F5, the first move shows it again.

*Fareyi butonun üstüne getir, sayfadaki çerçeveyi göster.*

Hovering the button draws an outline on the page, showing where the keyboard
will go back to.

*Butona bas.*

Pressing it sends the keyboard back to its usual place, and the button fades
away.

*Klavyeyi tekrar taşı, sonra tutup ilk yerinin yakınına doğru getir, ama
henüz bırakma.*

There is a second way back. While the keyboard is being carried towards its
usual place, a dashed outline of that place appears behind it and grows
clearer as the keyboard comes closer.

*Klavyeyi çerçevenin üstüne bırak.*

Dropped close enough, it settles into its usual place by itself, and the
button disappears.

*Klavyeyi yine taşı, kapat, sonra bir kutuya basarak tekrar aç.*

A keyboard the user has moved stays where it was put while the page is open.
Closing it and opening it again brings it back to the same place.

*Sayfayı normal şekilde yenile (F5) ve bir kutuya bas.*

After an ordinary reload — no hard reload needed — the keyboard opens in its
usual place under the boxes again. Its place is never written to the
browser's memory.

*Klavyeyi bir kez daha taşı ve yazının yeniden çıktığını göster.*

And since a reload starts the visit over, the "Put it back" label is shown
once more.

*Klavyenin sol alt köşesindeki Gelişmiş / Temel tuşunu göster.*

The Advanced and Basic key sits in the bottom-left corner of the panel, flush
with its left edge and its foot.

*Arama sekmesine geç ve arama kutusuna tıklayarak klavyeyi aç. Fareyi sırayla
üst çubuğa, sol kenara, sağ kenara ve alt kenara getir.*

The keyboard on the Search tab works in the same way. Here the handle is its
top bar and the margin around the keys — the left edge, the right edge and
the bottom edge. Each of them shows the dots and the open hand when the
pointer is on it.

*Fareyi iki tuşun arasındaki boşluğa getir.*

On this keyboard the gaps between the keys are not part of the handle, so a
press that just misses a key does not carry the keyboard away.

*Klavyeyi sol kenarından tutup taşı ve bırak, sonra köşedeki butona bas.*

It can be picked up by any of those edges, and the button in its corner works
just as it does on the Word Decoder.

*Tarayıcı penceresini telefon genişliğine kadar daralt ve klavyeyi aç.*

On phone-size windows the keyboard sits along the bottom of the screen. There
is nowhere to move it to, so none of this applies: no dots, no hand, and no
button in the corner.

---

## What should happen

*Buradan sonrası istenen davranışın özeti. Konuşurken ekranda bir şey
yapmana gerek yok.*

To sum up.

The user can see where to take hold of each keyboard before trying: the top
bar and the empty space beside the keys on the Word Decoder; the top bar and
the left, right and bottom edges on the Search tab. Every key still takes its
own press.

A moved keyboard gets a button in its corner that puts it back in one press,
and the first move of a visit is explained once, in a short label.

The place is kept while the page is open, and never written to the browser's
memory. After a reload, the keyboard is back in its usual place.

All of this is the same on both keyboards, in both languages, and in Edge,
Chrome and Firefox.
