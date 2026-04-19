import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorInfoComponent } from '@/components/ErrorInfoComponent.tsx'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error?: Error
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      error: undefined,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for development debugging
    console.error('ErrorInfoComponent caught an error:', error, errorInfo)

    this.setState({
      error: error,
    })

    // Here you could also log to an error reporting service in production
    // Example: logErrorToService(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <ErrorInfoComponent error={this.state.error} />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
