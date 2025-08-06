import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { NavigationHeader } from '@/components/ui/NavigationHeader'
import { formatPhoneNumber } from '@/lib/utils'
import type { RegistrationFormData } from '@/types'

const registrationSchema = z.object({
  name: z.string().min(1, 'Имя и фамилия обязательны для заполнения')
    .min(3, 'Имя и фамилия должны содержать минимум 3 символа')
    .regex(/^[а-яёa-z\s\-]+$/i, 'Имя и фамилия могут содержать только буквы, пробелы и дефисы'),
  phone: z.string().min(1, 'Телефон обязателен для заполнения')
    .refine((phone) => {
      console.log('🔍 Phone validation - input:', phone, 'length:', phone.length)
      const digits = phone.replace(/\D/g, '')
      console.log('🔍 Phone validation - digits:', digits, 'length:', digits.length)
      const isValid = digits.length === 11 && digits.startsWith('7')
      console.log('🔍 Phone validation - result:', isValid)
      return isValid
    }, 'Введите корректный российский номер телефона (+7 999 999-99-99)'),
})

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormData) => void
}

export function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const [phoneValue, setPhoneValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    trigger,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneValue(formatted)
    setValue('phone', formatted)
    trigger('phone')
  }

  const handleFormSubmit = (data: RegistrationFormData) => {
    console.log('📝 Form submit data:', data)
    // Send data as-is to API - phone formatting will be handled by backend
    onSubmit(data)
  }

  return (
    <div className="screen-container">
      <NavigationHeader 
        title="Регистрация" 
        showBack={false}
      />
      
      <div className="content-container">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Добро пожаловать в Loy!
          </h2>
          <p className="text-gray-600">
            Зарегистрируйтесь, чтобы получить карту лояльности
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Имя и фамилия *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="Введите ваше имя и фамилию"
              className={`ios-input ${errors.name ? 'error' : ''}`}
              autoComplete="name"
            />
            {errors.name && (
              <p className="error-message">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Телефон *
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneValue}
              onChange={handlePhoneChange}
              placeholder="+7 (999) 999-99-99"
              className={`ios-input ${errors.phone ? 'error' : ''}`}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="error-message">{errors.phone.message}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!isValid}
              className="w-full ios-button-primary"
            >
              Зарегистрироваться
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Нажимая "Зарегистрироваться", вы соглашаетесь с{' '}
            <a href="#" className="text-ios-blue hover:underline">
              условиями использования
            </a>{' '}
            и{' '}
            <a href="#" className="text-ios-blue hover:underline">
              политикой конфиденциальности
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
