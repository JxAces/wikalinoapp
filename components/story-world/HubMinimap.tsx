import { memo, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { HUB_BRIDGES, HUB_HOUSES, HUB_RIVER_X, HUB_TRAILS } from "./hub-layout";
import { minimapHeading, minimapPoint, minimapRoute } from "./hub-minimap";
import { worldChestPosition } from "./story-world.constants";
import type { StoryWorldPortal, StoryWorldStatus } from "./story-world.types";
import { AppTheme } from "@/constants/colors";

type Props = { portals: readonly StoryWorldPortal[]; player: NonNullable<StoryWorldStatus["minimap"]>; top: number };
const points = (route: readonly {x:number;z:number}[]) => route.map(p=>{const at=minimapPoint(p);return `${at.x},${at.y}`;}).join(" ");
const regions = ["Talon", "Gubat", "Nayon"];
const Background = memo(function Background() {
  return <G>
    <Rect x={2} y={2} width={96} height={96} rx={12} fill="#95B875" />
    <Path d="M49 6 Q72 0 94 8 L95 33 Q78 46 54 31Z" fill="#4C8050" />
    <Path d="M8 15 Q16 5 29 8 L29 29 L10 33Z" fill="#648567" />
    <Path d="M67 49 Q98 46 95 64 L94 88 L65 89 Q58 68 67 49" fill="#B6BE85" />
    {[-31,-20,4,15,26].map((z,i)=><Circle key={z} cx={i<2?14:48+i*8} cy={minimapPoint({x:0,z}).y} r={3} fill="#6A984E" />)}
    <Rect x={minimapPoint({x:HUB_RIVER_X-2.5,z:0}).x} y={5} width={6} height={90} fill="#5FAAB8" />
    <Ellipse cx={minimapPoint({x:-25,z:0}).x} cy={minimapPoint({x:0,z:-28}).y} rx={7} ry={5} fill="#8AD3D6" />
    <Polyline points={points([{x:-25,z:-29},{x:HUB_RIVER_X,z:-29}])} stroke="#8AD3D6" strokeWidth={4} />
    {HUB_TRAILS.map((trail,i)=><Polyline key={i} points={points(trail.map(([x,z])=>({x,z})))} stroke="#E2D7A1" strokeWidth={2.1} strokeLinejoin="round" fill="none" />)}
    {HUB_BRIDGES.map(z=><Rect key={z} x={minimapPoint({x:-16.5,z}).x} y={minimapPoint({x:0,z}).y-1.8} width={8.3} height={3.6} rx={.5} fill="#9E7345" stroke="#E8C98B" strokeWidth={.7} />)}
    {HUB_HOUSES.map(({x,z})=>{const p=minimapPoint({x,z});return <G key={x+":"+z}><Rect x={p.x-2} y={p.y-1} width={4} height={4} fill="#EDCC8E" /><Path d={`M${p.x-3} ${p.y} L${p.x} ${p.y-3} L${p.x+3} ${p.y}Z`} fill="#835D3E" /></G>;})}
    <SvgText x={50} y={10} textAnchor="middle" fontSize={5} fontWeight="bold" fill="#173E36">N</SvgText>
    <SvgText x={93} y={51} textAnchor="middle" fontSize={4} fill="#173E36">E</SvgText>
    <SvgText x={50} y={96} textAnchor="middle" fontSize={4} fill="#173E36">S</SvgText>
    <SvgText x={7} y={51} textAnchor="middle" fontSize={4} fill="#173E36">W</SvgText>
  </G>;
});

export function HubMinimap({portals,player,top}:Props) {
  const [expanded,setExpanded]=useState(false);
  const next=portals.findIndex(portal=>portal.state!=="completed"&&portal.state!=="locked");
  const finished=portals.length>0&&portals.every(portal=>portal.state==="completed");
  const target=next>=0?portals[next].position:finished?worldChestPosition(false):undefined;
  const route=useMemo(()=>target?points(minimapRoute(player,target)):undefined,[player,target]);
  const at=minimapPoint(player),chest=minimapPoint(worldChestPosition(false));
  const destination=next>=0?`${next+1} · ${regions[next]??"Portal"}`:finished?"Gantimpala":"Mga portal";
  return <View style={[styles.wrap,{top,width:expanded?222:146}]}>
    <Pressable onPress={()=>setExpanded(value=>!value)} accessibilityRole="button" accessibilityLabel={`${expanded?"Paliitin":"Palakihin"} ang mapa. Susunod: ${destination}. ${portals.map((p,i)=>`${i+1}: ${p.story.title}${p.state==="completed"?", tapos":p.state==="locked"?", nakakandado":""}`).join(". ")}`}>
      <View style={styles.heading}><Text style={styles.title}>MAPA</Text><Text style={styles.expand}>{expanded?"−":"+"}</Text></View>
      <Svg width="100%" height={expanded?206:130} viewBox="0 0 100 100" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
        <Background />
        {route&&<Polyline points={route} stroke="#FFF5AE" strokeWidth={1.5} strokeDasharray="2 1.5" fill="none" strokeLinejoin="round" />}
        <Rect x={chest.x-2} y={chest.y-1.5} width={4} height={3} rx={.5} fill={finished?"#F9D66A":"#697064"} stroke="#273C34" strokeWidth={.6} />
        {portals.map((portal,i)=>{const p=minimapPoint(portal.position),completed=portal.state==="completed",locked=portal.state==="locked";return <G key={portal.story.id}>
          {i===next&&<Circle cx={p.x} cy={p.y} r={5.7} fill="none" stroke="#FFF3B6" strokeWidth={1} />}
          <Circle cx={p.x} cy={p.y} r={4.1} fill={completed?"#246B50":locked?"#64726C":"#143F49"} stroke={completed?"#8AEBAD":"#EFD58B"} strokeWidth={1} />
          <SvgText x={p.x} y={p.y+1.7} textAnchor="middle" fontSize={5} fontWeight="bold" fill="#FFFFFF">{completed?"✓":i+1}</SvgText>
        </G>;})}
        <G transform={`translate(${at.x} ${at.y}) rotate(${minimapHeading(player.heading)})`}>
          <Path d="M0 0 L-6 -10 Q0 -13 6 -10Z" fill="#FFFFFF" opacity={.22} />
          <Path d="M0 -4 L3 3 L0 1.7 L-3 3Z" fill="#FFFFFF" stroke="#173B42" strokeWidth={.9} strokeLinejoin="round" />
        </G>
      </Svg>
      <Text numberOfLines={1} style={styles.destination}>{destination}</Text>
      {expanded&&<View style={styles.legend}>{portals.map((p,i)=><Text key={p.story.id} style={styles.legendText}>{p.state==="completed"?"✓":`${i+1}.`} {regions[i]}{p.state==="locked"?" · nakakandado":""}</Text>)}</View>}
    </Pressable>
  </View>;
}
const styles=StyleSheet.create({
  wrap:{position:"absolute",right:12,borderRadius:18,padding:7,backgroundColor:AppTheme.surface,borderWidth:1,borderColor:AppTheme.border},
  heading:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:5,height:19},
  title:{fontSize:9,fontWeight:"800",letterSpacing:1.7,color:AppTheme.primary},
  expand:{fontSize:17,lineHeight:19,color:AppTheme.primary,fontWeight:"700"},
  destination:{fontSize:10,fontWeight:"800",color:AppTheme.text,textAlign:"center",paddingTop:3,paddingBottom:2},
  legend:{padding:5,gap:3},legendText:{color:AppTheme.muted,fontSize:11},
});
