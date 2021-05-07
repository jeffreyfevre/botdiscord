/**
 * @author : Jeffrey Fèvre, Amine Birani
 */

const dotenv = require("dotenv");
dotenv.config({ path: `.env.local` });
const Discord = require("discord.js");
const config = require("./config");
const client = new Discord.Client();
const axios = require("axios");
const cheerio = require("cheerio");
var cron = require('node-cron');
client.login(config.BOT_TOKEN).then(() => {
  console.log("Bot connecté !");
});
console.log(JSON.stringify(client));

let edtApiEndpoint =
  "https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?action=posEDTBEECOME&serverid=C&Tel=a.biranielhbak&date=05/06/2021&hashURL=e8cc7097357cd48891d5fca9d00db8ace0ecc236cd0a6e236d3268eee1efbcb3e7bbe1645dca9f2e9329a1e9798d90ffb7217ddc9c4c90ef75b36cc0a903f02b";
/* let edtApiEndpoint =
  "https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?action=posEDTBEECOME&serverid=C&Tel=jeffrey.fevre&date=05/06/2021&hashURL=f12bc7a9ff71af4dd7294ff941d3c5cd8eaca414ca422c12acf3d7cfde77a6544a49a0491e5365e78828502dfaf33aa511cc201821fc21921870efb32c54c50d"; */

let edtSave;

cron.schedule('* * * * *', async () => {
  console.log('running every minute 1, 2, 4 and 5');


  let date = new Date();
  let heure = date.getHours();
  let min = date.getMinutes();
  let edtResponse;
  if (heure == "8"&& min == "16" || heure == "13" && min == "16")
  {
    edtResponse = await fetchLink();
  }

  if (edtResponse != edtSave)
  {
    const channel = client.channels.cache.get("828897751844257795");
      channel.send(edtResponse);
  }

});

client.on("message", async function (message) {
  const prefix = "!";

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(" ");
  const command = args.shift().toLowerCase();
  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }

  if (command === "edt") {
    const edtResponse = await fetchLink();
    message.reply(edtResponse, {
      split: {
        append: " ...",
      },
    });
  }
});


client.on('ready', () => {
  console.log(client.channels);
  client.channels.fetch("828897751844257795")
});
console.log(JSON.stringify(client.channels))
/**
 *
 * @param {number} retryCount
 * @param {number} maxCount
 * @returns {Promise<string>}
 */
async function fetchLink(retryCount = 0, maxCount = 5) {
  const { link, count } = await getEDTLink();

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const url = new URL(link);
  const linkDate = new Date(url.searchParams.get("date"));
  linkDate.setHours(0, 0, 0, 0);

  if (linkDate >= date) {
    return `${count} liens trouvées. :construction_worker:\r\nLien : ${link}`;
  } else {
    if (retryCount < maxCount) {
      console.log(
        `Link not valid, retrying... (${retryCount} attemp of ${maxCount})`
      );
      return fetchLink(retryCount + 1, maxCount);
    } else {
      return `Error : Failed to fetch link for ${date.toLocaleDateString()}, total attemps : ${retryCount}.`;
    }
  }
}
async function getEDTLink() {
  /* EDT Process */
  const edtApiResponse = await axios.get(edtApiEndpoint);
  const edtBody = edtApiResponse.data;
  const $ = cheerio.load(edtBody);
  const allLinks = $("div.Teams a:first-child");
  console.log(allLinks);
  const link = allLinks.last().attr("href");
  console.log(`link found : `, link);
  return { link, count: allLinks.length };
}
