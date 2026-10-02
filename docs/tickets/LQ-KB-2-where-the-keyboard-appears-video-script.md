# Where the keyboard appears when a box is pressed — video script

*Bu script canlı sitede çekiliyor. Aynı şeyi üç tarayıcıda göstereceksin:
Edge, Chrome ve Firefox. İtalik satırlar senin yapacağın hareketler, düz
satırlar da o sırada okuyacağın metin.*

---

## Edge

*Edge'i aç. Önce sitenin önbelleğini, çerezlerini ve site verisini tamamen
temizle; temizlediğini ekranda göster.*

This is about the keyboard in the Word Decoder — where it appears when a
letter box is pressed. I will show the same thing in three browsers: Edge,
Chrome and Firefox. I have cleared the cache and the site data in all three
first, so the site starts clean.

*Arama sayfasını aç ve Word Decoder sekmesine geç.*

This is the Word Decoder. Pressing one of the empty letter boxes opens the
on-screen keyboard.

*Boş harf kutularından birine bas.*

On a clean browser this works. The page scrolls, the keyboard opens under the
boxes, and everything that should be on screen is on screen.

*Aynı basışı bir daha yap ve açılıştaki gecikmeyi göster.*

There is one thing to fix here: a short lag. Between the press and the
keyboard appearing there is a noticeable pause, and the page's movement
stutters rather than running as one motion. The keyboard should appear at
once, and the page should move in one go.

*Klavyeyi tutup sayfanın başka bir yerine taşı.*

Now I move the keyboard, for whatever reason — to see something underneath it.

*Klavyeyi kapat ve bir kutuya tekrar bas.*

That position has gone straight into the browser's memory for the site. The
next press uses it.

*Ctrl+Shift+R ile sayfayı sert yenile, sonra bir kutuya bas.*

A hard reload does not clear it. Neither does Ctrl+F5. The position stays.

*Bir kutuya birkaç kez bas; iki davranışı da göster.*

From here the press does one of two things. Either the page does not scroll at
all and the keyboard opens wherever I last left it — or the page does scroll
down, but the keyboard is still not under the boxes, and I have to drag it
there again myself.

## Chrome

*Chrome'a geç. Yine önbelleği ve site verisini temizle, bir kutuya bas,
klavyeyi taşı, sert yenile ve tekrar bas.*

The same in Chrome. Clean, it works. Once the keyboard has been moved, the
position is remembered, a hard reload does not clear it, and the press stops
putting the keyboard under the boxes.

## Firefox

*Firefox'a geç ve aynı adımları tekrarla.*

And the same in Firefox. This is not one browser behaving oddly — it is the
same behaviour in all three.

---

## What should happen

*Buradan sonrası istenen davranış. Konuşurken ekranda bir şey yapmana gerek
yok.*

What should happen instead is this.

The keyboard appears the moment a box is pressed. There is no pause between
the press and the keyboard, and the page's movement is one smooth motion
rather than a series of small jumps.

The keyboard opens directly under the boxes, at any window size, without the
user having to move it there.

If the boxes and the whole keyboard are already in view, with a little empty
page below the keyboard, the page stays where it is. Otherwise it scrolls
until all of it comes into view.

The whole keyboard is visible — its bottom edge as well as its keys — with a
gap of empty page below it, and the page makes that room for itself whatever
the height of the window. From there the page can still be scrolled down a
little.

A press always starts from the keyboard's usual place under the boxes. A
position the user chose earlier may be kept while the page is open, but it is
never written to the browser's memory for the site, it never survives a
reload, and it never stands in for the scroll.

Closing the keyboard leaves that extra page length in place. The page does not
jump back, and the next press opens the keyboard in the same position.

The result is the same every time: on the first press after the page loads, on
a second press after closing the keyboard, on a press after switching to the
Search tab and back, and on a press after the keyboard has been moved by hand
and the page reloaded.
