import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { AppTheme } from "@/constants/colors";
import { WELCOME_PAGES } from "./welcome-guide";

export function WelcomeDialogue({speaking,bottom,onFinish}:{speaking:boolean;bottom:number;onFinish:()=>void}) {
  const [page,setPage]=useState(0);
  const {height}=useWindowDimensions();
  return <View style={styles.overlay} accessibilityViewIsModal>
    <View style={[styles.card,{bottom:bottom+18,maxHeight:height*.44}]}>
      <View style={styles.row}><Text style={styles.speaker}>KAIBIGAN SA NAYON</Text><Pressable accessibilityRole="button" onPress={onFinish} hitSlop={12}><Text style={styles.skip}>Laktawan</Text></Pressable></View>
      <ScrollView key={page} style={styles.copy} contentContainerStyle={styles.copyContent}>
        <Text accessibilityLiveRegion="polite" style={styles.message}>{speaking?WELCOME_PAGES[page]:"May lumalapit na kaibigan…"}</Text>
      </ScrollView>
      {speaking&&<View style={styles.row}>
        <Text style={styles.count}>{page+1} / {WELCOME_PAGES.length}</Text>
        <View style={styles.actions}>
          {page>0&&<Pressable accessibilityRole="button" onPress={()=>setPage(p=>p-1)} style={styles.back}><Text style={styles.backText}>Bumalik</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={()=>page===WELCOME_PAGES.length-1?onFinish():setPage(p=>p+1)} style={styles.next}><Text style={styles.nextText}>{page===WELCOME_PAGES.length-1?"Tara na!":"Susunod"}</Text></Pressable>
        </View>
      </View>}
    </View>
  </View>;
}
const styles=StyleSheet.create({
  overlay:{...StyleSheet.absoluteFill,justifyContent:"flex-end"},
  card:{position:"absolute",left:16,right:16,alignSelf:"center",maxWidth:640,backgroundColor:AppTheme.surface,borderWidth:1.5,borderColor:AppTheme.border,borderRadius:22,padding:20,shadowColor:AppTheme.dark,shadowOpacity:.22,shadowRadius:12,shadowOffset:{width:0,height:5}},
  row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8},
  speaker:{fontSize:10,fontWeight:"900",letterSpacing:1.5,color:AppTheme.primary},skip:{fontSize:12,color:AppTheme.muted,paddingVertical:6},
  copy:{flexShrink:1},copyContent:{paddingVertical:16},message:{color:AppTheme.text,fontSize:17,lineHeight:26,fontWeight:"500"},
  count:{fontSize:12,color:AppTheme.muted},actions:{flexDirection:"row",alignItems:"center",gap:12},
  next:{backgroundColor:AppTheme.primary,paddingVertical:13,paddingHorizontal:20,borderRadius:13},nextText:{fontSize:15,fontWeight:"800",color:AppTheme.buttonText},
  back:{paddingVertical:13},backText:{fontSize:13,color:AppTheme.primary},
});
