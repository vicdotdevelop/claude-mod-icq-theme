// The backdrop scene: a 2007 messenger window seen from inside. A glossy green
// title-bar band at the top, a mint body, an aqua hairline, and big pale
// blossoms drifting in the corners like the watermark flowers ICQ 6 printed
// on its panels. The blossom is our own six-petal drawing (no red petal, no
// eight-petal logo), so it evokes the era without copying the trademark.
//
// Night mode swaps mint for pine through a media query inside the SVG.
// Words sit in the middle and the prompt at the foot, so the art stays in
// the corners and the top band.

const petal = (angle: number) =>
  `<ellipse cx="0" cy="-34" rx="19" ry="30" transform="rotate(${angle})"/>`

const blossom = [0, 60, 120, 180, 240, 300].map(petal).join('') + '<circle r="15" fill="#ffffff" fill-opacity=".45"/>'

export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
  .body-top { stop-color: #f2fff6 } .body-bottom { stop-color: #dcf4e6 }
  .gloss-a { stop-color: #e6f8dc } .gloss-b { stop-color: #b5dd9e } .gloss-c { stop-color: #7ec344 } .gloss-d { stop-color: #d0f1c4 }
  .hair { stroke: #a0d0d8 }
  .flower { fill: #8fcf68 }
  .flower { opacity: .26 }
  .flower.soft { opacity: .14 }
  .drift { animation: drift 90s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center }
  .drift.slow { animation-duration: 140s }
  @keyframes drift { from { transform: rotate(0deg) } to { transform: rotate(24deg) } }
  @media (prefers-color-scheme: dark) {
    .body-top { stop-color: #13241b } .body-bottom { stop-color: #0d1913 }
    .gloss-a { stop-color: #2b4a2c } .gloss-b { stop-color: #23402a } .gloss-c { stop-color: #2f6a24 } .gloss-d { stop-color: #1a3020 }
    .hair { stroke: #2e5a52 }
    .flower { fill: #4f9a44 }
    .flower { opacity: .28 } .flower.soft { opacity: .18 }
  }
  @media (prefers-reduced-motion: reduce) { .drift { animation: none } }
</style>
<defs>
  <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="body-top"/><stop offset="1" class="body-bottom"/>
  </linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="gloss-a"/><stop offset=".45" class="gloss-b"/><stop offset=".5" class="gloss-c"/><stop offset="1" class="gloss-d"/>
  </linearGradient>
  <g id="blossom">${blossom}</g>
</defs>
<rect width="1600" height="1000" fill="url(#body)"/>
<rect width="1600" height="44" fill="url(#gloss)"/>
<line x1="0" y1="44.5" x2="1600" y2="44.5" class="hair" stroke-width="1.5"/>
<g class="flower" transform="translate(1460 190) scale(3.2)"><g class="drift"><use href="#blossom"/></g></g>
<g class="flower soft" transform="translate(150 860) scale(2.6)"><g class="drift slow"><use href="#blossom"/></g></g>
<g class="flower soft" transform="translate(1290 900) scale(1.4)"><use href="#blossom"/></g>
<g class="flower soft" transform="translate(90 170) scale(1.1)"><g class="drift"><use href="#blossom"/></g></g>
</svg>`
