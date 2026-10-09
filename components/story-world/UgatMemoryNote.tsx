import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { UgatMemory } from "./ugat-layout";

export function UgatMemoryPrompt({memory,bottom,onPress}:{memory:UgatMemory;bottom:number;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Suriin ang gunita: ${memory.object}`} onPress={onPress} style={[styles.inspect,{bottom:bottom+38}]}>
    <MaterialCommunityIcons name="book-search-outline" size={25} color="#F2DEAA" />
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
          <Pressable accessibilityLabel="Isara ang gunita" accessibilityRole="button" hitSlop={10} onPress={onClose}><MaterialCommunityIcons name="close" size={24} color="#284638" /></Pressable>
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
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.continue}><Text style={styles.continueText}>Magpatuloy sa paglalakbay</Text><MaterialCommunityIcons name="arrow-right" size={20} color="#FFF7DF" /></Pressable>
      </View>}
    </View>
  </Modal>;
}

const styles=StyleSheet.create({
  inspect:{position:"absolute",right:16,width:68,minHeight:68,alignItems:"center",justifyContent:"center",gap:4,backgroundColor:"#294D40",borderRadius:20,borderWidth:1,borderColor:"#CFCE98"},
  inspectText:{color:"#FFF5D6",fontSize:11,fontWeight:"800"},
  overlay:{flex:1,backgroundColor:"rgba(16,31,24,.38)",justifyContent:"flex-end",paddingHorizontal:16},
  card:{alignSelf:"center",width:"100%",maxWidth:560,borderRadius:24,backgroundColor:"#F7F1DF",borderWidth:1,borderColor:"#CAB88A",padding:20},
  heading:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},
  eyebrow:{color:"#67774A",fontSize:10,letterSpacing:1.5,fontWeight:"900"},
  content:{paddingVertical:16},
  title:{color:"#244435",fontSize:25,lineHeight:30,fontWeight:"900",marginBottom:12},
  detail:{color:"#425247",fontSize:15,lineHeight:23},
  quoteBox:{marginVertical:18,paddingLeft:14,borderLeftWidth:3,borderColor:"#B59A56"},
  quote:{color:"#294C3D",fontSize:18,lineHeight:26,fontWeight:"700"},
  speaker:{color:"#6F765D",fontSize:11,marginTop:7},
  symbol:{color:"#5A6553",fontSize:13,lineHeight:21},
  source:{color:"#777B65",fontSize:10,lineHeight:16,marginTop:14},
  continue:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:"#315A45",borderRadius:13,padding:14},
  continueText:{color:"#FFF7DF",fontSize:13,fontWeight:"800"},
});
