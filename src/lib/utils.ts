import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a string representation
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Formats a currency value in South African Rand (ZAR)
 */
export function formatCurrency(amount: number, currency: string = 'ZAR', options?: Intl.NumberFormatOptions) {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol',
  };
  
  return new Intl.NumberFormat('en-ZA', options || defaultOptions).format(amount);
}

/**
 * Returns a human-readable time ago string from a date
 */
export function timeAgo(date: Date | string) {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export function truncateString(str: string, length: number = 50) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates a South African ID number using the full Luhn algorithm
 * 
 * South African ID Format: YYMMDDSSSSCA Z
 * YY = Year
 * MM = Month
 * DD = Day
 * SSSS = Gender (Females: 0000-4999, Males: 5000-9999)
 * C = Citizen status (0 = SA citizen, 1 = Permanent resident)
 * A = Race (for historical purposes, no longer used in new IDs)
 * Z = Checksum
 * 
 * @param idNumber The ID number to validate
 * @returns true if the ID number is valid, false otherwise
 */
export function validateSouthAfricanID(idNumber: string): boolean {
  // Basic validation
  if (!idNumber) return false;
  
  // Remove any spaces or hyphens
  idNumber = idNumber.replace(/[\s-]/g, '');
  
  // South African ID numbers must be exactly 13 digits
  if (idNumber.length !== 13) return false;
  
  // Must only contain numbers
  if (!/^\d+$/.test(idNumber)) return false;
  
  try {
    // Extract date components
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    
    // Basic date validation
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    // Days in month validation - accounting for leap years
    // For simplicity, we'll use a full year by determining the century
    const currentYear = new Date().getFullYear();
    const centuryPrefix = year <= (currentYear % 100) ? 2000 : 1900;
    const fullYear = centuryPrefix + year;
    
    // Check if it's a leap year
    const isLeapYear = (fullYear % 4 === 0 && fullYear % 100 !== 0) || (fullYear % 400 === 0);
    
    // Adjust February days for leap years
    const daysInMonth = [0, 31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month]) return false;
    
    // Gender validation (5000-9999 for males, 0000-4999 for females)
    const gender = parseInt(idNumber.substring(6, 10));
    if (gender < 0 || gender > 9999) return false;
    
    // Citizenship validation (0 or 1)
    const citizenship = parseInt(idNumber.charAt(10));
    if (citizenship !== 0 && citizenship !== 1) return false;
    
    // Implement the correct Luhn algorithm for SA ID numbers
    let sum = 0;
    
    // Process each digit
    for (let i = 0; i < 12; i++) {
      // Get the digit at the current position
      let digit = parseInt(idNumber.charAt(i));
      
      // For odd positions (1-based), double the digit
      // In 0-based indexing, odd positions are even indices
      if (i % 2 === 1) {
        digit = digit * 2;
        if (digit > 9) {
          digit = digit - 9;  // Same as summing the digits
        }
      }
      
      sum += digit;
    }
    
    // The check digit is what we need to add to make the sum divisible by 10
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Compare the calculated check digit with the actual check digit
    return checkDigit === parseInt(idNumber.charAt(12));
  } catch (error) {
    // If any errors occur during validation, the ID is invalid
    return false;
  }
}

/**
 * Extracts gender from a South African ID number
 * 
 * @param idNumber The ID number
 * @returns 'male', 'female', or null if invalid
 */
export function getGenderFromIDNumber(idNumber: string): string | null {
  if (!validateSouthAfricanID(idNumber)) return null;
  
  // Gender is determined by the 7th to 10th digits
  // 5000-9999 for males, 0000-4999 for females
  const genderCode = parseInt(idNumber.substring(6, 10));
  
  return genderCode >= 5000 ? 'male' : 'female';
}

/**
 * Extracts the date of birth from a South African ID number
 * 
 * @param idNumber The ID number
 * @returns A Date object representing the date of birth, or null if invalid
 */
export function getDateOfBirthFromIDNumber(idNumber: string): Date | null {
  if (!validateSouthAfricanID(idNumber)) return null;
  
  let year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));
  
  // Determine the century
  // For years 00-20 in the ID number, assume 2000s
  // For years 21-99, assume 1900s
  // This logic may need adjustment in the future
  const currentYear = new Date().getFullYear();
  const centuryPrefix = year <= (currentYear % 100) ? 2000 : 1900;
  year = centuryPrefix + year;
  
  try {
    const dateOfBirth = new Date(year, month - 1, day);
    
    // Validate that the date is valid and not in the future
    if (isNaN(dateOfBirth.getTime()) || dateOfBirth > new Date()) {
      return null;
    }
    
    return dateOfBirth;
  } catch (error) {
    return null;
  }
}

/**
 * Alternative name for getDateOfBirthFromIDNumber to match the import in the component
 */
export const extractDateOfBirthFromID = getDateOfBirthFromIDNumber;

/**
 * Alternative name for getGenderFromIDNumber to match the import in the component
 */
export const extractGenderFromID = getGenderFromIDNumber;

/**
 * Validates a South African phone number
 * 
 * Valid formats include:
 * - 10 digits starting with 0 (e.g., 0123456789)
 * - 11 digits starting with 27 (e.g., 27123456789)
 * - With optional spaces, parentheses, or dashes (e.g., 072 123 4567, (072) 123-4567)
 * - With optional leading + for international format (e.g., +27 82 123 4567)
 * 
 * South African mobile prefixes: 06, 07, 08
 * South African landline prefixes: 01, 02, 03, 04, 05
 * 
 * @param phoneNumber The phone number to validate
 * @returns true if the phone number is a valid South African number, false otherwise
 */
export function validateSouthAfricanPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Remove all non-numeric characters except the leading '+'
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check for the international format with +27
  if (cleaned.startsWith('+27')) {
    // +27 followed by 9 digits
    return /^\+27\d{9}$/.test(cleaned);
  }
  
  // Check for the international format without +
  if (cleaned.startsWith('27')) {
    // 27 followed by 9 digits
    return /^27\d{9}$/.test(cleaned);
  }
  
  // Check for local format starting with 0
  if (cleaned.startsWith('0')) {
    // 0 followed by 9 digits
    if (!/^0\d{9}$/.test(cleaned)) {
      return false;
    }
    
    // Check valid prefixes for mobile (06, 07, 08) and landlines (01, 02, 03, 04, 05)
    const prefix = cleaned.substring(0, 2);
    return ['01', '02', '03', '04', '05', '06', '07', '08'].includes(prefix);
  }
  
  return false;
}
