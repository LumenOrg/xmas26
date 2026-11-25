# Lumen adventi képeslap

Offline használható, magyar nyelvű digitális képeslap készítő a Lumen adventi műhelyéhez. A gyerekek díszeket húzhatnak a fára, ajándékokat a fa alá, vagy koppintással is hozzáadhatják őket. A képeslapra írt névből és a díszítésből helyben készül PNG kép.

## Fejlesztés

Node.js 24 és pnpm 11 szükséges. A projektnek nincs szervere vagy felhőben tárolt adata.

```sh
pnpm install
pnpm dev
```

Ellenőrzések:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

A böngészős ellenőrzéshez indítsd el a kész build előnézetét egy külön terminálban, majd futtasd a smoke tesztet:

```sh
pnpm preview --host 127.0.0.1 --port 4173
pnpm smoke
```

A smoke teszt Chromiumban és WebKitben ellenőrzi a szerkesztést, a PNG-t és a mobil elrendezést. A Chromium-teszt az offline újratöltést és egy szimulált érintéses húzást is ellenőriz. A Playwright WebKit helyi offline kapcsolója ezen a gépen hibázik; az iPad offline működését a készüléken kell ellenőrizni.

## Statikus telepítés

A `dist/` mappa a `https://lumenorg.github.io/xmas26/` címhez készül. A szokásos `pnpm build` a `/xmas26/` alapútvonalat használja, így a build fájljai GitHub Pages alatt a megfelelő helyről töltődnek be. Másik tárhelyhez felülírhatod az alapútvonalat, perjelekkel az elején és a végén:

```sh
APP_BASE_PATH=/masik-utvonal/ pnpm build
```

A build ugyanebből az útvonalból állítja elő a manifest `start_url` és `scope` mezőit, a gyorsítótár navigációs útvonalát és az asset-hivatkozásokat. A tárhely beállítása és a közzététel külön feladat.

## Műhely előtti iPad ellenőrzés

1. Nyisd meg a HTTPS-es címet Safariban, és várd meg az **„Offline használatra kész”** üzenetet.
2. A Safari Megosztás menüjében válaszd a **Hozzáadás a főképernyőhöz** lehetőséget. Ha látható, az **Open as Web App** kapcsoló maradjon bekapcsolva.
3. Nyisd meg a főképernyőre tett appot. Kapcsold be a repülőgép üzemmódot, zárd be és nyisd meg újra, majd készíts próbaképeslapot.
4. A **Kész a képeslap!** gomb elkészíti a képet. Egy felnőtt a **Kép megnyitása** gombbal külön lapon megnyithatja, a rendszer megosztási felületével mentheti vagy továbbíthatja, illetve a letöltési linket használhatja. A külön lap viselkedése iPadOS-verziónként eltérhet; az appban látható előnézet és a megosztási gomb tartalék út.
5. Új gyerek előtt az **Új képeslap** gombbal és a megerősítéssel töröld az előző nevet és díszítést.

A képeslap csak az aktuális böngészőfolyamat memóriájában él. Frissítés vagy az app bezárása után a szerkesztés elveszhet; a PNG-t a következő gyerek előtt mentsd el. Az alkalmazás nem küld e-mailt, nem tárol képeket és nem tart fenn galériát.

A Lumen jelvényének SVG-je a `lumenassociation.org` oldal meglévő arculati eszközéből származik. A többi képeslapgrafika CSS és SVG.
