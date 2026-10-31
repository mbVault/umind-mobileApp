import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CLIENT_AVATAR_OPTIONS } from "../avatars/catalog";
import { DiceBearAvatar } from "../components/DiceBearAvatar";
import { OnboardingStepHeader } from "../components/OnboardingStepHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { useOnboardingDraft } from "../onboarding/OnboardingDraftContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";
import { pickAliasSuggestions } from "../utils/aliasSuggestions";
import { validateAlias } from "../utils/validateAlias";

type Props = NativeStackScreenProps<AuthStackParamList, "Alias">;

export function AliasScreen({ navigation }: Props) {
  const { draft, setAlias, setAvatarId } = useOnboardingDraft();
  const [suggestions, setSuggestions] = useState(() => pickAliasSuggestions());

  const aliasError = useMemo(() => validateAlias(draft.alias), [draft.alias]);
  const canContinue = !aliasError && draft.avatarId.length > 0;

  const refreshSuggestions = () => {
    setSuggestions(pickAliasSuggestions(draft.alias, true));
  };

  const onContinue = () => {
    if (!canContinue) {
      return;
    }
    setAlias(draft.alias.trim());
    navigation.navigate("RecoveryKey");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <OnboardingStepHeader step={1} totalSteps={4} onBack={() => navigation.goBack()} />

        <Text style={typeScale.h1}>What should we call you?</Text>
        <Text style={[typeScale.bodyLarge, styles.lead]}>
          Any name works. It's the only thing Saathi and your psychologist will ever see.
        </Text>

        <Text style={styles.fieldLabel}>Your U Mind name</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={draft.alias}
            onChangeText={setAlias}
            placeholder="Neela"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            maxLength={20}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Suggest new names"
            onPress={refreshSuggestions}
            style={styles.shuffle}
          >
            <Ionicons name="refresh" size={22} color={colors.primary} />
          </Pressable>
        </View>
        {aliasError ? <Text style={styles.error}>{aliasError}</Text> : null}

        <View style={styles.chips}>
          {suggestions.map((name) => {
            const selected = draft.alias.trim().toLowerCase() === name.toLowerCase();
            return (
              <Pressable
                key={name}
                onPress={() => setAlias(name)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, styles.avatarLabel]}>Pick an avatar instead of a photo</Text>
        <View style={styles.avatarRow}>
          {CLIENT_AVATAR_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel="Select avatar"
              onPress={() => setAvatarId(option.id)}
            >
              <DiceBearAvatar
                styleKey={option.style}
                seed={option.seed}
                size={52}
                selected={draft.avatarId === option.id}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="key-outline" size={18} color={colors.sunInk} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>No email. Just a recovery key.</Text>
            <Text style={styles.noticeBody}>
              Next, we'll show you 12 private words. Save them — they're the only way back into your space.
            </Text>
          </View>
        </View>

        <PrimaryButton
          label={`Continue as ${draft.alias.trim() || "…"}`}
          onPress={onContinue}
          disabled={!canContinue}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  lead: { marginBottom: spacing.sm },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.ink,
  },
  shuffle: {
    width: 52,
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.coralInk,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.ink,
  },
  chipTextSelected: {
    color: colors.surface,
  },
  avatarLabel: { marginTop: spacing.lg },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  notice: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.sunTint,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 4,
  },
  noticeBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  noticeCopy: { flex: 1 },
  cta: { marginTop: spacing.lg },
});
