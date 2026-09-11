import Svg, { Circle, G, Path, Rect } from "react-native-svg";

/** Fine vector engraving stays sharp during the portal zoom. */
export function BookCoverEngraving() {
  return <Svg width="100%" height="100%" viewBox="0 0 180 250" preserveAspectRatio="none">
    <Rect x="8" y="8" width="164" height="234" rx="9" fill="none" stroke="#D6B572" strokeWidth="1.2" />
    <Rect x="12" y="12" width="156" height="226" rx="7" fill="none" stroke="#D6B572" strokeOpacity="0.3" strokeWidth="0.5" />
    <G fill="none" stroke="#E0BE78" strokeWidth="1" strokeLinecap="round">
      {[0, 1, 2, 3].map(i => <G key={i} transform={`translate(${i % 2 ? 180 : 0} ${i > 1 ? 250 : 0}) scale(${i % 2 ? -1 : 1} ${i > 1 ? -1 : 1})`}>
        <Path d="M17 46V23Q17 17 24 17H47 M20 36Q38 35 37 20 M23 30Q27 20 32 23Q34 28 23 30 M20 44Q29 37 36 40" />
        <Circle cx="44" cy="20" r="1.5" fill="#E0BE78" />
      </G>)}
      <Path d="M57 190Q90 202 123 190 M66 196Q90 207 114 196 M71 62Q90 51 109 62" strokeOpacity="0.6" />
    </G>
    <G fill="none" stroke="#B8CBB0" strokeOpacity="0.075" strokeWidth="0.7">
      {Array.from({ length: 9 }, (_, i) => (
        <Path
          key={i}
          // Separate every coordinate. Concatenating a computed Y with the
          // next X produced incomplete Q commands and crashed iOS's parser.
          d={[
            "M", 20, 40 + i * 20,
            "Q", 90, 5 + i * 20, 160, 40 + i * 20,
            "Q", 90, 75 + i * 20, 20, 40 + i * 20,
          ].join(" ")}
        />
      ))}
    </G>
    <Path d="M90 69L119 89V122L90 144L61 122V89Z" fill="#092F2B" fillOpacity="0.6" stroke="#DDBD7B" />
    <Path d="M90 76L113 92V119L90 136L67 119V92Z" fill="none" stroke="#DDBD7B" strokeOpacity="0.4" />
    <G fill="none" stroke="#EED69A" strokeWidth="1.5" strokeLinejoin="round">
      <Path d="M90 121V95Q80 88 72 93V116Q82 112 90 121Q98 112 108 116V93Q100 88 90 95 M75 99L84 102 M75 104L84 107 M96 102L105 99 M96 107L105 104" />
      <Path d="M90 80V85 M87 82.5H93" />
    </G>
    <Circle cx="90" cy="216" r="9" fill="none" stroke="#DDBD7B" strokeOpacity="0.6" />
    <Path d="M90 209L92 214L97 216L92 218L90 223L88 218L83 216L88 214Z" fill="#DDBD7B" />
  </Svg>;
}

export function PageLandscape() {
  return <Svg width="100%" height="100%" viewBox="0 0 160 130">
    <G fill="none" stroke="#768765" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 87Q38 68 62 84Q90 59 146 85 M14 95Q57 86 89 96Q116 85 148 93 M63 128Q40 112 79 103Q112 95 97 90" />
      <Circle cx="110" cy="35" r="15" stroke="#C09D59" />
      <Path d="M110 13V8 M129 20L133 16 M133 35H139 M89 19L85 15 M88 35H81" stroke="#C09D59" />
      <Path d="M32 86V57 M26 86L32 72L38 86 M20 63Q7 59 18 45Q10 32 26 29Q32 15 42 29Q60 28 53 44Q66 59 47 64Z" fill="#718B62" fillOpacity="0.09" />
      <Path d="M120 91V76 M106 77L121 64L139 77Z M109 77V91H135V77 M118 91V83H125V91" />
      <Path d="M69 53Q74 48 79 53Q84 48 89 53 M57 37Q61 33 65 37Q69 33 73 37" strokeOpacity="0.5" />
      <Path d="M20 105L22 99L24 105 M132 109L134 102L137 109" />
    </G>
  </Svg>;
}
