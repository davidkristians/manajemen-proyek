const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   TRANSLATE API
========================= */
app.post("/api/translate", async (req, res) => {
    try {
        const { text, source, target } = req.body;

        const response = await fetch("http://127.0.0.1:5000/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: text,
                source: source,
                target: target,
                format: "text"
            })
        });

        const data = await response.json();

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Translation failed" });
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
            return res.status(400).json({ error: "Invalid amount" });
        }

        const response = await axios.get(
            `https://open.er-api.com/v6/latest/${from}`,
            { timeout: 5000 }
        );

        const rate = response.data?.rates?.[to];

        if (!rate) {
            return res.status(400).json({ error: "Invalid currency code" });
        }

        const result = amount * rate;

        const formatted = new Intl.NumberFormat("id-ID").format(Math.round(result));

        res.json({ result: formatted });

    } catch (error) {
        console.error("Currency error:", error.message);
        res.status(500).json({ error: "Currency conversion failed" });
    }
});

/* =========================
   SIMPLE UNIT CONVERTER
========================= */
app.post("/convert-unit", (req, res) => {
    const { value, unit } = req.body;

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        return res.status(400).json({ error: "Invalid value" });
    }

    let result;

    switch (unit) {
        case "feet":
            result = numValue * 30.48; // feet → cm
            break;
        case "kg":
            result = numValue * 2.20462; // kg → lbs
            break;
        case "c":
            result = (numValue * 9) / 5 + 32; // Celsius → Fahrenheit
            break;
        default:
            return res.status(400).json({ error: "Invalid unit type" });
    }

    res.json({ result: result.toFixed(2) });
});
/*Uncaught (in promise) Error:
A listener indicated an asynchronous response by returning true,
but the message channel closed before a response was received */

app.get("/currency/:amount/:from/:to", async (req, res) => {
    try {
        const { amount, from, to } = req.params;

        // pakai API gratis exchangerate.host (tidak perlu API key)
        const response = await fetch(
            `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`
        );

        const data = await response.json();

        res.json({ result: data.result });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Currency conversion failed" });
    }
});
/* =========================
   SERVER START
========================= */
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});