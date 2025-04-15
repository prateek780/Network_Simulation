export class ConnectionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class ConnectionAlreadyExists extends ConnectionError {
    constructor(from: string, to: string) {
        const message = `Connection already exists between ${from} and ${to}`;
        super(message);
    }
}


export class ConnectionDoesNotExists extends ConnectionError {
    constructor(from: string) {
        const message = `Connection not started from ${from}`;
        super(message);
    }
}