import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/shadcn/components/ui/alert.tsx'

interface ErrorProps {
  error: Error
}

const ErrorInfoComponent = ({ error }: ErrorProps) => {
  console.error('Error caught by router', error)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle variant="destructive">
          <CardTitleIcon icon={AlertCircle} />
          Something went wrong
        </CardTitle>
        <CardDescription>
          We're sorry, but something unexpected happened. Please try again.
        </CardDescription>
      </CardHeader>
      {error && (
        <CardContent className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Error Message:</div>
                <div className="font-mono text-sm">{error.toString()}</div>
              </div>
            </AlertDescription>
          </Alert>

          {error?.stack && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stack Trace</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-x-auto p-4 bg-muted rounded-md">
                  <code>{error.stack}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export { ErrorInfoComponent }
