export enum Events {
    ADD_NODE
}


type callback = (data: any) => void;
const eventBus = {
    on(event: Events, callback: callback) {
        document.addEventListener(event.toString(), (e: any) => callback(e.detail));
    },
    dispatch(event: Events, data: any) {
        document.dispatchEvent(new CustomEvent(event.toString(), { detail: data }));
    },
    remove(event: Events, callback: callback) {
        document.removeEventListener(event.toString(), callback);
    },
};

export default eventBus;