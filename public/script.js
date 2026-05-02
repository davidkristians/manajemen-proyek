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

    // Event listener saat user mengetik
    inputText.addEventListener("input", () => {
        clearTimeout(typingTimer); 
        
        if (inputText.value.trim()) {
            typingTimer = setTimeout(translate, doneTypingInterval);
        } else {
            // Kembalikan ke teks default jika input kosong
            outputText.innerText = "Translation will appear here...";
        }
    });

    // Otomatis translate ulang jika user mengganti bahasa
    document.getElementById("source").addEventListener("change", translate);
    document.getElementById("target").addEventListener("change", translate);

    // === LOGIKA API CURRENCY ===
    document.getElementById("convertBtn")?.addEventListener("click", convertCurrency);

    // // === FORMAT TITIK RIBUAN PADA INPUT CURRENCY ===
    // const amountInput = document.getElementById("amount");
    // amountInput.addEventListener("input", function () {
    //     // Hapus semua titik dulu
    //     let rawValue = this.value.replace(/\./g, "").replace(/\D/g, "");

    //     if (rawValue === "") {
    //         this.value = "";
    //         return;
    //     }

    //     // Format ulang dengan titik ribuan
    //     this.value = new Intl.NumberFormat("id-ID").format(rawValue);
    // });

    // === LOGIKA TOMBOL SUARA ===
    document.getElementById("micBtn").addEventListener("click", startDictation);
    document.getElementById("speakerBtn").addEventListener("click", speakText);
});

async function translate() {
    const text = document.getElementById("inputText").value;
    const source = document.getElementById("source").value;
    const target = document.getElementById("target").value;
    const output = document.getElementById("outputText");

    if (!text.trim()) {
        output.innerText = "Translation will appear here...";
        return;
    }


    try {
        const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, source, target })
        });

        const data = await response.json();
        output.innerText = data.translatedText || "Translation success."; 
    } catch (error) {
        output.innerText = "Error translating text. Check your internet connection.";
    }
}

async function convertCurrency() {
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