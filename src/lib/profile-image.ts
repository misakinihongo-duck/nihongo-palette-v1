export const acceptedProfileImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const maxProfileImageBytes = 5 * 1024 * 1024;

type ProfileImageKind = "learner" | "provider";

export function validateProfileImage(file: File | null) {
  if (!file) return null;
  if (!acceptedProfileImageTypes.includes(file.type as (typeof acceptedProfileImageTypes)[number])) {
    return "JPEG、PNG、WebP、GIF形式の画像を選択してください。";
  }
  if (file.size > maxProfileImageBytes) return "画像は5MB以下にしてください。";
  return null;
}

export function createProfileImagePath(userId: string, kind: ProfileImageKind, file: File, nonce: string) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
  return `${userId}/${kind}/${nonce}.${safeExtension}`;
}

export function isManagedProfileImage(path: string | null, userId: string) {
  return Boolean(path && path.startsWith(`${userId}/`));
}
