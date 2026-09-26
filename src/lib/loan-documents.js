import ImageKit from "imagekit";

// Loan documents (national ID, selfies) are stored as private ImageKit files.
// They can only be viewed through short-lived signed URLs created here.

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

let imagekit;
function getImageKit() {
  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
}

export function signDocumentUrl(url) {
  if (!url) return url;
  try {
    return getImageKit().url({
      src: url,
      signed: true,
      expireSeconds: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    console.error("signDocumentUrl: Error", error);
    return url;
  }
}

export function withSignedDocuments(loan) {
  if (!loan?.documents) return loan;
  return {
    ...loan,
    documents: loan.documents.map((doc) => ({
      ...doc,
      url: signDocumentUrl(doc.url),
    })),
  };
}

// True when the URL points at the uploader's own loan folder in ImageKit.
export function isOwnLoanDocumentUrl(url, userId) {
  const endpoint = (process.env.IMAGEKIT_URL_ENDPOINT || "").replace(/\/+$/, "");
  if (!endpoint || typeof url !== "string") return false;
  return url.startsWith(`${endpoint}/loans/${userId}/`);
}
