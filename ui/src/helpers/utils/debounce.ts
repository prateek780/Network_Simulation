export function debounce<T>(callback: T, wait: number)  {
    let timeoutId: any = null;
    function func(...args: any) {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            (callback as any)(...args);
        }, wait);
    }
    return func as T;
}