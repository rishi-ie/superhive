import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { messages } from '../schema';
import type { Message, MessageInput } from '../types';

export async function listMessages(sessionId: string): Promise<Message[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt);
  return rows as Message[];
}

export async function addMessage(input: MessageInput): Promise<Message> {
  const db = await getDb();
  const rows = await db.insert(messages).values(input).returning();
  return rows[0] as Message;
}

export async function deleteMessages(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.delete(messages).where(eq(messages.sessionId, sessionId));
}
