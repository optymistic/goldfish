"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { toast } = useToast()

  // Check if user is already authenticated
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify")
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error("Auth verification error:", error)
        setIsAuthenticated(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setHasError(false)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsAuthenticated(true)
        toast({
          title: "Access Granted",
          description: "Welcome to the Guide Creator!",
        })
      } else {
        setHasError(true)
        toast({
          title: "Access Denied",
          description: data.error || "Invalid password",
          variant: "destructive",
        })
        setPassword("")
        
        // Clear error state after 3 seconds
        setTimeout(() => {
          setHasError(false)
        }, 3000)
      }
    } catch (error) {
      console.error("Login error:", error)
      setHasError(true)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      
      // Clear error state after 3 seconds
      setTimeout(() => {
        setHasError(false)
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      setPassword("")
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Show loading spinner while verifying authentication
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-rings"></div>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-pulse">
            Verifying access...
          </p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center p-4">
        <Card className="card-premium w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Access Required</CardTitle>
            <CardDescription>Enter the password to access the Guide Creator</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (hasError) setHasError(false)
                    }}
                    className={`pr-10 transition-all duration-300 ${
                      hasError 
                        ? "!border-red-500 !bg-red-50 dark:!bg-red-950/20 !focus-visible:ring-red-500" 
                        : ""
                    }`}
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {hasError && (
                  <div className="text-xs text-red-500 mt-1 animate-in slide-in-from-top-1 duration-200">
                    Invalid password
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full btn-premium">
                {isLoading ? (
                  <>
                    <div className="loading-rings-sm mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  "Access Guide Creator"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show authenticated content with logout option
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
