import { SimLogger } from "./simLogger";

export function getLogger(scope: string) {
    return SimLogger.getInstance(scope);
}