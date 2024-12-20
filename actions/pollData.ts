"use server"

import { headers } from 'next/headers';
import { getHighestPaiementId } from './getMessageById';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { ACTIVE_NETWORK } from './gaia/constants';
import { start } from 'repl';
import { MessageResponse, queryMessage, queryMessages } from '@/services/blockchain/cosmos';
import { insertAssistantMessage, insertUserMessage, messagePromptTransmitted } from './gaia/createDb';
import { sendMessage } from '@/services/llm/claude';
import { getMaxPaiementIdByRole } from './getMessages';
import { Message } from 'postcss';

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

    await retryPastRequests();

    // We get the highest paiement ID
    const highestPaiementId = await getHighestPaiementId();

    // Then we fetch the first batch of messages. We only treat a batch at a time
    const cosmwasmClient = await CosmWasmClient.connect(ACTIVE_NETWORK.chain.rpc);

    const messages = await queryMessages(highestPaiementId, cosmwasmClient);
    for (const message of messages) {

        // We save it locally
        await insertUserMessage({
            address: message.sender,
            prompt: message.msg,
            time: message.time,
            pricePaid: message.price_paid.amount,
            paiementId: message.message_id
        })

        // We send a LLVM request
        await triggerAiResponse(message)
    }
}

async function triggerAiResponse(message: MessageResponse) {

    // If it's not submitted, we send the message to the AI
    const aiResponse = await sendMessage({
        messages: [{
            role: "user",
            content: message.msg,
        }
        ]
    });
    await insertAssistantMessage(message.sender, message.message_id, aiResponse);

    // After the LLVM request is processed, we update the message status in the DB
    await messagePromptTransmitted(message.message_id, aiResponse.decision);
}


export async function retryPastRequests() {

    // We load the max prompt and the max AI message
    let maxUserPaimentId = await getMaxPaiementIdByRole("user");
    let maxAssistantPaimentId = await getMaxPaiementIdByRole("assistant");

    if (maxUserPaimentId == undefined || maxUserPaimentId == maxAssistantPaimentId) {
        return
    }
    const cosmwasmClient = await CosmWasmClient.connect(ACTIVE_NETWORK.chain.rpc);

    // We need to refecth AI responsed for messages that don't have them (from maxAssistantPaimentId to maxUserPaimentId)

    for (let paiementId = (maxAssistantPaimentId ?? 0) + 1; paiementId <= maxUserPaimentId; paiementId++) {

        const message = await queryMessage(paiementId, cosmwasmClient);
        console.log(message)

        await triggerAiResponse(message)
    }
}