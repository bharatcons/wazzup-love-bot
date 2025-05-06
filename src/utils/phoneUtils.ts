/**
 * Phone number utilities for handling Indian and international phone numbers
 */

/**
 * Validates if a number is a valid Indian mobile number
 * @param phoneNumber The phone number to validate
 * @returns boolean indicating if it's a valid Indian number
 */
export const isValidIndianNumber = (phoneNumber: string): boolean => {
  // Clean the phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number:
  // - 10 digits starting with 6, 7, 8, or 9 (without country code)
  // - 12 digits starting with 91 followed by 6, 7, 8, or 9 (with country code)
  return (
    (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) ||
    (cleaned.length === 12 && /^91[6-9]\d{9}$/.test(cleaned))
  );
};

/**
 * Formats a phone number as an Indian mobile number with proper spacing
 * @param phoneNumber The phone number to format
 * @returns Formatted Indian phone number
 */
export const formatIndianNumber = (phoneNumber: string): string => {
  // Clean the phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  // If it doesn't match expected formats, return with country code
  return `+91 ${cleaned}`;
};

/**
 * Ensures a phone number has the Indian country code (91) if it's an Indian number
 * @param phoneNumber The phone number to process
 * @returns Phone number with country code
 */
export const ensureIndianCountryCode = (phoneNumber: string): string => {
  // Clean the phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it's a 10-digit number starting with 6-9, add the country code
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `91${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Creates a direct WhatsApp link for an Indian phone number
 * @param phoneNumber The phone number to create a link for
 * @param message Optional message to pre-fill
 * @returns WhatsApp URL
 */
export const getIndianWhatsAppLink = (phoneNumber: string, message?: string): string => {
  // Ensure country code is present
  const processedNumber = ensureIndianCountryCode(phoneNumber);
  
  // Create base WhatsApp URL
  let whatsappUrl = `https://wa.me/${processedNumber}`;
  
  // Add message if provided
  if (message) {
    whatsappUrl += `?text=${encodeURIComponent(message)}`;
  }
  
  return whatsappUrl;
};

/**
 * Detects if a phone number appears to be an Indian number
 * @param phoneNumber The phone number to check
 * @returns boolean indicating if it's likely an Indian number
 */
export const isLikelyIndianNumber = (phoneNumber: string): boolean => {
  // Clean the phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check for patterns that suggest an Indian number
  return (
    // 10 digits starting with 6-9
    (cleaned.length === 10 && /^[6-9]/.test(cleaned)) ||
    // With country code
    (cleaned.startsWith('91') && cleaned.length === 12) ||
    // With + prefix for country code
    (cleaned.startsWith('091') && cleaned.length === 13)
  );
}; 