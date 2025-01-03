import { asyncAction } from "@/lib/utils";
import { ACTIVE_NETWORK } from "../gaia/constants";
import { ApiRoute } from "gaia-server";


export async function queryApi(route: ApiRoute, queryArgs: Record<string, any> = {}) {
    const {
        data: fetchResult,
        err
    } = await asyncAction(fetch(`${process.env.API_URL}/${ACTIVE_NETWORK.character}/${route}?` + new URLSearchParams(queryArgs)))

    if (!fetchResult) {
        console.error(err)
        return
    }

    return await fetchResult.json()
}