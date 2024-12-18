"use server"

import { MESSAGE_FIELDS, parseDbMessageToTMessage, Role } from "@/lib/utils";
import { neon } from "@neondatabase/serverless";

export interface TMessage {
    content: string,
    id: string,
    fullConversation: string,
    role: Role
    isWinner: boolean,
    userWallet: string,
    createdAt: Date
    paiementId: number | null,
    pricePaid: number | null,
    is_submitted: boolean,
}

export interface DbMessage {
    id: string,
    address: string,
    prompt: string,
    submit_date: Date,
    is_submitted: boolean,
    paiement_id: number | null,
    price_paid: number | null,
    poster_role: Role,
    is_winner: boolean
}


export async function getRecentMessages(userAddress: string | undefined, max?: number): Promise<TMessage[]> {
    const sql = neon(process.env.DATABASE_URL || "");

    const messages: DbMessage[] = await sql(`SELECT ${MESSAGE_FIELDS} FROM prompts LIMIT $1 `, [max ?? 100]) as unknown as DbMessage[];

    return messages.map(parseDbMessageToTMessage).filter((m) => {
        return m.userWallet != null || m.role == "system"
    })
}