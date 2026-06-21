const express = require("express");
const axios = require("axios");
const cors = require("cors");
const natural = require("natural");
const fs = require("fs");

require("dotenv").config();

const app = express();

const sentenceSuggestions =
    JSON.parse(
        fs.readFileSync("./examples.json", "utf8")
    );

const dictionary =
    JSON.parse(
        fs.readFileSync("./dictionary.json", "utf8")
    );

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let translateHistory = [];
let favoriteTranslations = [];
/* =========================
   AMBIL HISTORY
========================= */
app.get("/api/history", (req, res) => {
    res.json(translateHistory);
});

/* =========================
   AMBIL FAVORITE
========================= */
app.get("/api/favorites", (req, res) => {

    res.json(favoriteTranslations);

});

/* =========================
   TRANSLATE API
========================= */
app.post("/api/translate", async (req, res) => {
    try {

        const { text, source, target } = req.body;

        // VALIDASI INPUT
        if (!text || text.trim() === "") {
            return res.status(400).json({
                error: "Text is required"
            });
        }

        // GOOGLE TRANSLATE API GRATIS
        const url =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);

        const data = await response.json();

        // SUPPORT KALIMAT / PARAGRAF
        let translatedText = "";

        if (Array.isArray(data[0])) {

            translatedText = data[0]
                .map(item => item[0])
                .join("");
        }
/* DELETE TRANSLATE API*/
        app.delete("/api/favorites/:index", (req, res) => {

    const index =
        parseInt(req.params.index);

    if (
        index >= 0 &&
        index < favoriteTranslations.length
    ) {

        favoriteTranslations.splice(index, 1);
    }

    res.json({
        success: true
    });
});

        // SIMPAN HISTORY
// SIMPAN HISTORY HANYA JIKA VALID
if (
    translatedText &&
    translatedText.trim() !== "" &&
    translatedText !== text &&
    source !== target
) {

    translateHistory.unshift({
        original: text,
        translated: translatedText,
        source: source,
        target: target,
        createdAt: new Date()
    });

    // MAKSIMAL 10 HISTORY
    if (translateHistory.length > 10) {
        translateHistory.pop();
    }
}

        // KIRIM KE FRONTEND
        res.json({
            translatedText: translatedText
        });

    } catch (error) {

        console.error("Translate error:", error);

        res.status(500).json({
            error: "Translation failed"
        });
    }
});

/* =========================
   CURRENCY API
========================= */
app.get("/currency/:amount/:from/:to", async (req, res) => {

    try {

        let { amount, from, to } = req.params;

        amount = parseFloat(amount);

        from = from.toUpperCase();
        to = to.toUpperCase();

        if (isNaN(amount)) {

            return res.status(400).json({
                error: "Invalid amount"
            });
        }

        const response = await axios.get(
            `https://open.er-api.com/v6/latest/${from}`,
            {
                timeout: 5000
            }
        );

        const rate = response.data?.rates?.[to];

        if (!rate) {

            return res.status(400).json({
                error: "Invalid currency code"
            });
        }

        const result = amount * rate;

        const formatted = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5
        }).format(result);

        res.json({
            result: formatted
        });

    } catch (error) {

        console.error("Currency error:", error.message);

        res.status(500).json({
            error: "Currency conversion failed"
        });
    }
});

/* =========================
   FAVORITE API
========================= */
app.post("/api/favorites", (req, res) => {

    const {
        original,
        translated,
        source,
        target
    } = req.body;

    favoriteTranslations.unshift({
        original,
        translated,
        source,
        target,
        createdAt: new Date()
    });

    res.json({
        success: true
    });

});

/* =========================
   SIMPLE UNIT CONVERTER
========================= */
app.post("/convert-unit", (req, res) => {

    const { value, unit } = req.body;

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {

        return res.status(400).json({
            error: "Invalid value"
        });
    }

    let result;

    switch (unit) {

        case "feet":
            result = numValue * 30.48;
            break;

        case "kg":
            result = numValue * 2.20462;
            break;

        case "c":
            result = (numValue * 9) / 5 + 32;
            break;

        default:

            return res.status(400).json({
                error: "Invalid unit type"
            });
    }

    res.json({
        result: result.toFixed(2)
    });
});

/* =========================
   Autocomplete / Predictive Text.
========================= */
app.get("/api/autocomplete/:word", (req, res) => {

    const word =
        req.params.word.toLowerCase();

    const suggestions =
        sentenceSuggestions
            .filter(sentence =>
                sentence.toLowerCase().startsWith(word)
            )
            .slice(0, 5);

    res.json(suggestions);
});


/* =========================
   EXAMPLE SENTENCES API
========================= */

app.get("/api/suggestions", (req, res) => {

    const randomSuggestions =
        sentenceSuggestions
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

    res.json(randomSuggestions);
});

app.get("/api/examples/:word", (req, res) => {

    const word =
        req.params.word.toLowerCase();

    const examples =
        sentenceSuggestions.filter(sentence =>
            sentence.toLowerCase().includes(word)
        );

    res.json(
        examples.slice(0, 5)
    );
});

/* =========================
   Corect
========================= */
app.get("/api/spellcheck/:word", (req, res) => {

    const word = req.params.word.toLowerCase();

    let bestMatch = word;
    let bestScore = Infinity;

    dictionary.forEach(item => {

        const score =
            natural.LevenshteinDistance(
                word,
                item.toLowerCase()
            );

        if (score < bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    });

    // hanya koreksi jika cukup mirip
    const maxDistance =
        Math.max(
            1,
            Math.floor(word.length * 0.4)
        );

    res.json({
    original: word,
    corrected:
        bestScore <= 2
            ? bestMatch
            : word
    });
});


/* =========================
   SERVER START
========================= */
app.listen(3000, () => {

    console.log("🚀 Server running on http://localhost:3000");
});

