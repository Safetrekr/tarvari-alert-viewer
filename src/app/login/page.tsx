import type { Metadata } from 'next'
import { LoginScene } from '@/components/auth/login-scene'
import '@/styles/login.css'

export const metadata: Metadata = {
  title: 'Tarva Launch',
}

export default function LoginPage() {
  return <LoginScene />
}
