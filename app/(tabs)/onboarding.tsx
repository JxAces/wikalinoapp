import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import CircleUserRound from "lucide-react-native/icons/circle-user-round";
import UserRoundCheck from "lucide-react-native/icons/user-round-check";
import UserRoundCog from "lucide-react-native/icons/user-round-cog";
import UserRoundPen from "lucide-react-native/icons/user-round-pen";
import UserRoundSearch from "lucide-react-native/icons/user-round-search";
import UserStar from "lucide-react-native/icons/user-star";
import {
  ComponentProps,
  useMemo,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import {
  PANGKAT_OPTIONS,
  PangkatOption,
} from "../../data/pangkat";
import { useUserStore } from "../../store/useUserStore";

type IconName =
  ComponentProps<typeof MaterialCommunityIcons>["name"];

type PlayerIcon = {
  id: string;
  icon: LucideIcon;
  title: string;
};

const PLAYER_ICONS: PlayerIcon[] = [
  {
    id: "reader",
    icon: CircleUserRound,
    title: "Mambabasa",
  },
  {
    id: "writer",
    icon: UserRoundPen,
    title: "Manunulat",
  },
  {
    id: "explorer",
    icon: UserRoundSearch,
    title: "Manlalakbay",
  },
  {
    id: "thinker",
    icon: UserRoundCog,
    title: "Mapanuri",
  },
  {
    id: "storyteller",
    icon: UserRoundCheck,
    title: "Tagapagkwento",
  },
  {
    id: "scholar",
    icon: UserStar,
    title: "Iskolar",
  },
];

export default function OnboardingScreen() {
  const setProfile = useUserStore(
    (state) => state.setProfile,
  );

  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState("");
  const [pangkat, setPangkat] =
    useState<PangkatOption | null>(null);

  const [selectedIconId, setSelectedIconId] =
    useState("reader");

  const selectedIcon =
    PLAYER_ICONS.find(
      (item) => item.id === selectedIconId,
    ) ?? PLAYER_ICONS[0];

  const canContinueProfile = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      pangkat !== null
    );
  }, [fullName, pangkat]);

  const firstName = useMemo(() => {
    const value = fullName.trim();

    if (!value) {
      return "Mambabasa";
    }

    return value.split(" ")[0];
  }, [fullName]);

  const handleNext = () => {
    if (step === 0 && !canContinueProfile) {
      return;
    }

    if (step < 2) {
      setStep((current) => current + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((current) => current - 1);
    }
  };

  const handleStart = () => {
    if (!pangkat) {
      return;
    }

    setProfile({
      fullName: fullName.trim(),
      pangkat,
      avatar: selectedIconId,
    });

    router.replace("/landing");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>
                WIKALINO
              </Text>

              <Text style={styles.headerSubtitle}>
                Simulan ang Iyong Kwento
              </Text>
            </View>

            <View style={styles.stepCounter}>
              <Text style={styles.stepCounterText}>
                {step + 1}/3
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            {[0, 1, 2].map((item) => (
              <View
                key={item}
                style={[
                  styles.progressItem,
                  item <= step &&
                    styles.progressItemActive,
                ]}
              />
            ))}
          </View>

          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 0 && (
              <ProfileStep
                fullName={fullName}
                pangkat={pangkat}
                setFullName={setFullName}
                setPangkat={setPangkat}
              />
            )}

            {step === 1 && (
              <IconStep
                selectedIconId={selectedIconId}
                setSelectedIconId={
                  setSelectedIconId
                }
                selectedIcon={selectedIcon}
                firstName={firstName}
                pangkat={pangkat}
              />
            )}

            {step === 2 && (
              <ReadyStep
                firstName={firstName}
                pangkat={pangkat}
                selectedIcon={selectedIcon}
              />
            )}
          </ScrollView>

          <View style={styles.navigation}>
            {step > 0 && (
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={20}
                  color={Colors.primary}
                />

                <Text style={styles.backButtonText}>
                  Bumalik
                </Text>
              </Pressable>
            )}

            {step < 2 ? (
              <Pressable
                onPress={handleNext}
                disabled={
                  step === 0 &&
                  !canContinueProfile
                }
                style={({ pressed }) => [
                  styles.nextButton,

                  step === 0 &&
                    !canContinueProfile &&
                    styles.nextButtonDisabled,

                  pressed &&
                    !(
                      step === 0 &&
                      !canContinueProfile
                    ) &&
                    styles.nextButtonPressed,
                ]}
              >
                <Text
                  style={styles.nextButtonText}
                >
                  Susunod
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={Colors.surface}
                />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleStart}
                style={({ pressed }) => [
                  styles.startButton,
                  pressed &&
                    styles.nextButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={21}
                  color={Colors.surface}
                />

                <Text
                  style={styles.nextButtonText}
                >
                  Simulan ang Kwento
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileStep({
  fullName,
  pangkat,
  setFullName,
  setPangkat,
}: {
  fullName: string;
  pangkat: PangkatOption | null;
  setFullName: (value: string) => void;
  setPangkat: (
    value: PangkatOption,
  ) => void;
}) {
  const [
    pangkatDropdownOpen,
    setPangkatDropdownOpen,
  ] = useState(false);

  return (
    <>
      <View style={styles.introIcon}>
        <MaterialCommunityIcons
          name="account-edit-outline"
          size={36}
          color={Colors.primary}
        />
      </View>

      <Text style={styles.stepEyebrow}>
        UNANG MISYON
      </Text>

      <Text style={styles.stepTitle}>
        Buuin ang Iyong Profile
      </Text>

      <Text style={styles.stepDescription}>
        Dito magsisimula ang iyong paglalakbay
        sa mundo ng Maikling Kwento.
      </Text>

      <View style={styles.formCard}>
        <View style={styles.field}>
          <Text style={styles.label}>
            BUONG PANGALAN
          </Text>

          <View style={styles.inputWrap}>
            <MaterialCommunityIcons
              name="account-outline"
              size={21}
              color={Colors.textMuted}
            />

            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Hal. Juan Dela Cruz"
              placeholderTextColor={
                Colors.textMuted
              }
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text
            style={styles.labelSecondary}
          >
            PANGKAT
          </Text>

          <Pressable
            onPress={() =>
              setPangkatDropdownOpen(true)
            }
            style={({ pressed }) => [
              styles.dropdownButton,
              pangkat &&
                styles.dropdownButtonSelected,
              pressed &&
                styles.dropdownButtonPressed,
            ]}
          >
            <View style={styles.dropdownLeft}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={21}
                color={
                  pangkat
                    ? Colors.primary
                    : Colors.textMuted
                }
              />

              <Text
                style={[
                  styles.dropdownValue,

                  !pangkat &&
                    styles.dropdownPlaceholder,
                ]}
              >
                {pangkat ??
                  "Pumili ng pangkat"}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-down"
              size={23}
              color={Colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.tipCard}>
        <MaterialCommunityIcons
          name="shield-lock-outline"
          size={20}
          color={Colors.teal}
        />

        <Text style={styles.tipText}>
          Walang account o internet na
          kailangan. Naka-save lamang sa
          device na ito ang iyong
          impormasyon at progreso.
        </Text>
      </View>

      <Modal
        visible={pangkatDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPangkatDropdownOpen(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setPangkatDropdownOpen(false)
          }
        >
          <Pressable
            style={styles.dropdownModal}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View
              style={
                styles.dropdownModalHandle
              }
            />

            <View
              style={
                styles.dropdownModalHeader
              }
            >
              <View style={styles.modalTitleWrap}>
                <Text
                  style={
                    styles.dropdownModalEyebrow
                  }
                >
                  UNANG MISYON
                </Text>

                <Text
                  style={
                    styles.dropdownModalTitle
                  }
                >
                  Piliin ang Iyong Pangkat
                </Text>

                <Text
                  style={
                    styles.dropdownModalSubtitle
                  }
                >
                  Piliin ang pangkat na
                  kinabibilangan mo.
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setPangkatDropdownOpen(
                    false,
                  )
                }
                style={styles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={21}
                  color={Colors.text}
                />
              </Pressable>
            </View>

            <View
              style={styles.pangkatList}
            >
              {PANGKAT_OPTIONS.map(
                (item) => {
                  const selected =
                    pangkat === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setPangkat(item);

                        setPangkatDropdownOpen(
                          false,
                        );
                      }}
                      style={({ pressed }) => [
                        styles.pangkatOption,

                        selected &&
                          styles.pangkatOptionSelected,

                        pressed &&
                          styles.pangkatOptionPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.pangkatOptionIcon,

                          selected &&
                            styles.pangkatOptionIconSelected,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="account-group-outline"
                          size={22}
                          color={
                            selected
                              ? Colors.surface
                              : Colors.primary
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.pangkatOptionInfo
                        }
                      >
                        <Text
                          style={[
                            styles.pangkatOptionText,

                            selected &&
                              styles.pangkatOptionTextSelected,
                          ]}
                        >
                          {item}
                        </Text>

                        <Text
                          style={
                            styles.pangkatOptionSubtext
                          }
                        >
                          Baitang 9
                        </Text>
                      </View>

                      {selected ? (
                        <View
                          style={
                            styles.selectedPangkatCheck
                          }
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={14}
                            color={
                              Colors.surface
                            }
                          />
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={
                            Colors.textMuted
                          }
                        />
                      )}
                    </Pressable>
                  );
                },
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function IconStep({
  selectedIconId,
  setSelectedIconId,
  selectedIcon,
  firstName,
  pangkat,
}: {
  selectedIconId: string;
  setSelectedIconId: (
    id: string,
  ) => void;
  selectedIcon: PlayerIcon;
  firstName: string;
  pangkat: PangkatOption | null;
}) {
  const SelectedIcon = selectedIcon.icon;

  return (
    <>
      <View style={styles.introIcon}>
        <MaterialCommunityIcons
          name="shield-star-outline"
          size={37}
          color={Colors.primary}
        />
      </View>

      <Text style={styles.stepEyebrow}>
        IKALAWANG MISYON
      </Text>

      <Text style={styles.stepTitle}>
        Piliin ang Iyong Sagisag
      </Text>

      <Text style={styles.stepDescription}>
        Piliin ang icon na kakatawan sa iyo
        habang tinatahak mo ang mga kwento
        at hamon sa Wikalino.
      </Text>

      <View style={styles.iconGrid}>
        {PLAYER_ICONS.map((item) => {
          const active =
            item.id === selectedIconId;
          const AvatarIcon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={() =>
                setSelectedIconId(item.id)
              }
              style={[
                styles.iconOption,

                active &&
                  styles.iconOptionActive,
              ]}
            >
              <View
                style={[
                  styles.iconOptionCircle,

                  active &&
                    styles.iconOptionCircleActive,
                ]}
              >
                <AvatarIcon
                  size={28}
                  color={
                    active
                      ? Colors.surface
                      : Colors.primary
                  }
                  strokeWidth={2.25}
                />
              </View>

              <Text
                style={[
                  styles.iconOptionText,

                  active &&
                    styles.iconOptionTextActive,
                ]}
              >
                {item.title}
              </Text>

              {active && (
                <View
                  style={
                    styles.selectedCheck
                  }
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={12}
                    color={Colors.surface}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.playerCard}>
        <View style={styles.playerIcon}>
          <SelectedIcon
            size={34}
            color={Colors.surface}
            strokeWidth={2.25}
          />
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {firstName}
          </Text>

          <Text
            style={styles.playerPangkat}
          >
            {pangkat}
          </Text>

          <View
            style={styles.playerBadges}
          >
            <View style={styles.levelBadge}>
              <MaterialCommunityIcons
                name="star"
                size={12}
                color={Colors.text}
              />

              <Text
                style={
                  styles.levelBadgeText
                }
              >
                Bagong Mambabasa
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

function ReadyStep({
  firstName,
  pangkat,
  selectedIcon,
}: {
  firstName: string;
  pangkat: PangkatOption | null;
  selectedIcon: PlayerIcon;
}) {
  const SelectedIcon = selectedIcon.icon;

  return (
    <>
      <View style={styles.readyHero}>
        <View
          style={styles.readyIconOuter}
        >
          <SelectedIcon
            size={45}
            color={Colors.surface}
            strokeWidth={2.25}
          />
        </View>

        <View style={styles.readyStar}>
          <MaterialCommunityIcons
            name="star"
            size={17}
            color={Colors.text}
          />
        </View>
      </View>

      <Text style={styles.stepEyebrow}>
        HANDA KA NA
      </Text>

      <Text style={styles.stepTitle}>
        Simulan Natin, {firstName}!
      </Text>

      <Text style={styles.stepDescription}>
        Hindi lang basta pagbabasa ang
        Wikalino. Bawat Maikling Kwento ay
        may mga hamon na susubok sa iyong
        pag-unawa.
      </Text>

      <View style={styles.summaryCard}>
        <View
          style={styles.summaryHeader}
        >
          <View
            style={styles.summaryUserIcon}
          >
            <SelectedIcon
              size={27}
              color={Colors.surface}
              strokeWidth={2.25}
            />
          </View>

          <View>
            <Text
              style={styles.summaryName}
            >
              {firstName}
            </Text>

            <Text
              style={
                styles.summaryPangkat
              }
            >
              {pangkat} • Bagong Mambabasa
            </Text>
          </View>
        </View>

        <View
          style={styles.summaryDivider}
        />

        <GameFeature
          icon="book-open-page-variant"
          color={Colors.primary}
          background={
            Colors.primarySoft
          }
          title="Basahin ang Kwento"
          description="Kilalanin ang mga tauhan, tagpuan, pangyayari at aral."
        />

        <GameFeature
          icon="lightbulb-outline"
          color={Colors.secondary}
          background={
            Colors.secondarySoft
          }
          title="Sagutan ang mga Hamon"
          description="Subukan kung gaano mo naunawaan ang bawat kwento."
        />

        <GameFeature
          icon="trophy-outline"
          color={Colors.teal}
          background={Colors.tealSoft}
          title="I-unlock ang Susunod"
          description="Tapusin ang mga hamon para makausad sa susunod na bahagi."
        />
      </View>

      <View style={styles.questCard}>
        <View style={styles.questIcon}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={23}
            color={Colors.primary}
          />
        </View>

        <View style={styles.questInfo}>
          <Text
            style={styles.questLabel}
          >
            UNANG HAMON
          </Text>

          <Text
            style={styles.questTitle}
          >
            Tuklasin ang unang Maikling
            Kwento
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={23}
          color={Colors.primary}
        />
      </View>
    </>
  );
}

function GameFeature({
  icon,
  color,
  background,
  title,
  description,
}: {
  icon: IconName;
  color: string;
  background: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={color}
        />
      </View>

      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text
          style={styles.featureDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 15,
  },

  brand: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: Colors.primary,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },

  stepCounter: {
    minWidth: 49,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  stepCounterText: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.primary,
  },

  progressRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 22,
    marginTop: 18,
  },

  progressItem: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2DED7",
  },

  progressItemActive: {
    backgroundColor: Colors.secondary,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 25,
  },

  introIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  stepEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
    color: Colors.secondary,
    marginBottom: 7,
  },

  stepTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: Colors.text,
  },

  stepDescription: {
    marginTop: 10,
    maxWidth: 345,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    color: Colors.textMuted,
  },

  formCard: {
    marginTop: 27,
    padding: 18,
    gap: 19,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  field: {
    gap: 8,
  },

  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    color: Colors.primary,
  },

  labelSecondary: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    color: Colors.secondary,
  },

  inputWrap: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 15,
    backgroundColor: Colors.background,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  dropdownButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 15,
    backgroundColor: Colors.background,
  },

  dropdownButtonSelected: {
    borderColor: Colors.primary,
  },

  dropdownButtonPressed: {
    backgroundColor: Colors.primarySoft,
  },

  dropdownLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dropdownValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  dropdownPlaceholder: {
    fontWeight: "600",
    color: Colors.textMuted,
  },

  tipCard: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 15,
    backgroundColor: Colors.tealSoft,
  },

  tipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    color: Colors.textMuted,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(36,36,58,0.55)",
  },

  dropdownModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },

  dropdownModalHandle: {
    width: 42,
    height: 5,
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "#D4CEC5",
    marginBottom: 18,
  },

  dropdownModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  modalTitleWrap: {
    flex: 1,
    paddingRight: 14,
  },

  dropdownModalEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: Colors.secondary,
    marginBottom: 5,
  },

  dropdownModalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: Colors.text,
  },

  dropdownModalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textMuted,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  pangkatList: {
    gap: 9,
  },

  pangkatOption: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  pangkatOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor:
      Colors.primarySoft,
  },

  pangkatOptionPressed: {
    opacity: 0.85,
  },

  pangkatOptionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      Colors.primarySoft,
    marginRight: 12,
  },

  pangkatOptionIconSelected: {
    backgroundColor: Colors.primary,
  },

  pangkatOptionInfo: {
    flex: 1,
  },

  pangkatOptionText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
  },

  pangkatOptionTextSelected: {
    color: Colors.primary,
  },

  pangkatOptionSubtext: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
  },

  selectedPangkatCheck: {
    width: 27,
    height: 27,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.teal,
  },

  iconGrid: {
    marginTop: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  iconOption: {
    position: "relative",
    width: "31%",
    minHeight: 112,
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  iconOptionActive: {
    borderColor: Colors.primary,
    backgroundColor:
      Colors.primarySoft,
  },

  iconOptionCircle: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor:
      Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  iconOptionCircleActive: {
    backgroundColor: Colors.primary,
  },

  iconOptionText: {
    marginTop: 9,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
  },

  iconOptionTextActive: {
    color: Colors.primary,
  },

  selectedCheck: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 19,
    height: 19,
    borderRadius: 999,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },

  playerCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },

  playerIcon: {
    width: 59,
    height: 59,
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  playerInfo: {
    flex: 1,
  },

  playerName: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.surface,
  },

  playerPangkat: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color:
      "rgba(255,255,255,0.65)",
  },

  playerBadges: {
    marginTop: 8,
    flexDirection: "row",
    gap: 6,
  },

  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },

  levelBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.text,
  },

  readyHero: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 25,
  },

  readyIconOuter: {
    width: 105,
    height: 105,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        rotate: "3deg",
      },
    ],
  },

  readyStar: {
    position: "absolute",
    right: -9,
    top: -10,
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    marginTop: 25,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryUserIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  summaryName: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.text,
  },

  summaryPangkat: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 17,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  featureIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  featureInfo: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.text,
  },

  featureDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color: Colors.textMuted,
  },

  questCard: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1DFAE",
    backgroundColor:
      Colors.accentSoft,
  },

  questIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  questInfo: {
    flex: 1,
  },

  questLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    color: Colors.secondary,
  },

  questTitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
    color: Colors.text,
  },

  navigation: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  backButton: {
    minHeight: 56,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    backgroundColor:
      Colors.primarySoft,
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primary,
  },

  nextButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },

  startButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor:
      Colors.secondary,
  },

  nextButtonDisabled: {
    backgroundColor: "#D2CEC8",
  },

  nextButtonPressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],
    opacity: 0.92,
  },

  nextButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.surface,
  },
});
