import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchPsychologistDocuments,
  PsychologistDocumentDto,
  PsychologistDocumentKind,
  REQUIRED_DOCUMENT_KINDS,
  submitPsychologistApplication,
} from "../api/psychologistApi";
import {
  pickPsychologistDocumentFile,
  replacePsychologistDocument,
  uploadPsychologistDocument,
} from "../api/documentUpload";
import { StaffApiError } from "../api/staffClient";
import { usePsychologistAuth } from "../auth/PsychologistAuthContext";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { PsychPrimaryButton } from "../components/PsychPrimaryButton";
import { PsychologistStackParamList } from "../navigation/types";
import { fonts, psychColors, radius, spacing, typeScale } from "../theme";

type Props = NativeStackScreenProps<PsychologistStackParamList, "PsychologistDocumentsPlaceholder">;

const KIND_LABEL: Record<PsychologistDocumentKind, string> = {
  ID_FRONT: "ID — front",
  ID_BACK: "ID — back",
  LIVE_SELFIE: "Live selfie",
  PASSPORT_PHOTO: "Passport photo",
  DEGREE_CERTIFICATE: "Degree certificate",
  RCI_CERTIFICATE: "RCI certificate",
  EXPERIENCE_LETTER: "Experience letter",
};

function activeDocForKind(
  docs: PsychologistDocumentDto[],
  kind: PsychologistDocumentKind
): PsychologistDocumentDto | null {
  const matches = docs
    .filter((d) => d.kind === kind && d.status !== "REPLACED" && d.status !== "PENDING_UPLOAD")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matches[0] ?? null;
}

function statusLabel(doc: PsychologistDocumentDto | null): { text: string; tone: "ok" | "warn" | "muted" } {
  if (!doc) return { text: "Not uploaded", tone: "muted" };
  if (doc.status === "REJECTED_NEED_REUPLOAD") return { text: "Replace required", tone: "warn" };
  if (doc.status === "UPLOADED") return { text: "Uploaded", tone: "ok" };
  return { text: doc.status, tone: "muted" };
}

/**
 * F2 — real document list / upload / replace. No public URLs; binary goes to signed PUT.
 */
export function PsychologistDocumentsScreen({ navigation }: Props) {
  const { isApplicant, isPsychologist, refreshAccess } = usePsychologistAuth();
  const [docs, setDocs] = useState<PsychologistDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKind, setBusyKind] = useState<PsychologistDocumentKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetchPsychologistDocuments();
    setDocs(res.documents);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void (async () => {
        try {
          await load();
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof StaffApiError ? err.message : "Could not load documents.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
      await refreshAccess();
    } catch (err) {
      setError(err instanceof StaffApiError ? err.message : "Could not refresh.");
    } finally {
      setRefreshing(false);
    }
  };

  const rows = useMemo(
    () =>
      REQUIRED_DOCUMENT_KINDS.map((kind) => ({
        kind,
        doc: activeDocForKind(docs, kind),
      })),
    [docs]
  );

  const allUploaded = rows.every((r) => r.doc?.status === "UPLOADED");
  const needsReplace = rows.some((r) => r.doc?.status === "REJECTED_NEED_REUPLOAD");

  const onPickForKind = async (kind: PsychologistDocumentKind) => {
    setError(null);
    setProgress(null);
    setBusyKind(kind);
    try {
      const file = await pickPsychologistDocumentFile();
      if (!file) return;

      setProgress(`Uploading ${KIND_LABEL[kind]}…`);
      const existing = activeDocForKind(docs, kind);
      if (existing && (existing.status === "UPLOADED" || existing.status === "REJECTED_NEED_REUPLOAD")) {
        await replacePsychologistDocument(existing.id, file);
      } else {
        await uploadPsychologistDocument(kind, file);
      }
      setProgress(null);
      await load();
      await refreshAccess();
    } catch (err) {
      setProgress(null);
      setError(err instanceof StaffApiError ? err.message : "Upload failed.");
    } finally {
      setBusyKind(null);
    }
  };

  const onContinue = async () => {
    if (isApplicant) {
      navigation.navigate("PsychologistPendingReview");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitPsychologistApplication();
      await refreshAccess();
      navigation.navigate("PsychologistBackgroundCheck");
    } catch (err) {
      const message = err instanceof StaffApiError ? err.message : "Could not continue.";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("pending")) {
        navigation.navigate("PsychologistBackgroundCheck");
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress step={3} onBack={() => navigation.goBack()} />
        <Text style={[typeScale.h1, styles.title]}>Documents for verification</Text>
        <Text style={styles.body}>
          {isApplicant
            ? "Documents are collected after HR approval. If you’re still under screening, go back to your status."
            : "Upload JPEG, PNG, or PDF (max 10 MB). Files stay with the verification team — never shown to clients."}
        </Text>

        {loading ? (
          <ActivityIndicator color={psychColors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.list}>
            {rows.map(({ kind, doc }) => {
              const status = statusLabel(doc);
              const busy = busyKind === kind;
              return (
                <View key={kind} style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{KIND_LABEL[kind]}</Text>
                    <Text
                      style={[
                        styles.rowStatus,
                        status.tone === "ok" && styles.statusOk,
                        status.tone === "warn" && styles.statusWarn,
                      ]}
                    >
                      {busy ? "Uploading…" : status.text}
                    </Text>
                    {doc?.status === "REJECTED_NEED_REUPLOAD" && doc.rejectionReason ? (
                      <Text style={styles.rejectReason}>{doc.rejectionReason}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={[styles.rowBtn, busy && styles.rowBtnDisabled]}
                    disabled={busy || Boolean(busyKind)}
                    onPress={() => void onPickForKind(kind)}
                  >
                    <Text style={styles.rowBtnLabel}>
                      {doc?.status === "REJECTED_NEED_REUPLOAD"
                        ? "Replace"
                        : doc?.status === "UPLOADED"
                          ? "Replace"
                          : "Upload"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {progress ? <Text style={styles.progress}>{progress}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isPsychologist ? (
          <>
            <PsychPrimaryButton
              label={needsReplace ? "Replace required documents first" : "Submit for background check"}
              onPress={() => void onContinue()}
              loading={submitting}
              disabled={!allUploaded || needsReplace || Boolean(busyKind)}
            />
            <PsychPrimaryButton
              label="View verification status"
              onPress={() => navigation.navigate("PsychologistBackgroundCheck")}
              style={styles.secondary}
            />
          </>
        ) : (
          <PsychPrimaryButton
            label="Back to application status"
            onPress={() => navigation.navigate("PsychologistPendingReview")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: psychColors.background },
  content: {
    paddingHorizontal: spacing.flowHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  title: { marginTop: spacing.sm },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: psychColors.inkMuted,
  },
  list: { gap: 10, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: psychColors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: psychColors.border,
    padding: 14,
  },
  rowText: { flex: 1, gap: 4 },
  rowTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: psychColors.ink,
  },
  rowStatus: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: psychColors.inkMuted,
  },
  statusOk: { color: psychColors.expertInk },
  statusWarn: { color: psychColors.flagInk },
  rejectReason: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: psychColors.flagInk,
    marginTop: 2,
  },
  rowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: psychColors.primary,
  },
  rowBtnDisabled: { backgroundColor: psychColors.disabledBg },
  rowBtnLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 13,
    color: psychColors.surface,
  },
  progress: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.primary,
  },
  error: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: psychColors.coralInk,
  },
  secondary: {
    backgroundColor: psychColors.ink,
  },
});
