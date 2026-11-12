"use server";

import { redirect } from "next/navigation";
import { geminiGenerate, chatConfigured } from "@/chat/gemini";
import { clearMessages, sendMessage } from "@/chat/service";
import { db } from "@/db";
import { requireUserId } from "@/lib/session";

export async function send(form: FormData) {
  const userId = await requireUserId();
  if (!chatConfigured) redirect("/chat");
  const text = form.get("question");
  const outcome = await sendMessage(db(), userId, typeof text === "string" ? text : "", geminiGenerate);
  redirect(outcome === "answered" ? "/chat#latest" : `/chat?error=${outcome}`);
}

export async function clear() {
  const userId = await requireUserId();
  await clearMessages(db(), userId);
  redirect("/chat");
}
