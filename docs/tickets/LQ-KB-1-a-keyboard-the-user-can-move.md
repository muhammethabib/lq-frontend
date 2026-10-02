# Moving the keyboard

- **Area:** Search page — the Word Decoder tab and the Search tab
- **Type:** Behaviour
- **Affects:** Every window wide enough for the keyboard to float (768px and up)
- **Front-end only:** this is about what the page does on screen; nothing here
  asks for a change on the server.

---

## What should happen

### Taking hold of it

1. **Where the Word Decoder keyboard can be held:**
   - its **top bar** (the strip with Clear, the wildcards and the close key)
   - the **empty space beside the key rows**
   - its **left, right and bottom edges**

2. **Where the Search keyboard can be held:**
   - its **top bar**
   - its **left, right and bottom edges** (the margin around the keys)

   The two keyboards are held **the same way**.

3. **On hover, the user sees where to hold it:**
   - a **faint field of small dots** appears in that area
   - the panel **lifts slightly** off the page
   - the cursor is an **open hand**

   Beside the key rows the dots **fade away before they reach the keys**.
   **At rest, no dots are shown.**

4. **The Search keyboard's top bar has two states:**
   - **Before the user types anything** (on this keyboard or their own), the
     bar shows a teaching line — *Use your own keyboard or click the keys
     below* — and the dots appear **on either side of it**.
   - **After the first letter**, the line goes and the dots fill **the middle
     of the bar**.
   - The line **comes back after a reload**.

5. **What is not a handle:**
   - **every key and every button** on the bar keeps its own press
   - the **narrow gaps between keys and between rows**
   - the **margin beside and below the Advanced / Basic key** on the Word
     Decoder — it belongs to the key

   A press that **just misses a key reaches the key**; it never carries the
   keyboard away.

6. **While carried:** the cursor is a **closed hand**, the keyboard **follows
   the pointer exactly**, and it **can never leave the window**.

### Putting it down

1. **On a drop in a new place**, a small button appears in the keyboard's
   **top-left corner** and **flashes once**.
   - On the Word Decoder that corner is where **Clear** stands: Clear **steps
     a little to the right** to make room, and **returns** when the button
     goes.

2. **The button flashes again on every drop**, not only the first one. Each
   drop is a new place; the flash confirms it.

3. **The "Put it back" label:**
   - appears over the button **the first time** the user moves a keyboard in a
     visit, for **about two seconds**
   - is shown **once**, counting **both keyboards as one**
   - is shown **again after a reload**

4. **Hovering the button** draws an **outline on the page** where the keyboard
   will return to.

5. **Pressing the button** returns the keyboard to its **usual place**; the
   button **fades away**.

6. **Carrying it back by hand:** near its usual place a **dashed outline**
   appears behind it and **grows clearer** as it nears. **Dropped close
   enough**, it **settles in by itself** and the button disappears.

### Keeping the place

1. **While the page is open**, a moved keyboard **stays where it was put** —
   also after the keyboard is closed and opened again.

2. **After a reload** (an ordinary one; no hard reload needed) the keyboard
   opens in its **usual place**. The place is **never written to the
   browser's memory** for the site.
