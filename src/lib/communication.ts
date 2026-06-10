/**
 * Standardizes phone numbers for global APIs.
 */
export const cleanPhoneNumber = (phone: string): string => {
  const numeric = phone.replace(/\D/g, '');
  if (numeric.length === 10 && !numeric.startsWith('91')) {
    return '91' + numeric;
  }
  return numeric;
};

/**
 * Internal helper to trigger a URL without navigating the main dashboard.
 * Uses a hidden iframe to preserve the application state.
 */
const triggerHiddenAction = (url: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  // Cleanup
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 5000);
};

/**
 * Triggers a direct Phone Call using the tel: protocol.
 */
export const triggerCall = (phone: string) => {
  if (!phone) return;
  window.location.href = `tel:${phone}`;
};

/**
 * Triggers WhatsApp Messaging without leaving the dashboard.
 */
export const triggerWhatsApp = (phone: string, message: string = '') => {
  if (!phone) return;
  const cleaned = cleanPhoneNumber(phone);
  const url = `https://api.whatsapp.com/send/?phone=${cleaned}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  
  // Detect if protocol should be used for more direct app triggering
  const protocolUrl = `whatsapp://send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
  
  // We trigger both for maximum compatibility without navigation
  triggerHiddenAction(protocolUrl);
  
  // Fallback to the web API via hidden iframe if protocol fails
  setTimeout(() => triggerHiddenAction(url), 500);
};

/**
 * "Smart Call" prioritized for WhatsApp (Preserves Dashboard state).
 */
export const triggerSmartCall = (phone: string) => {
  if (!phone) return;
  const cleaned = cleanPhoneNumber(phone);
  const protocolUrl = `whatsapp://send?phone=${cleaned}`;
  const webUrl = `https://api.whatsapp.com/send/?phone=${cleaned}&text&type=phone_number&app_absent=0`;
  
  triggerHiddenAction(protocolUrl);
  setTimeout(() => triggerHiddenAction(webUrl), 500);
};
