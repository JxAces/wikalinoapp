import Svg, {
  Circle,
  Path,
} from "react-native-svg";

type StoryMapRoadProps = {
  height: number;
};

export default function StoryMapRoad({
  height,
}: StoryMapRoadProps) {
  const roadPath = `
    M 165 55
    C 250 90, 260 160, 220 225
    C 180 290, 65 275, 82 390
    C 95 500, 250 485, 228 610
    C 208 730, 65 715, 90 845
    C 110 955, 245 950, 215 1070
  `;

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 330 ${height}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
      }}
      pointerEvents="none"
    >
      {/* Soft outer road shadow */}
      <Path
        d={roadPath}
        stroke="rgba(47,44,70,0.10)"
        strokeWidth={25}
        fill="none"
        strokeLinecap="round"
      />

      {/* Main road */}
      <Path
        d={roadPath}
        stroke="#D8CEB8"
        strokeWidth={19}
        fill="none"
        strokeLinecap="round"
      />

      {/* Lighter road center */}
      <Path
        d={roadPath}
        stroke="#EFE7D7"
        strokeWidth={13}
        fill="none"
        strokeLinecap="round"
      />

      {/* Dashed center trail */}
      <Path
        d={roadPath}
        stroke="#B7A98F"
        strokeWidth={2.5}
        strokeDasharray="8 10"
        fill="none"
        strokeLinecap="round"
      />

      {/* Small map markers / stones */}
      <Circle cx="71" cy="155" r="5" fill="#D4C8AE" />
      <Circle cx="272" cy="332" r="4" fill="#D4C8AE" />
      <Circle cx="51" cy="575" r="6" fill="#D4C8AE" />
      <Circle cx="278" cy="795" r="5" fill="#D4C8AE" />
      <Circle cx="55" cy="980" r="4" fill="#D4C8AE" />
    </Svg>
  );
}