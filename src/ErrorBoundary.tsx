import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Database Error: ${parsed.operationType} failed on ${parsed.path}. ${parsed.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-white p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold text-brand-black">Application Error</h1>
              <p className="text-brand-black/60 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-brand-black text-brand-white rounded-full py-6"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
