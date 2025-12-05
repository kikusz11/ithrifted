import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: "Missing Resend API Key" };
    }

    try {
        const { email } = JSON.parse(event.body || "{}");

        if (!email) {
            return { statusCode: 400, body: "Email is required" };
        }

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: "iThrifted <onboarding@resend.dev>", // Default Resend sender for testing
                to: [email],
                subject: "Feliratkozás megerősítése - iThrifted",
                html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1>Sikeres feliratkozás!</h1>
            <p>Szia!</p>
            <p>Köszönjük, hogy feliratkoztál az iThrifted értesítéseire. Értesíteni fogunk, amint megérkezik a következő drop!</p>
            <br/>
            <p>Üdvözlettel,</p>
            <p>Az iThrifted csapata</p>
          </div>
        `,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Resend API Error:", errorData);
            return { statusCode: response.status, body: JSON.stringify(errorData) };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Email sent successfully", data }),
        };
    } catch (error) {
        console.error("Function Error:", error);
        return { statusCode: 500, body: "Internal Server Error" };
    }
};
