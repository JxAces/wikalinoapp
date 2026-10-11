import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { AppTheme } from "@/constants/colors";
import type { UgatMemory } from "./ugat-layout";

export function UgatMemoryPrompt({memory,bottom,onPress}:{memory:UgatMemory;bottom:number;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Suriin ang gunita: ${memory.object}`} onPress={onPress} style={[styles.inspect,{bottom:bottom+38}]}>
    <MaterialCommunityIcons name="book-search-outline" size={25} color={AppTheme.buttonText} />
    <Text style={styles.inspectText}>Gunita</Text>
  </Pressable>;
}

/** Optional story context appears only when requested, leaving the map clear. */
export function UgatMemoryNote({memory,bottom,onClose}:{memory:UgatMemory|null;bottom:number;onClose:()=>void}) {
  const {height}=useWindowDimensions();
  return <Modal visible={Boolean(memory)} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable accessibilityLabel="Isara ang gunita" accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
      {memory && <View style={[styles.card,{marginBottom:bottom+16,maxHeight:height*.68}]}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>MGA GUNITA NI LOLO</Text>
          <Pressable accessibilityLabel="Isara ang gunita" accessibilityRole="button" hitSlop={10} onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={AppTheme.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title} accessibilityRole="header">{memory.title}</Text>
          <Text style={styles.detail}>{memory.detail}</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quote}>“{memory.quote}”</Text>
            <Text style={styles.speaker}>{memory.speaker} · Ugat</Text>
          </View>
          <Text style={styles.symbol}>{memory.symbol}</Text>
          <Text style={styles.source}>Batay sa “{memory.chapter}”{`\n`}Ugat · Genoveva Edroza-Matute</Text>
        </ScrollView>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.continue}><Text style={styles.continueText}>Magpatuloy sa paglalakbay</Text><MaterialCommunityIcons name="arrow-right" size={20} color={AppTheme.buttonText} /></Pressable>
      </View>}
    </View>
  </Modal>;
}

const styles=StyleSheet.create({
  inspect:{position:"absolute",right:16,width:68,minHeight:68,alignItems:"center",justifyContent:"center",gap:4,backgroundColor:AppTheme.primary,borderRadius:20,borderWidth:1,borderColor:AppTheme.border},
  inspectText:{color:AppTheme.buttonText,fontSize:11,fontWeight:"800"},
  overlay:{flex:1,backgroundColor:AppTheme.overlay,justifyContent:"flex-end",paddingHorizontal:16},
  card:{alignSelf:"center",width:"100%",maxWidth:560,borderRadius:24,backgroundColor:AppTheme.surface,borderWidth:1,borderColor:AppTheme.border,padding:20},
  heading:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},
  eyebrow:{color:AppTheme.primary,fontSize:10,letterSpacing:1.5,fontWeight:"900"},
  content:{paddingVertical:16},
  title:{color:AppTheme.text,fontSize:25,lineHeight:30,fontWeight:"900",marginBottom:12},
  detail:{color:AppTheme.muted,fontSize:15,lineHeight:23},
  quoteBox:{marginVertical:18,paddingLeft:14,borderLeftWidth:3,borderColor:AppTheme.border},
  quote:{color:AppTheme.text,fontSize:18,lineHeight:26,fontWeight:"700"},
  speaker:{color:AppTheme.muted,fontSize:11,marginTop:7},
  symbol:{color:AppTheme.muted,fontSize:13,lineHeight:21},
  source:{color:AppTheme.muted,fontSize:10,lineHeight:16,marginTop:14},
  continue:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:AppTheme.primary,borderRadius:13,padding:14},
  continueText:{color:AppTheme.buttonText,fontSize:13,fontWeight:"800"},
});
