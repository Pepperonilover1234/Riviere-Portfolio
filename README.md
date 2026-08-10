# reverie

Portfolio site for Reverie — a studio doing film, photo and sound.

Stripped-back editorial layout: fixed left sidebar, a single narrow column of
media on the right, monospace type, no cards, no shadows. Four page types:

- **landing** — cover image, intro, and the three disciplines
- **film / photo / sound** — one page each, with a numbered service list and
  the work from that discipline
- **project pages** — one per entry in `work`
- **about**, **contact**, **all work**

No build step, no dependencies, no server. Double-click `index.html` and it runs.

If you'd rather serve it over http — to test on your phone over the same wifi,
or because a video embed sulks on `file://` — run `node serve.js` and open
<http://localhost:4321>.

## Two languages

The site is English and Thai. The toggle sits in the sidebar under the tagline —
`EN / ไทย`. On a first visit it picks Thai automatically if the browser is set to
Thai, English otherwise, then remembers the choice in `localStorage`. Switching
plays the slate transition with the new language on it.

Any text a visitor reads is written as a **pair**:

```js
tagline: { en: "film · photo · sound", th: "วิดีโอ · ภาพ · เสียง" }
```

A **plain string with no pair shows in both languages** — which is what you want
for things that shouldn't be translated:

```js
name: "reverie",
{ name: "sony zv-e10", ... },
v: "chaiananpanadit.direct@gmail.com"
```

So to add a language to anything, wrap it in `{ en: …, th: … }`. To take one
away, replace the pair with a plain string. Nothing else has to change.

The button labels the site owns — "you get", "SELECTED {x} WORK", the 404, the
menu — live in the `ui` block at the top of `content.js`. `{x}` in
`selectedWork` is replaced with the discipline name, which is why the Thai reads
`งานวิดีโอที่เลือกมา` and the English reads `SELECTED FILM WORK`.

Thai typography is handled in the stylesheet: mono faces for Latin with Thai
faces after them in the same stack (so mixed sentences work), and under
`html[lang="th"]` the size goes up to 13px, line-height to 2 for the vowel marks,
and letter-spacing to 0 — tracking pulls Thai apart because the script has no
spaces between words.

## Editing

**Everything you change lives in [`js/content.js`](js/content.js).** Open it in
any text editor, change the words, save, refresh the browser. Anything marked
`// TODO` in that file is a placeholder waiting for your real details.

| What | Where in `content.js` |
| --- | --- |
| Studio name, tagline, city, copyright | top of the file |
| Landing page image + intro | `home` |
| The film page | `disciplines.film` |
| The photo page | `disciplines.photo` |
| The sound page | `disciplines.sound` |
| Email, socials, phone | `contact.rows` |
| Bio + the facts table | `about` |
| Kit list | `gear` |
| Every project | `work` array |

### Adding or changing a service

Each discipline page has a numbered `services` list. Copy a block, change the
words — the numbering (01, 02, 03…) is automatic.

```js
{
  title: "short photoshoot",
  body:  "the pitch — what it is and how it runs.",
  gets:  "15–25 retouched images",        // the "you get" line
  note:  "1–2 hours · delivered in 3 days" // the small grey line under it
}
```

The photo page has only the two services you named so far; there's a marked slot
in `content.js` to drop more in. The sound page beyond `mixing` is my guess at
your wording — rewrite or delete those three.

### The about page

`about.body` is the prose (one string per paragraph). `about.facts` is the small
table underneath — a plain list of `{ k, v }` pairs, so add or drop rows freely.
`about.cta` is the link at the bottom, currently pointing at the gear page.

Real details are in there now: name, nickname, Lampang, and the school. If you'd
rather not have the school on a public page, delete the `studying` row from
`about.facts` and the school clause from the fourth paragraph — nothing else
depends on either.

### The gear page

Grouped kit list. Each group is a heading plus a list of items:

```js
{
  title: "lenses",
  items: [
    { name: "50mm f/1.8 prime",
      note: "portraits and low light",           // optional
      url:  "https://www.sony.com/..." }         // optional — makes the row a link
  ]
}
```

Rows with a `url` become links that open in a new tab and show a `↗` on hover;
rows without one are plain text. Add a group by copying a whole block.

The reference links point at official manufacturer and product pages rather than
deep model-specific URLs, which go stale quickly. Swap in the exact product page
for anything you want to be precise about.

### Adding a project

Copy any block in `work`. **`discipline` decides which page it appears on** —
`"film"`, `"photo"` or `"sound"`. `client` is the sidebar label, `slug` is the
url (`#/work/your-slug`).

```js
{
  discipline: "film",
  slug: "my-project",
  client: "brand / project",
  title: "BRAND — PROJECT",
  year: "2026", role: "director / dp", kind: "brand film",
  blurb: ["First paragraph.", "Second paragraph."],
  media: [ /* see below */ ]
}
```

### Media blocks

Put any number of these in a project's `media` array; they render top to bottom.

```js
{ type: "image",  src: "assets/media/photo/x.jpg", alt: "", caption: "" }
{ type: "images", items: [{src:"assets/media/photo/a.jpg",alt:""},
                          {src:"assets/media/photo/b.jpg",alt:""}] }        // 2-up grid
{ type: "video",  src: "assets/media/film/x.mp4",
                  poster: "assets/media/film/x.jpg" }                       // self-hosted
{ type: "embed",  src: "https://player.vimeo.com/video/123456" }            // youtube/vimeo
{ type: "audio",  tracks: [{title:"Track",
                            src: "assets/media/sound/x.mp3", length:"3:41"}] }
```

Inside `blurb`, `body` and `intro` strings you can use `<b>`, `<em>`, `<br>` and
`<a href="...">link</a>`. Anything else is printed as plain text.

- **embed** needs the *embed* url, not the share url:
  YouTube `https://www.youtube.com/embed/VIDEO_ID`, Vimeo `https://player.vimeo.com/video/VIDEO_ID`.
- **audio** tracks appear as a numbered list and drive the player bar pinned to
  the bottom of the screen. If a file is missing the bar says so instead of
  failing silently.

## The page transition

Moving between pages runs a **slate wipe**: six vertical slats sweep down and
cover the screen, the destination name spreads out in the middle like a
clapperboard slate, then the slats sweep away off the bottom. The content is
swapped while the screen is covered, so there's never a flash of the old page.

The whole thing takes about 840ms. To retime it, the durations live in two
places that must be changed together:

- `css/style.css` — the `page transition` section near the bottom
- `js/app.js` — the two `setTimeout` values in `route()`

Visitors who have "reduce motion" turned on in their OS get an instant swap with
no overlay at all. That's deliberate.

Smaller motion elsewhere: content blocks rise in sequence on each page, images
unveil top-to-bottom behind a clip, images scale slightly on hover, and list
rows nudge right when you point at them.

## Your files

Your work goes in **[`assets/media/`](assets/media/)** — three folders, `film`,
`photo` and `sound`, sorted by what the work is rather than what the file type
is. Drop files in, then point `content.js` at them:
`assets/media/photo/sports-day-01.jpg`.

There's a [guide in that folder](assets/media/README.md) covering the four media
block types, file naming, and export sizes. Short version: **lowercase, hyphens,
no spaces, no Thai characters in filenames** — those work locally but break on
some hosts, and the failure looks like a missing file rather than a naming
problem.

Image sizes that suit this layout: **1000×1250** portrait, **1600×900** wide,
**1200×1200** square. Export JPEG at ~80%; the column is only 520px wide so
nothing needs to be enormous. Put anything longer than about a minute of video
on YouTube or Vimeo and use an `embed` block — a self-hosted mp4 downloads in
full before it plays.

The `.svg` files in `assets/img/` are the placeholders currently showing on every
page. Delete that folder once your own work is in.

## Look and feel

All colours, type size, sidebar width and column width are the tokens at the top
of [`css/style.css`](css/style.css). Change `--accent` for the hover and slate
colour, `--measure` for how wide the content column runs.

### Light and dark

Both palettes are written once at the top of the stylesheet as `--l-*` and
`--d-*`, and a single block remaps them onto the live `--bg`, `--ink` and so on.
So to recolour a theme you edit one line, not two.

Behaviour, in order of precedence:

1. If the visitor has used the sun/moon toggle, that choice wins and is
   remembered in `localStorage`, across reloads and pages.
2. Otherwise the site follows their operating system, and switches live if they
   change it.

The toggle sits next to the language switch. It's one SVG — a circle and eight
rays — that morphs: going dark scales the circle up, slides a masked circle
across it to bite out a crescent, and folds the rays away. Every value is
interpolated from a `--dark` switch (`0` or `1`) that's set by the *same* rule as
the palette, so the icon can't ever show the wrong state. Its label is
translated like everything else, in `ui.themeToDark` / `ui.themeToLight`.

There's a small inline script in `<head>` that applies a saved theme before the
first paint. Without it, someone who chose dark on a light machine gets a white
flash on every page load. Don't move it into `app.js` — by then it's too late.

## Publishing

It's static, so anything works: drag the folder onto
[Netlify Drop](https://app.netlify.com/drop), or push to GitHub and turn on
Pages, or upload by FTP to any host. Nothing needs Node or a database.

## What's real and what isn't

**Real:** the studio name, the about page, every contact detail, the whole gear
list, and the service lists on the film and photo pages.

**Real work:** `travel vlog` — your own 6m02s film, self-hosted. And
`fishing days` — 18 of your own frames, though the images are the JPEG previews
pulled out of your `.ARW` files, so they're Sony's in-camera rendering rather
than your grade. Save your Lightroom exports over them using the same filenames
and nothing else needs changing. Titles and blurbs on both are still mine —
rewrite them.

> **Before publishing:** `assets/media/film/roam-travel-vlog.mp4` is a **2.07 GB
> master at 49 Mbps.** Self-hosted video downloads in full before it plays, so
> as it stands every visitor pulls 2 GB. Export ~8 Mbps 1080p h.264 from Resolve
> (~360 MB) and save it over that exact filename — no code changes needed. Add a
> `poster` still while you're there, or the player shows a black rectangle until
> it buffers.

**Still placeholder:** the other three `work` entries — school event, live
session, music production. Real categories, invented write-ups, pointing at the
grey `assets/img` stand-ins. Also the three sound services below `mixing`.

Projects are fully bilingual — title, sidebar label, role, blurb and captions
all switch with the language. Add new ones the same way.

Deliberately **not** translated, because they shouldn't be: the studio name,
your email and LINE id, the words "instagram" and "youtube", song titles, gear
product names (`sony zv-e10`, `fabfilter`), and image `alt` text — that last one
is for screen readers and search engines rather than the page, and doubling it
isn't worth the bulk.

Your name in `about.facts` is still latin script in the Thai version. That's the
one real gap, and only you can fill it — it's marked `// TODO`.

### The "dm for details" row

Anything you do that isn't in `work` is covered by a row the site appends
automatically — to the bottom of the sidebar list and to the bottom of every
work index, linking to the contact page. Nothing to maintain: add a real project
and it slots in above the row.

Its wording is `ui.dmWork` at the top of `content.js`, one line per language.
