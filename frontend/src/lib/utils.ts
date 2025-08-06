import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DeviceType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function detectDevice(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios'
  }
  
  if (/android/.test(userAgent)) {
    return 'android'
  }
  
  return 'other'
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  console.log('📱 formatPhoneNumber - input:', value, 'digits:', digits)
  
  // Handle Russian numbers - ensure we start with 7
  let workingDigits = digits
  
  // If user starts typing without 7, prepend it
  if (digits.length > 0 && !digits.startsWith('7')) {
    workingDigits = '7' + digits
  }
  
  // Limit to 11 digits maximum
  workingDigits = workingDigits.slice(0, 11)
  
  console.log('📱 formatPhoneNumber - workingDigits:', workingDigits)
  
  // Apply mask: +7 (999) 999-99-99
  let formatted = '+7'
  
  if (workingDigits.length > 1) {
    const remaining = workingDigits.slice(1) // Remove the leading '7'
    
    if (remaining.length > 0) {
      formatted += ' (' + remaining.slice(0, 3)
      
      if (remaining.length > 3) {
        formatted += ') ' + remaining.slice(3, 6)
        
        if (remaining.length > 6) {
          formatted += '-' + remaining.slice(6, 8)
          
          if (remaining.length > 8) {
            formatted += '-' + remaining.slice(8, 10)
          }
        }
      }
    }
  }
  
  console.log('📱 formatPhoneNumber - result:', formatted)
  return formatted
}

export function validateName(name: string): string | null {
  if (!name.trim()) {
    return 'Имя обязательно для заполнения'
  }
  
  if (name.trim().length < 2) {
    return 'Имя должно содержать минимум 2 символа'
  }
  
  if (!/^[а-яёa-z\s\-]+$/i.test(name.trim())) {
    return 'Имя может содержать только буквы, пробелы и дефисы'
  }
  
  return null
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  
  if (!digits) {
    return 'Телефон обязателен для заполнения'
  }
  
  if (digits.length !== 11 || !digits.startsWith('7')) {
    return 'Введите корректный российский номер телефона'
  }
  
  return null
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
