document.addEventListener("DOMContentLoaded", () => {
    // === LOGIKA TAB NAVIGATION (TOP NAV) ===
    const tabTranslate = document.getElementById("tab-translate");
    const tabCurrency = document.getElementById("tab-currency");
    const sectionTranslate = document.getElementById("section-translate");
    const sectionCurrency = document.getElementById("section-currency");

    function switchTab(tabName) {
        if (tabName === 'translate') {
            tabTranslate.classList.add("bg-white", "shadow-sm", "text-appDark");
            tabTranslate.classList.remove("text-slate-500");
            
            tabCurrency.classList.add("text-slate-500");
            tabCurrency.classList.remove("bg-white", "shadow-sm", "text-appDark");

            sectionTranslate.classList.remove("hidden");
            sectionCurrency.classList.add("hidden");
        } else {
            tabCurrency.classList.add("bg-white", "shadow-sm", "text-appDark");
            tabCurrency.classList.remove("text-slate-500");
            
            tabTranslate.classList.add("text-slate-500");
            tabTranslate.classList.remove("bg-white", "shadow-sm", "text-appDark");

            sectionCurrency.classList.remove("hidden");
            sectionTranslate.classList.add("hidden");
        }
    }

    tabTranslate.addEventListener("click", () => switchTab('translate'));
    tabCurrency.addEventListener("click", () => switchTab('currency'));

    // === LOGIKA API TRANSLATE (DENGAN DEBOUNCE) ===
    const inputText = document.getElementById("inputText");
    const outputText = document.getElementById("outputText");
    let typingTimer;                
    const doneTypingInterval = 800; 
inputText.addEventListener("input", () => {

    clearTimeout(typingTimer);

    showAutocomplete();

    if (!inputText.value.trim()) {
        outputText.innerText =
            "Translation will appear here...";
        return;
    }

    typingTimer = setTimeout(async () => {

        try {

            const words =
                inputText.value
                    .trim()
                    .split(" ");

            for (let i = 0; i < words.length; i++) {

                const response =
                    await fetch(
                        `/api/spellcheck/${encodeURIComponent(words[i])}`
                    );

                const data =
                    await response.json();

                words[i] =
                    data.corrected;
            }

            inputText.value =
                words.join(" ");

        } catch (err) {

            console.error(err);
        }

        translate();

    }, doneTypingInterval);

});

document.getElementById("source")
    ?.addEventListener("change", translate);

document.getElementById("target")
    ?.addEventListener("change", translate);

document.getElementById("micBtn")
    ?.addEventListener("click", startDictation);

document.getElementById("speakerBtn")
    ?.addEventListener("click", speakText);

document.getElementById("favoriteBtn")
    ?.addEventListener("click", saveFavorite);

document.getElementById("convertBtn")
    ?.addEventListener("click", convertCurrency);

loadHistory();
loadSuggestions();
loadFavorites();
loadHistory();
loadSuggestions();
loadFavorites();

});

/* =========================
   FUNGSI LOAD HISTORY
========================= */
async function loadHistory() {
    const historyContainer = document.getElementById("historyContainer");
    if (!historyContainer) return; 

    try {
        const response = await fetch("/api/history");
        // alert(response); 
        const data = await response.json();
        // alert(data.length); 
        if (data.length === 0) {
            historyContainer.innerHTML = '<p class="text-slate-400 italic">No history yet...</p>';
            return;
        }

        historyContainer.innerHTML = ""; 
        data.forEach(item => {
            const historyEl = document.createElement("div");
            historyEl.className = "flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm";
            historyEl.innerHTML = `
                <div class="flex-1">
                    <span class="text-xs font-bold text-slate-400 uppercase">${item.source}</span>
                    <p class="text-appDark font-medium">${item.original}</p>
                </div>
                <div class="flex-1">
                    <span class="text-xs font-bold text-slate-400 uppercase">${item.target}</span>
                    <p class="text-emerald-600 font-semibold">${item.translated}</p>
                </div>
            `;
            historyContainer.appendChild(historyEl);
        });
    } catch (error) {
        console.error("Gagal memuat history:", error);
    }
}


async function translate() {
     console.log(
        "TRANSLATE RECEIVED =",
        document.getElementById("inputText").value
    );
    const text =
        document.getElementById("inputText").value;
    console.log("TEXT BEFORE EXAMPLES =", text);
    const source =
        document.getElementById("source").value;

    const target =
        document.getElementById("target").value;

    const output =
        document.getElementById("outputText");

    if (!text.trim()) {
        output.innerText =
            "Translation will appear here...";
        return;
    }

    try {

        const response =
            await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    text,
                    source,
                    target
                })
            });

        const data =
            await response.json();

        console.log("TEXT:", text);
        console.log("RESULT:", data);

        output.innerText =
            data.translatedText;

        loadHistory();
        console.log("LOAD EXAMPLES =", text);
        loadExamples(text);

    } catch (error) {

        console.error(error);

    }
}

async function saveFavorite() {

    const original =
        document.getElementById("inputText").value;

    const translated =
        document.getElementById("outputText").innerText;

    const source =
        document.getElementById("source").value;

    const target =
        document.getElementById("target").value;

    if (!original || !translated) return;

    try {

        await fetch("/api/favorites", {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                original,
                translated,
                source,
                target
            })
        });

        alert(
            "⭐ Saved to favorites"
        );
        loadFavorites();
    } catch (error) {

        console.error(error);

    }
}


async function loadFavorites() {

    const favoriteContainer =
        document.getElementById("favoriteContainer");

    if (!favoriteContainer) return;

    try {

        const response =
            await fetch("/api/favorites");

        const data =
            await response.json();

        if (data.length === 0) {

            favoriteContainer.innerHTML = `
                <p class="text-slate-400 italic">
                    No favorites yet...
                </p>
            `;

            return;
        }

        favoriteContainer.innerHTML = "";

        data.forEach((item, index) => {

            const div =
                document.createElement("div");

            div.className =
                "bg-slate-50 border border-slate-200 rounded-2xl p-4 cursor-pointer hover:bg-slate-100";

            div.innerHTML = `
            <div class="flex justify-between items-center">

                <div>
                    <p class="text-xs text-slate-400 uppercase">
                        ${item.source}
                    </p>

                    <p class="font-medium text-appDark">
                        ${item.original}
                    </p>
                </div>

                <div class="flex items-center gap-3">

                    <div class="text-right">
                        <p class="text-xs text-slate-400 uppercase">
                            ${item.target}
                        </p>

                        <p class="font-semibold text-emerald-600">
                            ${item.translated}
                        </p>
                    </div>

                    <button
                        onclick="deleteFavorite(${index})"
                        class="text-red-500 hover:text-red-700"
                    >
                        <i class="fas fa-trash"></i>
                    </button>

                </div>

            </div>
            `;

            div.addEventListener("click", () => {

                document.getElementById("inputText").value =
                    item.original;

                document.getElementById("outputText").innerText =
                    item.translated;
            });

            favoriteContainer.appendChild(div);
        });

    } catch (error) {

        console.error(
            "Favorite load error:",
            error
        );
    }
}

async function deleteFavorite(index) {

    await fetch(
        `/api/favorites/${index}`,
        {
            method: "DELETE"
        }
    );

    loadFavorites();
}

async function spellCheck() {

    const input =
        document.getElementById("inputText");

    const text =
        input.value.trim();

    if (text.length < 2) return;

    try {

        const response =
            await fetch(
                `/api/spellcheck/${encodeURIComponent(text)}`
            );

        const data =
            await response.json();

        if (
            data.corrected &&
            data.corrected !== text
        ) {

            input.value =
                data.corrected;
        }

    } catch (error) {

        console.error(
            "Spell check error:",
            error
        );
    }
}

async function convertCurrency() {
    console.log("CONVERT CLICKED");
    const amount = document.getElementById("amount").value;
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const resultBox = document.getElementById("currencyResult");

    if (!amount) {
        resultBox.innerText = "0";
        return;
    }

    resultBox.innerText = "...";

    try {
        const response = await fetch(`/currency/${amount}/${from}/${to}`);
        const data = await response.json();

        if(data.error) {
            resultBox.innerText = "Error";
        } else {
            resultBox.innerText = data.result; 
        }
    } catch (error) {
        resultBox.innerText = "Fail";
    }
}

/* =========================
   FITUR TEXT-TO-VOICE (TTS)
========================= */
function speakText() {
    const text = document.getElementById("outputText").innerText;
    const targetLang = document.getElementById("target").value;

    // Jangan bersuara jika teks masih kosong
    if (!text || text === "Translation will appear here..." || text === "Typing..." || text.includes("Error")) {
        return; 
    }

    window.speechSynthesis.cancel();

    // Buat objek suara baru
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Sesuaikan aksen (English / Indonesian)
    const langMap = {
        'en': 'en-US',
        'id': 'id-ID',
        'zh': 'zh-CN'
    };
    utterance.lang = langMap[targetLang] || 'en-US';
    
    // Mainkan suara
    window.speechSynthesis.speak(utterance);
}

/* =========================
   FITUR EXAMPLE SENTENCES
========================= */

async function loadSuggestions() {

    const suggestionContainer =
        document.getElementById("suggestionContainer");

    if (!suggestionContainer) return;

    try {

        const response =
            await fetch("/api/suggestions");

        const suggestions =
            await response.json();

        suggestionContainer.innerHTML = "";

        suggestions.forEach(sentence => {

            const btn =
                document.createElement("button");

            btn.className =
                "bg-white border border-slate-200 hover:bg-appYellow hover:border-appYellow text-appDark px-4 py-3 rounded-2xl text-sm text-left transition shadow-sm";

            btn.innerText = sentence;

            // saat tombol dipencet
            btn.addEventListener("click", () => {

                document.getElementById("inputText").value =
                    sentence;

                translate();
            });

            suggestionContainer.appendChild(btn);
        });

    } catch (error) {

        console.error(
            "Suggestion error:",
            error
        );
    }
}
/* =========================
   Usage Example
========================= */
async function loadExamples(word) {

    const exampleContainer =
        document.getElementById("exampleContainer");

    if (!exampleContainer) return;

    try {

        const response =
            await fetch(
                `/api/examples/${encodeURIComponent(word)}`
            );

        const examples =
            await response.json();

        exampleContainer.innerHTML = "";

        if (examples.length === 0) {

            exampleContainer.innerHTML = `
                <p class="text-slate-400 text-sm italic">
                    No usage examples found.
                </p>
            `;

            return;
        }

        examples.forEach(example => {

    const div =
        document.createElement("div");

    div.className =
        "bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-sm text-appDark cursor-pointer hover:bg-slate-100";

    div.innerText = example;

div.addEventListener("click", () => {

    const input =
        document.getElementById("inputText");

    input.value = example;

    setTimeout(() => {
        translate();
    }, 50);

});

    exampleContainer.appendChild(div);
});

    } catch (error) {

        console.error(error);
    }
}

/* =========================
   FITUR VOICE-TO-TEXT (STT)
========================= */
function startDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Maaf, browser kamu belum mendukung fitur Voice-to-Text.");
        return;
    }

    const sourceLang = document.getElementById("source").value;
    if (sourceLang === 'auto') {
        alert("Harap pilih bahasa asal (English atau Indonesian) di dropdown terlebih dahulu!");
        return;
    }

    const recognition = new SpeechRecognition();
    const micBtn = document.getElementById("micBtn");
    const inputText = document.getElementById("inputText");
    
    // Sesuaikan pendengaran dengan bahasa dropdown
    const langMap = {
        'en': 'en-US',
        'id': 'id-ID',
        'zh': 'zh-CN'
    };
    recognition.lang = langMap[sourceLang] || 'en-US';
    recognition.interimResults = false;

    // Saat mulai mendengarkan
    recognition.onstart = function() {
        micBtn.classList.add("text-red-500", "animate-pulse");
        inputText.placeholder = "Listening...";
        inputText.value = ""; 
    };

    recognition.onresult = function(event) {
        // Ambil hasil teks dari ucapan
        const transcript = event.results[0][0].transcript;
        inputText.value = transcript;
        
        // Panggil fungsi translate agar langsung diterjemahkan
        translate(); 
    };

    // Error Handling
    recognition.onerror = function(event) {
        console.error("Microphone error: ", event.error);
        if (event.error === 'not-allowed') {
            alert("Akses mikrofon diblokir! Izinkan mikrofon di pengaturan browser (ikon gembok di URL).");
        }
    };

    // Kembali ke tampilan seperti semula saat mikrofon mati
    recognition.onend = function() {
        micBtn.classList.remove("text-red-500", "animate-pulse");
        if (!inputText.value) {
            inputText.placeholder = "Type something to translate...";
        }
    };



    // Mulai Mikrofon
    recognition.start();
}

/* =========================
   Autocomplete / Predictive Text.
========================= */
async function showAutocomplete() {

    const text =
        document.getElementById("inputText").value.trim();

    if(text.length < 2) return;

    const response =
        await fetch(
            `/api/autocomplete/${encodeURIComponent(text)}`
        );

    const suggestions =
        await response.json();

    const container =
        document.getElementById("autocompleteContainer");

    container.innerHTML = "";

    if(suggestions.length === 0) {

        container.classList.add("hidden");
        return;
    }

    suggestions.forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "p-3 hover:bg-slate-100 cursor-pointer";

        div.innerText = item;

        div.onclick = async () => {

    document.getElementById("inputText").value =
        item;

    container.classList.add("hidden");

    await translate();
};

        container.appendChild(div);
    });

    container.classList.remove("hidden");
} 