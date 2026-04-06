async function translate() {
    const text = document.getElementById("inputText").value;
    const source = document.getElementById("source").value;
    const target = document.getElementById("target").value;

    const output = document.getElementById("outputText");
    output.innerText = "Translating...";

    try {
        const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, source, target })
        });

        const data = await response.json();
        output.innerText = data.translatedText;
    } catch (error) {
        output.innerText = "Error translating text";
    }
}

async function convertCurrency() {
    const amount = document.getElementById("amount").value;
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;

    const response = await fetch(`/currency/${amount}/${from}/${to}`);
    const data = await response.json();

    document.getElementById("currencyResult").innerText =
        `${amount} ${from} = ${data.result} ${to}`;
}
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("translateBtn")
        .addEventListener("click", translate);

    document.getElementById("convertBtn")
        ?.addEventListener("click", convertCurrency);
});