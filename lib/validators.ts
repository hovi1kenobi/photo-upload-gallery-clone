/**
 * Validation utilities for file uploads and data validation
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file for upload
 * Checks file type and size constraints
 */
export function validateImageFile(file: File | null): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, WebP)' }
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' }
  }

  return { valid: true }
}

/**
 * Validate ISBN-10 or ISBN-13 format
 * Returns true if the ISBN is in a valid format
 */
export function isValidISBN(isbn: string): boolean {
  if (!isbn) return false
  
  // Remove hyphens and spaces
  const clean = isbn.replace(/[-\s]/g, '')
  
  // ISBN-10: 10 digits, last can be X
  const isbn10Regex = /^[0-9]{9}[0-9X]$/
  // ISBN-13: 13 digits starting with 978 or 979
  const isbn13Regex = /^(978|979)[0-9]{10}$/
  
  return isbn10Regex.test(clean) || isbn13Regex.test(clean)
}

/**
 * Validate that a string is not empty after trimming
 */
export function isNonEmptyString(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validate array has items
 */
export function isNonEmptyArray<T>(value: T[] | undefined | null): value is T[] {
  return Array.isArray(value) && value.length > 0
}