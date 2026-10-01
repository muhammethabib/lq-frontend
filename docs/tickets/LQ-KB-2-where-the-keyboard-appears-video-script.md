# Where the keyboard appears when a box is pressed — video script

*Bu script canlı sitede çekiliyor: ekranda görünen, ticket'ta şikâyet
edilen davranışın kendisi. İtalik satırlar senin yapacağın hareketler, düz
satırlar da o sırada okuyacağın metin.*

---

*Tarayıcı penceresini orta boya getir (yer imleri çubuğu kapalı olsun),
arama sayfasını aç ve Word Decoder sekmesine geç.*

This is the Word Decoder on the search page. Pressing one of the empty letter
boxes opens the on-screen keyboard.

*Boş harf kutularından birine bas.*

The keyboard should open directly under the boxes, and the page should bring
the boxes and the whole keyboard into view together. Here it does not: the
page scrolls too little, and the keyboard opens away from the boxes.

*Sayfayı tekerlekle biraz aşağı kaydırmayı dene.*

There is not enough page under the keyboard to scroll to, so the user cannot
bring it into view themselves either.

*Tarayıcının yer imleri çubuğunu aç ve sayfayı yenileyip bir kutuya tekrar
bas.*

With the bookmarks bar open, the visible area is shorter, and the page does
not make up the difference. All the keys are on screen, but the bottom edge of
the keyboard is below it. The panel looks cut off, and there is nothing left
underneath it.

*Klavyeyi tutup yukarı, kutuların altına doğru taşı.*

At this point the only thing left to the user is to drag the keyboard into
place by hand.

*Sayfayı yenile ve bir kutuya tekrar bas.*

The position they chose comes back on the next press, and on later visits. The
keyboard now opens near the edge of the screen, and the page has stopped
scrolling altogether.

---

*Buradan sonrası istenen davranış. Konuşurken ekranda bir şey yapmana gerek
yok.*

What should happen instead is this.

A press on a letter box opens the keyboard directly under the boxes, at any
window size, without the user having to move it there.

If the boxes and the whole keyboard are already in view, with a little empty
page below the keyboard, the page stays where it is. Otherwise it scrolls
until all of it comes into view.

The whole keyboard is visible — its bottom edge as well as its keys — with a
gap of empty page below it, and the page can still be scrolled down a little
from there.

The page makes that room for itself. It measures the area the browser is
actually showing, so a bookmarks bar, a toolbar or a changed zoom level makes
no difference to where things end up.

A press always starts from the keyboard's usual place under the boxes. A
position the user chose earlier may be kept while the page is open, but it is
never carried into a later visit, and it never stands in for the scroll.

Closing the keyboard leaves that extra page length in place. The page does not
jump back, and the next press opens the keyboard in the same position.

The result is the same every time: on the first press after the page loads, on
a second press after closing the keyboard, and on a press after switching to
the Search tab and back.
