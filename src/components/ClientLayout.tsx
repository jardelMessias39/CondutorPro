"use client";

import { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotificationIA from "@/components/NotificationIA";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <NotificationIA />
      <WhatsAppButton />
    </ErrorBoundary>
  );
}