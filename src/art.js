export function icon(name, size=24) {
 const paths={
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  rotate:'<path d="M19 8a8 8 0 1 0 1 8M19 3v5h-5"/>',
  undo:'<path d="m9 4-5 5 5 5M4 9h10a6 6 0 0 1 0 12"/>',
  reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  bulb:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
  sound:'<path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted:'<path d="M3 9h4l5-4v14l-5-4H3Zm13 0 6 6m0-6-6 6"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="m12 7 4 5-4 5-4-5Z"/>',
  check:'<path d="m5 12 4 4 10-10"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  play:'<path d="m8 5 11 7-11 7Z"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  leaf:'<path d="M20 3C8 2 2 9 6 17c8 5 15-2 14-14ZM4 21 16 9"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 1-1 2m0 3h.01"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  bag:'<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M8 7V3h8v4m-8 4v6m8-6v6"/>',
  gift:'<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12m0-12C3 9 4 2 8 3c3 0 4 6 4 6Zm0 0c9 0 8-7 4-6-3 0-4 6-4 6Z"/>',
  road:'<path d="m5 21 3-18m8 0 3 18M12 3v3m0 4v4m0 4v3"/>',
  heart:'<path d="M12 20 4 12C-1 6 6 0 12 6c6-6 13 0 8 6Z"/>'
 };
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.bag}</svg>`;
}
export function itemArt(kind) {
 const body={
 bag:'<path d="M35 20v-9h30v9" fill="none" stroke="#774d3e" stroke-width="5"/><rect x="21" y="20" width="58" height="65" rx="11" fill="#f4a38a" stroke="#aa6551" stroke-width="3"/><path d="M34 24v57m32-57v57" stroke="#ffe0c4" stroke-width="6"/><path d="M20 37h60" stroke="#b97662" stroke-width="3"/><rect x="45" y="32" width="10" height="10" rx="2" fill="#f6d278"/><circle cx="32" cy="88" r="4" fill="#6c5547"/><circle cx="68" cy="88" r="4" fill="#6c5547"/>',
 watermelon:'<ellipse cx="50" cy="53" rx="37" ry="32" fill="#7caa69" stroke="#466e48" stroke-width="3"/><path d="M40 22q-23 30-2 61m14-63q-14 36 1 64m10-60q22 29 3 56" fill="none" stroke="#476c43" stroke-width="7"/><path d="M50 20q7-13 14-6" fill="none" stroke="#496b42" stroke-width="4"/>',
 plant:'<path d="M31 63h39l-6 26H37Z" fill="#c97d58" stroke="#965e45" stroke-width="3"/><path d="M27 59h47v9H27Z" fill="#e7a077"/><path d="M50 61V23" stroke="#557b41" stroke-width="4"/><path d="M49 46C22 47 19 21 27 20c19 0 25 14 22 26Z" fill="#78a46c"/><path d="M50 32C49 8 75 9 78 13c-3 17-16 25-28 19Z" fill="#99bc78"/><path d="M51 54c3-23 24-22 27-17-4 12-12 20-27 17Z" fill="#5c8f60"/>',
 toolbox:'<path d="M37 30v-9h26v9" fill="none" stroke="#697f91" stroke-width="6"/><rect x="12" y="31" width="76" height="51" rx="9" fill="#85a6b7" stroke="#486d80" stroke-width="3"/><path d="M13 51h74" stroke="#486d80" stroke-width="3"/><rect x="42" y="45" width="16" height="15" rx="3" fill="#f0d38e"/><path d="M25 66h17" stroke="#d4e0dd" stroke-width="4"/>',
 cooler:'<rect x="17" y="28" width="66" height="59" rx="9" fill="#e6bf6d" stroke="#a3844c" stroke-width="3"/><rect x="12" y="22" width="76" height="17" rx="6" fill="#fff0c9" stroke="#a3844c" stroke-width="3"/><path d="M23 45v15q26 26 54 0V45" fill="none" stroke="#f5e6bd" stroke-width="6"/><rect x="40" y="60" width="20" height="9" rx="4" fill="#a5844c"/>',
 chair:'<path d="m24 17 9 45h39l8-45Z" fill="#c7b3cf" stroke="#8d759a" stroke-width="3"/><path d="m34 62-12 28m48-28 10 28M20 53h60m-57 0 52 37m-2-37L25 90" stroke="#5f6c68" stroke-width="4" fill="none"/><path d="M43 20v35m16-35v35" stroke="#e4d9ea" stroke-width="5"/>',
 ball:'<circle cx="50" cy="50" r="36" fill="#e9b769" stroke="#ad7e48" stroke-width="3"/><path d="M17 42h66M40 16q22 35 2 68M24 25q20 11 8 55m42-54Q53 36 67 80" stroke="#fff0bf" fill="none" stroke-width="6"/>',
 thermos:'<rect x="34" y="18" width="32" height="70" rx="9" fill="#bfd7d3" stroke="#688a87" stroke-width="3"/><rect x="32" y="11" width="36" height="18" rx="5" fill="#f2ece1" stroke="#688a87" stroke-width="3"/><path d="M41 38v32" stroke="#edf4e8" stroke-width="5"/><path d="M34 76h32" stroke="#84a5a0" stroke-width="3"/>',
 tent:'<path d="m13 80 35-65 38 65Z" fill="#dfa168" stroke="#a3714e" stroke-width="3"/><path d="m48 15 8 65H13Z" fill="#f3c785"/><path d="m46 45 12 35H32Z" fill="#745f4b"/><path d="M11 85h77M48 15V9" stroke="#7a6956" stroke-width="4"/>',
 boots:'<path d="M20 17h25v48h13v19H15V64l5-7Z" fill="#91ac85" stroke="#587a53" stroke-width="3"/><path d="M54 13h25v48h10v19H51V60l3-7Z" fill="#6b9467" stroke="#486c48" stroke-width="3"/><path d="M18 22h27m10-3h24M15 79h43m-7-4h38" stroke="#c6d7a3" stroke-width="5"/>',
 basket:'<path d="M27 44V30a23 23 0 0 1 46 0v14" fill="none" stroke="#a97c48" stroke-width="6"/><path d="m14 40 7 44h58l7-44Z" fill="#dcba7d" stroke="#9e784b" stroke-width="3"/><path d="m30 44 3 36m17-36v36m20-36-3 36M18 56h64M20 70h60" stroke="#b48e58" stroke-width="3"/>',
 rod:'<path d="m27 88 26-70" stroke="#8e6b4e" stroke-width="6"/><path d="M53 18q35 17 15 55" stroke="#d9ddd4" fill="none" stroke-width="2"/><circle cx="35" cy="67" r="9" fill="#6a8a86" stroke="#435d58" stroke-width="3"/><path d="M68 68v13q0 8-7 4" stroke="#54756c" fill="none" stroke-width="3"/>',
 };
 return `<svg viewBox="0 0 100 100" aria-hidden="true" class="item-art">${body[kind]||body.bag}</svg>`;
}
export function scenery(){return `<svg class="scenery" viewBox="0 0 320 190" aria-hidden="true"><circle cx="248" cy="42" r="27" fill="#f0cf79"/><path d="M0 132Q65 64 145 126T320 97V190H0" fill="#d5dfc5"/><path d="M0 158q90-46 170-6t150-19v57H0Z" fill="#bdcda9"/><path d="m217 74 31-30 31 30" stroke="#a47c63" stroke-width="7" fill="#e2b685"/><path d="M224 73h48v40h-48Z" fill="#f4e3ba"/><rect x="242" y="83" width="12" height="30" rx="1" fill="#8eae9a"/><path d="M32 106V54m0 21-17-11m17 22 15-12" stroke="#81946d" stroke-width="5"/><circle cx="32" cy="42" r="23" fill="#9aaf7f"/><path d="M81 140h122l-6-35q-2-10-14-13h-58q-12 1-19 13Z" fill="#eac16e" stroke="#ad8a4b" stroke-width="3"/><path d="m116 105-9 21h73l-6-21Z" fill="#718e8b"/><path d="M101 105h-9v11M185 102h14v13" stroke="#ad8a4b" stroke-width="4" fill="none"/><rect x="78" y="132" width="129" height="31" rx="9" fill="#eac16e" stroke="#ad8a4b" stroke-width="3"/><rect x="81" y="145" width="12" height="9" rx="3" fill="#ed8266"/><rect x="192" y="145" width="12" height="9" rx="3" fill="#ed8266"/><rect x="125" y="145" width="38" height="11" rx="3" fill="#fff4db"/><path d="M99 163v10m89-10v10" stroke="#4b5c4f" stroke-width="12"/><rect x="124" y="69" width="37" height="22" rx="5" fill="#da8c74"/><path d="M132 69v-7h18v7" stroke="#aa6c55" stroke-width="3" fill="none"/><path d="m167 90-4-15h18l-4 15" fill="#aa8d65"/><path d="M172 75V61m0 8q-14 0-12-11 10 0 12 11m0-1q14-2 11-12-9 0-11 12" fill="#759362"/></svg>`;}
