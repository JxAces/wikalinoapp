import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppTheme } from "@/constants/colors";
import { useUserStore } from "@/store/useUserStore";
import { syncNow, useSyncStatus } from "@/services/sync/runtime";
import { classRankings } from "@/services/sync/rankings";
import type { ClassRankings as Rankings } from "@/services/sync/transport";

export function ClassRankings() {
  const code = useUserStore(s => s.profile?.classCode?.trim());
  const savedAt = useSyncStatus(s => s.savedAt);
  const [data,setData] = useState<Rankings | null>(null);
  const [busy,setBusy] = useState(false);
  const [cached,setCached] = useState(false);
  const [expanded,setExpanded] = useState(false);
  const generation = useRef(0);
  const refresh = useCallback(async (sync = false) => {
    const current = ++generation.current;
    if (!code) { setData(null); return; }
    setBusy(true);
    try {
      const previous = await classRankings(code,false);
      if(current !== generation.current) return;
      setData(previous); setCached(Boolean(previous));
      if(sync) await syncNow();
      const fresh = await classRankings(code,true);
      if(current !== generation.current) return;
      setData(fresh); setCached(false);
    } catch { if(current === generation.current) setCached(true); }
    finally { if(current === generation.current) setBusy(false); }
  },[code]);
  const cancel = useCallback(() => { generation.current++; },[]);
  useEffect(() => {
    const timer = setTimeout(() => { void refresh(); },0);
    return () => { clearTimeout(timer); cancel(); };
  },[refresh,savedAt,cancel]);
  const board = data?.class?.code === code ? data : null;
  const entries = board?.entries ?? [];
  const visible = expanded ? entries : entries.slice(0,5);
  const own = entries.find(row=>row.isYou);
  return <View style={styles.card}>
    <View style={styles.heading}>
      <MaterialCommunityIcons name="trophy-outline" size={24} color={AppTheme.primary} />
      <Text accessibilityRole="header" style={styles.title}>Ranggo ng Klase</Text>
      <Pressable disabled={busy} onPress={()=>{void refresh(true);}} accessibilityRole="button" accessibilityLabel="I-refresh ang ranggo ng klase" style={styles.button}><Text style={styles.action}>{busy ? "Sandali…" : "I-refresh"}</Text></Pressable>
    </View>
    <Text style={styles.hint}>{board?.class?.name ?? "Mga kaklase na may kaparehong class code"}</Text>
    {own && <Text style={styles.own}>Ikaw: {own.rank ? `#${own.rank}` : "Wala pang ranggo"} · {own.correct}/{own.total} tama</Text>}
    {visible.map((row,index)=><View key={index} style={[styles.row,row.isYou && styles.highlight]}>
      <Text style={styles.rank}>{row.rank ? `#${row.rank}` : "—"}</Text>
      <Text style={styles.name}>{row.name}{row.isYou ? " (Ikaw)" : ""}</Text>
      <Text style={styles.score}>{row.correct}/{row.total}</Text>
    </View>)}
    {!entries.length && <Text style={styles.empty}>Lalabas ang ranggo kapag naipadala na sa guro ang mga tala ng iyong klase. Magkonekta sa internet at i-refresh.</Text>}
    {entries.length>5 && <Pressable accessibilityRole="button" onPress={()=>setExpanded(v=>!v)} style={styles.button}><Text style={styles.action}>{expanded ? "Paliitin" : `Lahat ng ${entries.length} mag-aaral`}</Text></Pressable>}
    {board && <Text style={styles.hint}>{cached ? "Huling naka-save na ranggo" : "Huling update"}: {new Date(board.updatedAt).toLocaleString()}</Text>}
    <Text style={styles.hint}>Batay sa kabuuang tamang sagot sa 3 pagsusulit. Magkaparehong iskor, magkaparehong ranggo. Hindi kasama ang nakasulat na gawain.</Text>
  </View>;
}
const styles=StyleSheet.create({
  card:{backgroundColor:AppTheme.surfaceSoft,borderWidth:1,borderColor:AppTheme.border,borderRadius:18,padding:15,marginBottom:20},
  heading:{flexDirection:"row",alignItems:"center",gap:9}, title:{flex:1,fontSize:16,fontWeight:"800",color:AppTheme.text},
  button:{minHeight:44,justifyContent:"center",paddingHorizontal:8}, action:{fontSize:12,fontWeight:"800",color:AppTheme.primary},
  hint:{fontSize:11,lineHeight:18,color:AppTheme.muted,marginTop:7}, own:{fontSize:14,lineHeight:22,fontWeight:"800",color:AppTheme.primary,marginVertical:12},
  row:{flexDirection:"row",alignItems:"center",gap:10,padding:10,borderBottomWidth:1,borderColor:AppTheme.border}, highlight:{backgroundColor:AppTheme.selected,borderRadius:9},
  rank:{width:34,fontSize:13,fontWeight:"800",color:AppTheme.primary},name:{flex:1,fontSize:13,color:AppTheme.text},score:{fontSize:13,fontWeight:"800",color:AppTheme.text},
  empty:{fontSize:12,lineHeight:20,color:AppTheme.muted,paddingVertical:16},
});
