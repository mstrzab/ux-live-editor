const TOKEN = "8901601263:AAH2Pp2UYEMfXv7aqvwzvEonmaCEovSRpx0";
const APP_URL = "http://editor.147.45.68.190.sslip.io";
let offset = 0;

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    if (!data.ok) {
      console.error("API error:", data);
      setTimeout(poll, 5000);
      return;
    }

    for (const update of data.result) {
      offset = update.update_id + 1;

      if (update.message) {
        const msg = update.message;
        console.log(`Message from ${msg.from.first_name}: ${msg.text}`);

        if (msg.text === "/start") {
          const chatId = msg.chat.id;
          const firstName = msg.from.first_name;

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `Привет, ${firstName}! Открой редактор и войди через Telegram.`,
              reply_markup: {
                inline_keyboard: [[{
                  text: "Открыть UX Live Editor",
                  url: APP_URL
                }]]
              }
            })
          });

          console.log(`Sent link to ${chatId}`);
        }
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }

  setTimeout(poll, 100);
}

console.log("Polling started...");
poll();
