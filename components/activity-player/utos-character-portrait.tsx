import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import type { UtosCharacterId } from "../../data/utos-quiz-games";

export const UTOS_PORTRAIT_VIEWBOX = "0 0 160 180";

/** Shared illustrated characters; clothing and hairstyles distinguish the pairs. */
export function UtosPortraitArt({ characterId }: { characterId: UtosCharacterId }) {
  const teacher = characterId === "moral";
  const girl = characterId === "tess";
  const minyong = characterId === "minyong";
  const skin = minyong ? "#AB7044" : teacher ? "#C08B63" : "#D7A271";
  const shirt = teacher ? "#946440" : girl ? "#AD766E" : minyong ? "#65816B" : "#E5D7B1";
  return <G>
    <Rect x="0" y="0" width="160" height="180" rx="18" fill={minyong ? "#E9D8AE" : girl ? "#F0DDD0" : teacher ? "#E6D5B9" : "#EEE5C9"} />
    <Circle cx="80" cy="70" r="54" fill="#FFFAEB" opacity="0.55" />
    {(teacher || girl) && <Path d="M42 92V55Q40 14 80 14Q121 14 119 57V114H41Z" fill="#3D2C23" />}
    <Path d="M17 180V151Q22 120 64 117H96Q139 120 143 151V180Z" fill={shirt} />
    <Path d="M66 104V126Q80 139 94 126V104" fill={skin} />
    <Path d="M59 120L80 137L65 153L48 125M101 120L80 137L95 153L112 125" fill={teacher ? "#EAD7AE" : "#FFFAEB"} />
    <Circle cx="47" cy="73" r="9" fill={skin} /><Circle cx="113" cy="73" r="9" fill={skin} />
    <Path d="M47 51Q48 25 80 24Q113 25 113 51V82Q110 112 80 116Q49 110 47 82Z" fill={skin} />
    {teacher || girl
      ? <Path d="M44 63Q42 19 80 20Q118 17 116 65L102 48Q80 54 63 39Q58 58 44 63Z" fill="#3D2C23" />
      : minyong
        ? <Path d="M43 63L44 37L52 25L65 27L76 18L86 24L102 23L116 40L116 67L106 49L88 45L69 48L54 42Z" fill="#35291F" />
        : <Path d="M44 62Q38 24 73 20Q112 14 117 43L113 67L102 45Q77 49 57 38Z" fill="#35291F" />}
    <Path d="M58 65Q65 61 71 65M90 65Q97 61 103 65" stroke="#4C3825" strokeWidth="3" fill="none" strokeLinecap="round" />
    <Circle cx="65" cy="74" r="3" fill="#35291F" /><Circle cx="97" cy="74" r="3" fill="#35291F" />
    <Path d="M81 74L77 88H83" stroke="#98633F" strokeWidth="2" fill="none" strokeLinecap="round" />
    <Path d={teacher ? "M69 99Q80 95 91 99" : "M68 96Q80 106 92 96"} stroke="#754C34" strokeWidth="3" fill="none" strokeLinecap="round" />
    {teacher && <G stroke="#4C3825" strokeWidth="3" fill="none"><Rect x="52" y="66" width="25" height="19" rx="6" /><Rect x="84" y="66" width="25" height="19" rx="6" /><Path d="M77 73H84M47 70L52 72M109 72L114 70" /></G>}
    {girl && <Path d="M106 34L116 28L118 39L127 43L116 49L106 43Z" fill="#B64942" />}
    {!teacher && <G fill="#BDA16A"><Circle cx="81" cy="153" r="2.5" /><Circle cx="81" cy="165" r="2.5" /></G>}
  </G>;
}

export function UtosCharacterPortrait({ characterId, size = 100 }: { characterId: UtosCharacterId; size?: number }) {
  return <Svg width={size} height={size * 180 / 160} viewBox={UTOS_PORTRAIT_VIEWBOX} aria-hidden={true}>
    <UtosPortraitArt characterId={characterId} />
  </Svg>;
}
