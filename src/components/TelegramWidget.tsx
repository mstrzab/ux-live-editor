"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: Record<string, string>) => void;
    };
  }
}

interface TelegramWidgetProps {
  botUsername: string;
  onAuth: (user: Record<string, string>) => void;
}

export default function TelegramWidget({ botUsername, onAuth }: TelegramWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.TelegramLoginWidget = {
      dataOnauth: (user: Record<string, string>) => {
        onAuth(user);
      },
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [botUsername, onAuth]);

  return (
    <div ref={containerRef} className="flex justify-center" />
  );
}
