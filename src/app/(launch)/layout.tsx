'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrate = useAuthStore((s) => s.hydrate)
  const authenticated = useAuthStore((s) => s.authenticated)

  // Hydrate auth state from sessionStorage on mount.
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Redirect to login if not authenticated.
  useEffect(() => {
    // Wait one tick after hydration to avoid flash.
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().authenticated) {
        router.replace('/login')
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [authenticated, router])

  // While checking auth, render nothing to avoid a flash of protected content.
  if (!authenticated) {
    return <div className="fixed inset-0 bg-void" aria-hidden="true" />
  }

  return <>{children}</>
}
