import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// This function runs every 15 minutes
const notificationHandler = async (_event) => {
    console.log("Running scheduled notification check...");

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
        console.error("Missing environment variables");
        return { statusCode: 500 };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find drops starting in the next 45-75 minutes that haven't been notified yet
    // We look for drops starting between 45 mins from now and 75 mins from now to catch the "1 hour before" window safely
    const now = new Date();
    const fortyFiveMinsFromNow = new Date(now.getTime() + 45 * 60000).toISOString();
    const seventyFiveMinsFromNow = new Date(now.getTime() + 75 * 60000).toISOString();

    const { data: drops, error } = await supabase
        .from("drops")
        .select("*")
        .eq("is_active", true)
        .eq("notification_sent", false)
        .gt("start_time", fortyFiveMinsFromNow)
        .lt("start_time", seventyFiveMinsFromNow);

    if (error) {
        console.error("Error fetching drops:", error);
        return { statusCode: 500 };
    }

    if (!drops || drops.length === 0) {
        console.log("No upcoming drops to notify about.");
        return { statusCode: 200 };
    }

    // 2. For each drop, send emails
    for (const drop of drops) {
        console.log(`Processing notification for drop: ${drop.name}`);

        // Get all subscribers
        // Using service key allows us to bypass RLS and read all emails
        const { data: subscribers, error: subError } = await supabase
            .from("subscriptions")
            .select("email");

        if (subError) {
            console.error("Error fetching subscribers:", subError);
            continue;
        }

        if (!subscribers || subscribers.length === 0) {
            console.log("No subscribers found.");
            continue;
        }

        // Send emails in batches (Resend recommends batching or individual calls, we'll do individual for simplicity/safety in this demo)
        // In production with many users, you'd want to use Resend's batch API or BCC
        const emails = subscribers.map(s => s.email);

        // Using BCC to send to multiple people at once without exposing emails
        // Max 50 recipients per request usually, so we chunk it
        const chunkSize = 40;
        for (let i = 0; i < emails.length; i += chunkSize) {
            const chunk = emails.slice(i, i + chunkSize);

            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                        from: "iThrifted <onboarding@resend.dev>",
                        to: ["onboarding@resend.dev"], // Send to self/dummy
                        bcc: chunk, // BCC the actual users
                        subject: `HAMAROSAN: ${drop.name} - iThrifted`,
                        html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h1>Hamarosan kezdődik!</h1>
                        <p>Szia!</p>
                        <p>A(z) <strong>${drop.name}</strong> drop 1 órán belül elérhető lesz!</p>
                        <p>Készülj, mert a legmenőbb darabok hamar elfogynak.</p>
                        <br/>
                        <a href="https://ithrifted.netlify.app" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Irány a bolt</a>
                        <br/><br/>
                        <p>Üdvözlettel,</p>
                        <p>Az iThrifted csapata</p>
                    </div>
                    `,
                    }),
                });
            } catch (err) {
                console.error("Error sending email batch:", err);
            }
        }

        // 3. Mark drop as notified
        await supabase
            .from("drops")
            .update({ notification_sent: true })
            .eq("id", drop.id);

        console.log(`Marked drop ${drop.id} as notified.`);
    }

    return { statusCode: 200 };
};

// Schedule to run every 15 minutes
export const handler = schedule("*/15 * * * *", notificationHandler);
