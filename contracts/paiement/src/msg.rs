use crate::state::Config;
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Coin, Decimal, Timestamp};
use cw_storage_plus::Map;

#[cw_serde]
pub struct TimeLimit {
    pub min_messages: u32,
    pub seconds_limit: u64,
}

#[cw_serde]
pub struct InstantiateMsg {
    pub initial_price: Coin,
    pub multiplier: Decimal,
    pub shares: Vec<(String, Decimal)>,
    pub price_limit: Option<Decimal>,
    pub time_limit: TimeLimit,
}

#[cw_serde]
pub struct ReceiverOptions {
    pub addr: String,
    pub chain: String,
    pub denom: String,
}

#[cw_serde]
#[derive(cw_orch::ExecuteFns)]
pub enum ExecuteMsg {
    #[cw_orch(payable)]
    Deposit {
        message: String,
        receiver: Option<ReceiverOptions>,
    },
}

#[cw_serde]
#[derive(cw_orch::QueryFns, QueryResponses)]
pub enum QueryMsg {
    #[returns(Config)]
    Config {},
    #[returns(CurrentPriceResponse)]
    CurrentPrice {},
    #[returns(TimeoutStatusResponse)]
    TimeoutStatus {},
    #[returns(MessageResponse)]
    Message { message_id: u32 },
    #[returns(Vec<MessageResponse>)]
    Messages {
        start_after: Option<u32>,
        limit: Option<u32>,
    },
}

#[cw_serde]
pub struct CurrentPriceResponse {
    pub price: Coin,
}

#[cw_serde]
pub enum TimeoutStatusResponse {
    Inactive {
        current_messages: u32,
        trigger_message_count: u32,
    },
    Active {
        end_date: Timestamp,
    },
}

#[cw_serde]
pub struct MessageResponse {
    pub message_id: u32,
    pub price_paid: Coin,
    pub sender: ReceiverOptions,
    pub msg: String,
    pub time: Timestamp,
}

#[cw_serde]
pub struct MessageState {
    pub price_paid: Coin,
    pub receiver: ReceiverOptions,
    pub msg: String,
    pub time: Timestamp,
}

pub const MESSAGES: Map<u32, MessageState> = Map::new("messages");
