export const base64ToBlob = (base64: string): Blob => {
  if (!base64 || typeof base64 !== "string") return new Blob();
  let meta = "",
    data = "";
  if (base64.includes(",")) {
    [meta, data] = base64.split(",");
  } else {
    data = base64;
    meta = "data:image/jpeg;base64";
  }
  let mime = "";
  let bytes = "";
  try {
    mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    bytes = atob(data);
  } catch (e) {
    console.error("base64ToBlob decode error:", e, base64);
    return new Blob();
  }
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
};
