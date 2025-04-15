export function getRandomColor(...except: string[]): string {
    var letters = '0123456789ABCDEF';
    var color = '#';
    while (true) {
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        if (!except.includes(color)) {
            break;
        }
    }
    return color;
}
