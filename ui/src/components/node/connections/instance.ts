import { ConnectionManager } from "./connectionManager"

export function getConnectionInstance() {
    return ConnectionManager.getInstance();
}