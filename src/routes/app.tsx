import { createFileRoute } from "@tanstack/react-router";
import { FireApp } from "@/components/fire-app";

export const Route = createFileRoute("/app")({ component: FireApp });
