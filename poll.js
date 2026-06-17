const TOKEN = "8901601263:AAH2Pp2UYEMfXv7aqvwzvEonmaCEovSRpx0";
const APP_URL = "http://editor.147.45.68.190.sslip.io";
let offset = 0;

async function poll() {
  try {
    const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      console.error("API error:", data);
      setTimeout(poll, 5000);
      return;
    }

    console.log(`Got ${data.result.length} updates, offset: ${offset}`);

    for (const update of data.result) {
      offset = update.update_id + 1;

      if (update.message) {
        const msg = update.message;
        console.log(`Message from ${msg.from.first_name}: ${msg.text}`);

        if (msg.text === "/start") {
          const chatId = msg.chat.id;
          const firstName = msg.from.first_name;
          const lastName = msg.from.last_name || "";
          const username = msg.from.username || "";
          const telegramId = msg.from.id;

          const webAppUrl = `${APP_URL}/auth?tg_id=${telegramId}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&username=${encodeURIComponent(username)}`;

          console.log(`Sending login button to ${chatId}, web_app: ${webAppUrl}`);

          const sendRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `Привет, ${firstName}! Нажми кнопку для входа.`,
              reply_markup: {
                inline_keyboard: [[{
                  text: `Войти как ${firstName}`,
                  web_app: { url: webAppUrl }
                }]]
              }
            })
          });

          const sendData = await sendRes.json();
          console.log("Send result:", JSON.stringify(sendData));
        }
      }
    }
  } catch (e) {
    console.error("Poll error:", e.message);
  }

  setTimeout(poll, 100);
}

console.log("Starting poll...");
poll();
