import aksLogoUrl from '../assets/aks_logo.png'

// Logo natural size: 1425 × 402 px  →  ratio ≈ 3.545
const LOGO_W = 38   // mm
const LOGO_H = Math.round((LOGO_W / 1425) * 402 * 10) / 10  // ≈ 10.7 mm

let _cachedBase64 = null

async function getLogoBase64() {
  if (_cachedBase64) return _cachedBase64
  const res = await fetch(aksLogoUrl)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      _cachedBase64 = reader.result
      resolve(_cachedBase64)
    }
    reader.readAsDataURL(blob)
  })
}

/**
 * Add the AKS logo to the top-right corner of a jsPDF document.
 * @param {import('jspdf').jsPDF} doc
 */
export async function addLogoToPDF(doc) {
  try {
    const b64 = await getLogoBase64()
    const pageW = doc.internal.pageSize.getWidth()
    doc.addImage(b64, 'PNG', pageW - 14 - LOGO_W, 7, LOGO_W, LOGO_H)
  } catch {
    // logo unavailable — skip silently
  }
}
