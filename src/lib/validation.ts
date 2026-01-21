import { z } from 'zod';

// VIN Validation - 17 characters, no I, O, Q
export const vinSchema = z.string()
  .transform(val => val.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))
  .refine(val => val.length === 17, {
    message: 'VIN trebuie să conțină exact 17 caractere'
  });

export const isValidVIN = (vin: string): boolean => {
  const cleaned = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  return cleaned.length === 17;
};

export const sanitizeVIN = (vin: string): string => {
  return vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
};

// Phone Validation - Romanian phone numbers
// Accepts: 07XX XXX XXX, +407XX XXX XXX, 004XX XXX XXX
export const phoneSchema = z.string()
  .transform(val => val.replace(/[\s\-\(\)]/g, ''))
  .refine(val => {
    // Romanian mobile: 07XXXXXXXX (10 digits) or +407XXXXXXXX / 00407XXXXXXXX
    const patterns = [
      /^07[0-9]{8}$/,           // 07XX XXX XXX
      /^\+407[0-9]{8}$/,        // +407XX XXX XXX
      /^00407[0-9]{8}$/,        // 00407XX XXX XXX
      /^02[0-9]{8}$/,           // 02X XXX XXXX (landline)
      /^03[0-9]{8}$/,           // 03X XXX XXXX (landline)
    ];
    return patterns.some(pattern => pattern.test(val));
  }, {
    message: 'Număr de telefon invalid. Folosiți formatul 07XX XXX XXX.'
  });

export const isValidRomanianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const patterns = [
    /^07[0-9]{8}$/,
    /^\+407[0-9]{8}$/,
    /^00407[0-9]{8}$/,
    /^02[0-9]{8}$/,
    /^03[0-9]{8}$/,
  ];
  return patterns.some(pattern => pattern.test(cleaned));
};

export const formatPhoneNumber = (phone: string): string => {
  // Only allow digits, +, and spaces for formatting
  const cleaned = phone.replace(/[^\d+\s]/g, '');
  return cleaned;
};

export const sanitizePhoneInput = (phone: string): string => {
  // Keep only digits and + sign
  return phone.replace(/[^\d+]/g, '');
};

// CIV Validation - Romanian vehicle ID card (Cartea de Identitate a Vehiculului)
// Format: Usually a letter followed by 6-9 digits (e.g., B123456, AB1234567)
export const civSchema = z.string()
  .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  .refine(val => {
    // CIV format: 1-2 letters followed by 6-9 digits
    return /^[A-Z]{1,2}\d{6,9}$/.test(val);
  }, {
    message: 'CIV invalid. Formatul corect: 1-2 litere urmate de 6-9 cifre (ex: B123456)'
  });

export const isValidCIV = (civ: string): boolean => {
  const cleaned = civ.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{1,2}\d{6,9}$/.test(cleaned);
};

export const sanitizeCIV = (civ: string): string => {
  return civ.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// CUI Validation - Romanian company ID
export const cuiSchema = z.string()
  .transform(val => val.toUpperCase().replace(/[^0-9RO]/g, ''))
  .refine(val => {
    // CUI can be: 12345678 or RO12345678
    const numericPart = val.replace(/^RO/, '');
    return numericPart.length >= 2 && numericPart.length <= 10 && /^\d+$/.test(numericPart);
  }, {
    message: 'CUI invalid. Formatul corect: 12345678 sau RO12345678'
  });

// CAEN Code Validation
export const caenSchema = z.string()
  .refine(val => /^\d{4}$/.test(val), {
    message: 'Cod CAEN invalid. Trebuie să conțină 4 cifre.'
  });

// File Upload Validation
export const KYC_ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const KYC_ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
export const KYC_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateKYCFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > KYC_MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fișierul este prea mare. Dimensiunea maximă este ${KYC_MAX_FILE_SIZE / 1024 / 1024}MB.`
    };
  }

  // Check file type
  if (!KYC_ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tip de fișier invalid. Sunt acceptate doar: PDF, JPG, PNG, WebP.'
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!KYC_ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Extensie de fișier invalidă. Sunt acceptate doar: .pdf, .jpg, .jpeg, .png, .webp'
    };
  }

  return { valid: true };
};

// Email validation
export const emailSchema = z.string()
  .email({ message: 'Adresă de email invalidă' })
  .max(255, { message: 'Email-ul nu poate depăși 255 de caractere' });

export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
