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
const moment = require("moment");

const edtApiBaseURL = new URL(
  "https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx"
);
const edtURLParams = new URLSearchParams({
  action: "posEDTBEECOME",
  serverid: "C",
  date: new Date().toLocaleDateString("en-US"),
});

const flagRegex = new RegExp(/^[-]{1,2}(?=\w)/gm);

const helpMessages = {
  edt:
    ":information_source: Options available with command `!edt`\r\n\r\n- `!edt --help` : Return this dialog\r\n- `!edt username (optionnal) date` : Return latest teams link for this username within given date (default: today)\r\n- `!edt notify` (not availble) : Ask to notify you by private message (you need to provide your username when asked)",
};

let edtApiTest =
  "https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?action=posEDTBEECOME&serverid=C&Tel=a.biranielhbak&date=05/06/2021&hashURL=e8cc7097357cd48891d5fca9d00db8ace0ecc236cd0a6e236d3268eee1efbcb3e7bbe1645dca9f2e9329a1e9798d90ffb7217ddc9c4c90ef75b36cc0a903f02b";

client.on("ready", () =>
  console.log(`Logged in as 
  ${client.user.tag}`)
);

client.on("message", async function (message) {
  const prefix = config.PREFIX;

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody
    .split(" ")
    .filter((command) => !flagRegex.test(command));
  const flags = commandBody
    .split(" ")
    .filter((command) => !args.includes(command));
  const command = args.shift().toLowerCase();
  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }

  if (command === "edt") {
    if (flags.indexOf("--help") >= 0) {
      return message.reply(helpMessages.edt);
    }
    if (flags.indexOf("--test") >= 0) {
      const edtResponse = await fetchLink(edtApiTest, 0, 5, true);
      return message.reply(edtResponse, {
        split: true,
      });
    }
    let verbose = flags.indexOf("--verbose") >= 0 ? true : false;
    let [edtUser, edtDate] = args;
    if (!edtUser) {
      return message.reply(
        `Un nom d'utilisateur doit être fournis pour accéder à votre emploie du temps !\r\nSi vous avez besoin d'aide, utiliser la commande \`!edt --help\` pour voir toutes les options disponibles.`
      );
    }
    let edtParams = edtURLParams;
    let formatedDate;
    edtParams.set("Tel", edtUser);
    if (edtDate) {
      formatedDate = new Date(edtDate);
      formatedDate.setHours(0, 0, 0, 0);
      if (moment(edtDate, "MM/DD/YYYY", true).isValid()) {
        edtParams.set("date", formatedDate.toLocaleDateString("en-US"));
      } else {
        return message.reply(
          `Mauvais format de date. Format attendu : MM/DD/YYYY`
        );
      }
    }

    const edtResponse = await fetchLink(
      `${edtApiBaseURL.href}?${edtURLParams.toString()}`,
      verbose,
      formatedDate
    );
    return message.reply(edtResponse, {
      split: {
        append: " ...",
      },
    });
  }
});

client.login(config.BOT_TOKEN);

/**
 * @param {string} edtLink
 * @param {boolean} verbose
 * @param {Date} date
 * @param {number} retryCount
 * @param {number} maxCount
 * @returns {Promise<string>}
 */
async function fetchLink(
  edtLink,
  verbose = false,
  date = null,
  retryCount = 0,
  maxCount = 5
) {
  const { link, count } = await getEDTLink(edtLink);

  if (!link) {
    return ":four: :zero: :four: No link found";
  }
  const validDate = date ? date : new Date();
  validDate.setHours(0, 0, 0, 0);
  const url = new URL(link);
  const linkDate = new Date(url.searchParams.get("date"));
  linkDate.setHours(0, 0, 0, 0);

  if (linkDate >= date) {
    const linkDetails = `${count} liens trouvées. :construction_worker:\r\n`;
    return `${verbose ? linkDetails : ""}Lien : ${link}`;
  } else {
    if (retryCount < maxCount) {
      console.log(
        `Link not valid, retrying... (${retryCount + 1} attemp of ${maxCount})`
      );
      return fetchLink(edtLink, verbose, retryCount + 1, maxCount);
    } else {
      return verbose
        ? `:warning: Error : Failed to fetch link for ${date.toLocaleDateString(
            "en-US"
          )}, total attemps : ${retryCount}. Edt link : ${edtLink}`
        : "No valid link found :scream:";
    }
  }
}
async function getEDTLink(edtLink) {
  /* EDT Process */
  const edtApiResponse = await axios.get(edtLink);
  const edtBody = edtApiResponse.data;
  const $ = cheerio.load(edtBody);

  const allLinks = $("div.Teams a:first-child");

  const link = allLinks.last().attr("href");

  console.log(`link found : `, link);

  return { link, count: allLinks.length };
}
