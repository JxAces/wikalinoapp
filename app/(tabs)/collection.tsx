import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused } from "expo-router";
import { useState } from "react";
import { Image, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StoryBookReader } from "../../components/story-library/StoryBookReader";
import { Colors } from "../../constants/colors";
import { getAllStories, type Story } from "../../data/stories";

const books = getAllStories();
const coverColors = ["#315D47", "#344D64", "#79543B", "#52663A", "#67506A", "#376669"];

export default function CollectionScreen() {
  const focused = useIsFocused();
  const [openedBook, setOpenedBook] = useState<Story | null>(null);
  const [query, setQuery] = useState("");
  const matchingBooks = books.filter(book => `${book.title} ${book.subtitle}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  return <LinearGradient colors={["#A9D8C4", "#EAF4EC", "#EAF4EC"]} style={styles.screen}>
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Bumalik sa mapa" onPress={() => router.replace("/landing")} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={23} color={Colors.primaryDark} />
          </Pressable>
          <View style={styles.flex}><Text style={styles.eyebrow}>KOLEKSYON NG MGA KUWENTO</Text><Text style={styles.title}>Ang Aking Aklatan</Text></View>
          <MaterialCommunityIcons name="bookshelf" size={29} color={Colors.secondary} />
        </View>
        <View style={styles.welcome}>
          <View style={styles.welcomeIcon}><MaterialCommunityIcons name="book-open-page-variant" size={31} color={Colors.accent} /></View>
          <View style={styles.flex}>
            <Text style={styles.welcomeTitle}>Bawat aklat, isang paglalakbay.</Text>
            <Text style={styles.welcomeCopy}>Pumili ng aklat, buksan ang mga pahina, at balikan ang buong kuwento.</Text>
          </View>
        </View>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={23} color={Colors.secondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Maghanap ng kuwento" accessibilityLabel="Maghanap ng kuwento"
            placeholderTextColor={Colors.textMuted} style={styles.searchInput} autoCorrect={false} returnKeyType="search" />
          {!!query && <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Alisin ang paghahanap" style={styles.clear}>
            <MaterialCommunityIcons name="close-circle" size={20} color={Colors.textMuted} />
          </Pressable>}
        </View>
        <View style={styles.shelfHeading}><Text style={styles.sectionTitle}>Mga Aklat</Text><Text style={styles.count}>{matchingBooks.length} AKLAT · LAHAT BUKAS</Text></View>
        {matchingBooks.length ? <View style={styles.grid}>
          {matchingBooks.map(book => {
            const color = coverColors[books.indexOf(book) % coverColors.length];
            return <View key={book.id} style={styles.bookSlot}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Basahin ang ${book.title}`} onPress={() => { Keyboard.dismiss(); setOpenedBook(book); }}
                style={({ pressed }) => [styles.book, { backgroundColor: color }, pressed && styles.bookPressed]}>
                <View pointerEvents="none" style={styles.bookSpine} />
                <View style={styles.bookInner}>
                  <Text style={styles.bookNumber}>AKLAT {String(book.order).padStart(2, "0")}</Text>
                  <Image source={book.coverImage} style={styles.bookImage} resizeMode="cover" />
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <View style={styles.bookRule} />
                  <Text style={styles.bookSubtitle}>{book.subtitle}</Text>
                  <View style={styles.bookBottom}><MaterialCommunityIcons name="book-open-outline" color={Colors.accent} size={15} /><Text style={styles.bookOpen}>BUKSAN</Text></View>
                </View>
              </Pressable>
              <View style={styles.paperEdges} />
              <View style={styles.shelf} />
              <Text style={styles.bookMeta}>{book.scenes.length} bahagi · {book.estimatedMinutes} minuto</Text>
            </View>;
          })}
        </View> : <View style={styles.empty}>
          <MaterialCommunityIcons name="book-search-outline" size={42} color={Colors.secondary} />
          <Text style={styles.emptyTitle}>Walang nahanap na aklat</Text>
          <Text style={styles.emptyCopy}>Subukan ang ibang pamagat.</Text>
        </View>}
        <View style={styles.note}><MaterialCommunityIcons name="leaf" size={19} color={Colors.secondary} /><Text style={styles.noteText}>Bukas ang lahat ng kuwento para sa pagbabasa at pagbabalik-aral.</Text></View>
      </ScrollView>
      <Modal visible={openedBook !== null && focused} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setOpenedBook(null)}>
        {openedBook && focused && <StoryBookReader key={openedBook.id} story={openedBook} onClose={() => setOpenedBook(null)} />}
      </Modal>
    </SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 22, maxWidth: 700, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: 43, height: 46, borderRadius: 14, backgroundColor: "#CCE7D7", alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2, color: Colors.secondary },
  title: { fontSize: 23, fontWeight: "900", color: Colors.primaryDark, marginTop: 5 },
  welcome: { backgroundColor: Colors.secondary, borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", gap: 13 },
  welcomeIcon: { width: 54, height: 60, borderRadius: 17, backgroundColor: "#254E39", alignItems: "center", justifyContent: "center" },
  welcomeTitle: { fontSize: 16, fontWeight: "900", color: Colors.accentSoft, lineHeight: 22 },
  welcomeCopy: { color: "#D5E7CF", fontSize: 12, lineHeight: 19, marginTop: 7 },
  search: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 15, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, minHeight: 52, fontSize: 14, color: Colors.text },
  clear: { paddingVertical: 14, paddingLeft: 6 },
  shelfHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: Colors.primaryDark },
  count: { fontSize: 9, fontWeight: "800", color: Colors.secondary, letterSpacing: 0.6 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 24 },
  bookSlot: { width: "47%" },
  book: { borderRadius: 5, borderTopRightRadius: 15, borderBottomRightRadius: 12, borderWidth: 1, borderColor: "rgba(34,50,36,0.3)", minHeight: 282, overflow: "hidden" },
  bookPressed: { opacity: 0.8, transform: [{ translateY: -4 }] },
  bookSpine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 9, backgroundColor: "rgba(0,0,0,0.22)", borderRightWidth: 1, borderColor: "rgba(255,235,182,0.2)" },
  bookInner: { flex: 1, paddingLeft: 18, paddingRight: 11, paddingVertical: 14, alignItems: "center" },
  bookNumber: { color: "#DDCC9D", fontSize: 8, letterSpacing: 1.7, fontWeight: "800", marginBottom: 12 },
  bookImage: { width: "100%", height: 88, borderRadius: 35, borderWidth: 1, borderColor: "#D2BA7C", marginBottom: 12 },
  bookTitle: { color: "#FFF0BF", textAlign: "center", fontSize: 17, fontWeight: "900", lineHeight: 22 },
  bookRule: { width: 30, height: 1, backgroundColor: "#BAA478", marginVertical: 9 },
  bookSubtitle: { color: "#E3E2C9", textAlign: "center", fontSize: 9, lineHeight: 14 },
  bookBottom: { marginTop: "auto", paddingTop: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  bookOpen: { color: Colors.accent, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  paperEdges: { height: 5, marginLeft: 4, marginRight: 2, backgroundColor: "#E1D5B0", borderBottomWidth: 2, borderBottomColor: "#BCAE88", borderBottomRightRadius: 5 },
  shelf: { height: 9, backgroundColor: "#AF8D5D", borderBottomWidth: 3, borderBottomColor: "#886D45", borderRadius: 2, marginTop: 3 },
  bookMeta: { marginTop: 9, textAlign: "center", fontSize: 10, color: Colors.textMuted, fontWeight: "600" },
  note: { flexDirection: "row", gap: 9, paddingVertical: 6, alignItems: "center" },
  noteText: { flex: 1, color: Colors.secondary, fontSize: 12, lineHeight: 19 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: Colors.primaryDark },
  emptyCopy: { fontSize: 13, color: Colors.textMuted },
});
