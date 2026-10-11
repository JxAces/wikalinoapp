import { useRouter } from "expo-router";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";

import { Colors } from "../../constants/colors";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/landing")}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <WikalinoBrand />
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Tungkol sa WIKALINO</Text>

            <Text style={styles.text}>
              Ang Wikalino ay isang edukasyonal na laro na binuo ng mga mananaliksik na sina Dela Cruz, Sarah Jane, Florida, Danica Thessa at Rosal, Abigail . Isang aplikasyong pangmobile na idinisenyo para sa pag-aaral ng Panitikan sa Baitang 9. Maaari itong gamitin online at offline ito ay naglalaman ng iba’t ibang kuwento, paksa, gawain, at hamon na matatagpuan sa bawat termino. Layunin nitong gawing higit na interaktibo, makabuluhan, at kawili-wili ang pagkatuto sa asignaturang Filipino sa pamamagitan ng pagsasanib ng mga elementong pang-edukasyon at paglalaro. Binubuo ang Wikalino ng tatlong kuwentong pampanitikan, ang mga kuwentong ito ay nakaayos sa magkakasunod na antas ng pagkatuto na makikita sa Ikalawang Termino. Hindi maaaring magpatuloy ang mag-aaral sa ikalawang kuwento hangga’t hindi niya natatapos ang unang kuwento na “Sandaang Damit.” Unti-unting nabubuksan ang mga susunod na kuwento at gawain habang natatapos ng mag-aaral ang mga kinakailangang aktibidad at hamon sa naunang antas. Sa pamamagitan ng Wikalino, maaaring matuto ang mga mag-aaral kahit may koneksiyon sa internet o wala, na nagbibigay ng mas nababagay at madaling mapapasukan paraan ng pag-aaral.

            </Text>

            <Text style={styles.footer}>© 2026 WIKALINO</Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: "900",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    color: Colors.primary,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 10,
    color: Colors.text,
  },
  footer: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
  },
});
