let index = 0;

let chars = [];

let speed = 18;

let stopNow = false;

self.onmessage = function (e) {
    const { action, text, typingSpeed } = e.data;

    if (action === "start") {
        stopNow = false;
        typeCharacters(text, typingSpeed);
    } else if (action === "stop") {
        stopNow = true;
    }
};

async function typeCharacters(text, speed) {
    for (let i = 0; i < text.length; i++) {
        if (stopNow) return; // stop instantly
        const char = text[i];
        self.postMessage({ char });
        await new Promise(res => setTimeout(res, speed));
    }
    self.postMessage({ done: true });
}



function typeNext() {

    if (stop || index >= chars.length) {

        self.postMessage({ done: true });

        return;

    }



    self.postMessage({ char: chars[index] });

    index++;



    setTimeout(typeNext, speed); // ✅ runs even in background tabs

}

