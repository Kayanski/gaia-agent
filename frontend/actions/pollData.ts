"use server"

import { headers } from 'next/headers';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { ACTIVE_NETWORK } from './gaia/constants';
import { start } from 'repl';
import { MessageResponse, queryMessage, queryMessages } from '@/services/blockchain/cosmos';
import { Message } from 'postcss';
import { sendTreasuryTo } from '@/lib/send-funds';
import { getHighestPaiementId } from './database/getMessageById';
import { winner } from '.';
import { StructuredMessage } from "gaia-server"

let isProcessing = false;

export async function triggerDataUpdate() {
    if (isProcessing) {
        return {
            success: true
        }
    }
    isProcessing = true;
    return updateDataFromBlockchain().then(() => {
        return {
            success: true
        }
    }).catch((e) => {
        return {
            success: false,
            err: e
        }
    }).finally(() => {
        isProcessing = false
    })
}

async function updateDataFromBlockchain() {

    // We get the highest paiement ID
    const highestPaiementId = await getHighestPaiementId();

    // Then we fetch the first batch of messages. We only treat a batch at a time
    const cosmwasmClient = await CosmWasmClient.connect(ACTIVE_NETWORK.chain.rpc);

    const messages = await queryMessages(highestPaiementId, cosmwasmClient);
    for (const message of messages) {
        // If there is already a winner, there is nothing to update
        if (!!(await winner())) {
            return
        }
        // We send a LLVM request
        await triggerAiResponse(message)
    }
}

async function triggerAiResponse(message: MessageResponse) {

    // If it's not submitted, we send the message to the AI
    const aiResponse: StructuredMessage = await (await fetch(`${process.env.API_URL}/${ACTIVE_NETWORK.character}/message`, {
        method: "POST",
        body: JSON.stringify({
            userName: message.sender,
            text: message.msg,
            paiementId: message.message_id
        }),
        headers: {
            "Authorization": `Bearer ${process.env.API_BEARER_TOKEN}`
        },
    })).json();
    console.log(aiResponse)

    // If the AI decides to transfer the funds, we transfer them to the address, the game is over, We don't care if that fails
    if (aiResponse.decision) {
        await sendTreasuryTo(message.sender)
    }
}