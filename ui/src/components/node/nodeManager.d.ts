export {};

declare global {
    namespace NodeJS {
        interface Global {
            config: any
        }
    }
}