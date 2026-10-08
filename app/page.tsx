"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return <p style={{ padding: "20px", color: "white" }}>Redirecting to login...</p>;
}