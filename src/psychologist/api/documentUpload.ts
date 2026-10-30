import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  confirmDocumentReplacement,
  confirmDocumentUpload,
  PsychologistDocumentDto,
  PsychologistDocumentKind,
  requestDocumentReplacementUploadUrl,
  requestDocumentUploadUrl,
} from "./psychologistApi";
import { StaffApiError } from "./staffClient";

const ALLOWED = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_BYTES = 10 * 1024 * 1024;

export type PickedDocumentFile = {
  uri: string;
  contentType: string;
  byteSize: number;
  name: string;
};

export async function pickPsychologistDocumentFile(): Promise<PickedDocumentFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/jpeg", "image/png", "application/pdf"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const contentType = (asset.mimeType || guessMime(asset.name) || "").toLowerCase();
  if (!ALLOWED.has(contentType)) {
    throw new StaffApiError(400, "Use a JPEG, PNG, or PDF file.");
  }

  let byteSize = asset.size ?? 0;
  if (!byteSize && asset.uri) {
    const info = await FileSystem.getInfoAsync(asset.uri);
    if (info.exists && "size" in info && typeof info.size === "number") {
      byteSize = info.size;
    }
  }
  if (!byteSize || byteSize <= 0) {
    throw new StaffApiError(400, "Could not read file size.");
  }
  if (byteSize > MAX_BYTES) {
    throw new StaffApiError(400, "File must be 10 MB or smaller.");
  }

  return {
    uri: asset.uri,
    contentType,
    byteSize,
    name: asset.name || "document",
  };
}

async function putFileToSignedUrl(
  uploadUrl: string,
  uri: string,
  contentType: string,
  extraHeaders: Record<string, string>
) {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...extraHeaders,
  };
  const uploaded = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers,
  });
  if (uploaded.status < 200 || uploaded.status >= 300) {
    throw new StaffApiError(uploaded.status, "Upload to storage failed. Try again.");
  }
}

/** New upload for a document kind (first time). */
export async function uploadPsychologistDocument(
  kind: PsychologistDocumentKind,
  file: PickedDocumentFile
): Promise<PsychologistDocumentDto> {
  const signed = await requestDocumentUploadUrl({
    kind,
    contentType: file.contentType,
    byteSize: file.byteSize,
  });
  await putFileToSignedUrl(signed.uploadUrl, file.uri, file.contentType, signed.headers ?? {});
  return confirmDocumentUpload({
    kind,
    objectKey: signed.objectKey,
    contentType: file.contentType,
    byteSize: file.byteSize,
  });
}

/** Replace an existing document (including REJECTED_NEED_REUPLOAD). */
export async function replacePsychologistDocument(
  documentId: string,
  file: PickedDocumentFile
): Promise<PsychologistDocumentDto> {
  const signed = await requestDocumentReplacementUploadUrl(documentId, {
    contentType: file.contentType,
    byteSize: file.byteSize,
  });
  await putFileToSignedUrl(signed.uploadUrl, file.uri, file.contentType, signed.headers ?? {});
  return confirmDocumentReplacement(documentId, {
    objectKey: signed.objectKey,
    contentType: file.contentType,
    byteSize: file.byteSize,
  });
}

function guessMime(name?: string | null): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return null;
}
