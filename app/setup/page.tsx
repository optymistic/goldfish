"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Database, CheckCircle, AlertCircle, Play, Copy } from "lucide-react"

export default function SetupPage() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const { toast } = useToast()

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step])
      toast({
        title: `Step ${step} Complete`,
        description: "Great! Move on to the next step.",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    })
  }

  const allStepsComplete = completedSteps.length >= 4

  return (
    <div className="min-h-screen bg-premium p-4">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Setup Guide Creator</h1>
          <p className="text-muted-foreground mt-2">Follow these steps to get your application running</p>
        </div>

        <div className="grid gap-6">
          {/* Step 1: Environment Variables */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {completedSteps.includes(1) ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                Step 1: Environment Variables
              </CardTitle>
              <CardDescription>Set up your environment variables in .env.local</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(`ADMIN_PASSWORD=your-secure-password-here
JWT_SECRET=your-very-long-jwt-secret-key-make-it-random
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`)
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <pre className="text-sm font-mono">
                  {`ADMIN_PASSWORD=your-secure-password-here
JWT_SECRET=your-very-long-jwt-secret-key-make-it-random
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`}
                </pre>
              </div>
              <Button onClick={() => markStepComplete(1)} disabled={completedSteps.includes(1)} className="btn-premium">
                {completedSteps.includes(1) ? "✅ Complete" : "Mark as Complete"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Database Setup */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {completedSteps.includes(2) ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Database className="h-5 w-5" />
                )}
                Step 2: Database Setup
              </CardTitle>
              <CardDescription>Run these SQL scripts in your Supabase SQL editor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">1. Create Tables</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("Run scripts/001-create-tables-updated.sql")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run <code>scripts/001-create-tables-updated.sql</code>
                  </p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">2. Create Functions</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("Run scripts/003-create-functions.sql")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run <code>scripts/003-create-functions.sql</code>
                  </p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">3. Add Sample Data</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("Run scripts/002-seed-data-fixed.sql")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run <code>scripts/002-seed-data-fixed.sql</code>
                  </p>
                </div>
              </div>
              <Button onClick={() => markStepComplete(2)} disabled={completedSteps.includes(2)} className="btn-premium">
                {completedSteps.includes(2) ? "✅ Complete" : "Mark as Complete"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 3: Test Connection */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {completedSteps.includes(3) ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                Step 3: Test Your Setup
              </CardTitle>
              <CardDescription>Verify everything is working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What to test:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Can access the dashboard with your password</li>
                  <li>✅ Can see sample guides in the dashboard</li>
                  <li>✅ Can create a new guide</li>
                  <li>✅ Can edit guide content</li>
                </ul>
              </div>
              <Button onClick={() => markStepComplete(3)} disabled={completedSteps.includes(3)} className="btn-premium">
                {completedSteps.includes(3) ? "✅ Complete" : "Mark as Complete"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 4: Optional Auth Setup */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {completedSteps.includes(4) ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                )}
                Step 4: Advanced Auth (Optional)
              </CardTitle>
              <CardDescription>Set up proper user authentication when you're ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">For production use:</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  When you're ready for multiple users, run the auth integration script:
                </p>
                <div className="bg-muted/50 p-3 rounded-lg relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard("Run scripts/005-setup-auth-integration.sql")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <code className="text-sm">scripts/005-setup-auth-integration.sql</code>
                </div>
              </div>
              <Button onClick={() => markStepComplete(4)} disabled={completedSteps.includes(4)} className="btn-premium">
                {completedSteps.includes(4) ? "✅ Complete" : "Skip for Now"}
              </Button>
            </CardContent>
          </Card>

          {/* Ready to Go */}
          {allStepsComplete && (
            <Card className="card-premium border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />🎉 Setup Complete!
                </CardTitle>
                <CardDescription>Your Guide Creator is ready to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Great job! You can now access your dashboard and start creating guides.
                  </p>
                  <Button onClick={() => (window.location.href = "/")} className="w-full btn-premium">
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
