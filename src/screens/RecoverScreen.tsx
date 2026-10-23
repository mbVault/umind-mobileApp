import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recover } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuthSession } from "../auth/AuthSessionContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { AuthStackParamList } from "../navigation/types";
import { colors, radius, spacing, typeScale } from "../theme";
import { fonts } from "../theme/typography";
import { getOrCreateDeviceId } from "../utils/deviceId";

type Props = NativeStackScreenProps<AuthStackParamList, "Recover">;

export function RecoverScreen({ navigation }: Props) {
  const { establishSession } = useAuthSession();
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);

  const onRecover = async () => {
    const words = phrase.trim().split(/\s+/).filter(Boolean);
    if (words.length !== 12) {
      Alert.alert("Recovery key", "Enter all 12 words separated by spaces.");
      return;
    }
    setLoading(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const response = await recover({ recoveryKey: words.join(" "), deviceId });
      await establishSession(response);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Could not restore your account.";
      Alert.alert("Recovery failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={typeScale.h1}>Restore with your recovery key</Text>
        <Text style={typeScale.bodyLarge}>Paste or type your 12 private words. We never ask for email or phone.</Text>
        <TextInput
          value={phrase}
          onChangeText={setPhrase}
          multiline
          placeholder="word1 word2 word3 …"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton label="Restore my space" loading={loading} onPress={onRecover} />
        <Text style={[typeScale.link, styles.backLink]} onPress={() => navigation.goBack()}>
          Back
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.flowHorizontal, gap: spacing.lg },
  input: {
    minHeight: 120,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: "top",
  },
  backLink: { textAlign: "center" },
});
