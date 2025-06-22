import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { user, session, loading, setUser, setSession, setLoading, signOut: storeSignOut } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          auth_id: data.user.id,
          email: data.user.email!,
          full_name: fullName || null,
        })

      if (profileError) throw profileError
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    storeSignOut()
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }
}

// Custom hook for smart navigation
export const useSmartNavigation = () => {
  const navigate = useNavigate()

  const canGoBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      // Check if the previous page was within our app
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      
      if (referrer && referrer.startsWith(currentOrigin)) {
        return true
      }
    }
    return false
  }

  const goBack = (fallbackRoute: string = '/dashboard') => {
    if (canGoBack()) {
      // Safe to go back in history
      navigate(-1)
    } else {
      // Fallback to specific route
      navigate(fallbackRoute)
    }
  }

  const goBackToLogin = () => {
    goBack('/login')
  }

  const goBackToDashboard = () => {
    goBack('/dashboard')
  }

  const navigateTo = (route: string) => {
    navigate(route)
  }

  return { goBack, goBackToLogin, goBackToDashboard, navigateTo, canGoBack }
}