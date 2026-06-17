const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8901601263:AAH2Pp2UYEMfXv7aqvwzvEonmaCEovSRpx0";
const APP_URL = "http://editor.147.45.68.190.sslip.io";
let offset = 0;

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    if (!data.ok) return;

    for (const update of data.result) {
      offset = update.update_id + 1;
      if (update.message?.text === "/start") {
        const chatId = update.message.chat.id;
        const firstName = update.message.from.first_name;
        const lastName = update.message.from.last_name || "";
        const username = update.message.from.username || "";
        const telegramId = update.message.from.id;

        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `Привет, ${firstName}! Нажми кнопку для входа.`,
            reply_markup: {
              inline_keyboard: [[{
                text: `Войти как ${firstName}`,
                web_app: { url: `${APP_URL}/auth?tg_id=${telegramId}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&username=${encodeURIComponent(username)}` }
              }]]
            }
          })
        });
      }
    }
  } catch (e) {}
  setTimeout(poll, 100);
}

console.log("Telegram bot polling started...");
poll();
