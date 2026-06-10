"use client";

import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "unknown-error",
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("UI error boundary caught render error", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F8F6F0] px-6 text-center"
        dir="rtl"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <p className="text-base font-bold text-[#3D3428]">حدث خطأ غير متوقع</p>
        <p className="max-w-sm text-sm text-[#827762]">
          حاول إعادة تحميل الصفحة. إذا استمر الخطأ تواصل مع الدعم.
        </p>
        {this.state.message ? (
          <p className="max-w-sm break-all text-xs text-[#A69888]">{this.state.message}</p>
        ) : null}
        <button
          type="button"
          onClick={this.handleRetry}
          className="rounded-xl bg-[#3D3428] px-5 py-2.5 text-sm font-bold text-white"
        >
          إعادة التحميل
        </button>
      </div>
    );
  }
}
