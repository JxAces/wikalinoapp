import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

export const BOOK_PAGE_COUNT = 6;

export function StorybookTurningPage({ index, height, width, timeline }: {
  index: number; height: number; width: number; timeline: SharedValue<number>;
}) {
  const start = 0.3 + index * 0.072;
  const finish = start + 0.26;
  const pageStyle = useAnimatedStyle(() => {
    const progress = interpolate(timeline.value, [start, finish], [0, 1], Extrapolation.CLAMP);
    const turn = progress * progress * (3 - 2 * progress);
    const lift = Math.sin(turn * Math.PI);
    return {
      // A bounded 2D projection avoids nested iOS 3D/SVG backing layers.
      opacity: progress > 0 && progress < 1 ? 1 : 0,
      transform: [
        { translateX: Math.min(0, Math.cos(turn * Math.PI)) * (width - 7) },
        { translateY: -5 * lift },
        { scaleX: Math.max(0.025, Math.abs(Math.cos(turn * Math.PI))) },
      ],
    };
  });
  const shadeStyle = useAnimatedStyle(() => {
    const progress = interpolate(timeline.value, [start, finish], [0, 1], Extrapolation.CLAMP);
    return { opacity: Math.sin(progress * Math.PI) * 0.5 };
  });
  return <Animated.View style={[styles.sheet, { width: width - 7, height: height - 12, zIndex: 30 + index }, pageStyle]}>
    <View style={styles.face}>
      <LinearGradient colors={["#DCCB9F", "#FFFAEB", "#F3E8CE"]} locations={[0,0.22,1]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.fill}>
        <View style={styles.frame} />
        <Text style={styles.eyebrow}>MGA KUWENTONG PILIPINO</Text>
        <View style={styles.picture}><View style={styles.illustration} /></View>
        {[0,1,2,3].map(line=><View key={line} style={[styles.line,{width:line===3 ? "45%" : "70%"}]} />)}
        <Text style={styles.number}>{2 + index * 2}</Text>
        <Animated.View style={[StyleSheet.absoluteFill, shadeStyle]}>
          <LinearGradient colors={["rgba(51,37,14,0.45)","rgba(51,37,14,0)","rgba(255,255,246,0.6)"]} locations={[0,0.63,1]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.fill} />
        </Animated.View>
      </LinearGradient>
    </View>
  </Animated.View>;
}
const styles=StyleSheet.create({
  sheet:{position:"absolute",left:"50%",top:6,transformOrigin:"left center"},
  face:{...StyleSheet.absoluteFill,borderTopRightRadius:7,borderBottomRightRadius:9,overflow:"hidden",borderWidth:0.5,borderColor:"#CEBE97"},
  illustration:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:"#C0B087",backgroundColor:"#E4E5CF"},
  fill:{flex:1,alignItems:"center",justifyContent:"center"},
  frame:{position:"absolute",top:10,bottom:10,left:11,right:11,borderWidth:0.5,borderColor:"rgba(159,133,83,0.28)",borderRadius:3},
  eyebrow:{fontSize:5,fontWeight:"700",letterSpacing:1,color:"#8B794F",marginBottom:4},
  picture:{height:"45%",width:"76%",alignItems:"center",justifyContent:"center"},
  line:{height:1,backgroundColor:"rgba(108,90,54,0.2)",marginTop:5},
  number:{position:"absolute",bottom:13,color:"#95825B",fontSize:7},
});
