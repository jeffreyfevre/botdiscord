
const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();
const axios = require('axios');
let test;

let uribrut ="https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?action=posEDTBEECOME&serverid=C&Tel=jeffrey.fevre&date=05/06/2021&hashURL=f12bc7a9ff71af4dd7294ff941d3c5cd8eaca414ca422c12acf3d7cfde77a6544a49a0491e5365e78828502dfaf33aa511cc201821fc21921870efb32c54c50d";
/*const request = require('request');
request('https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?action=posEDTBEECOME&serverid=C&Tel=jeffrey.fevre&date=05/06/2021&hashURL=f12bc7a9ff71af4dd7294ff941d3c5cd8eaca414ca422c12acf3d7cfde77a6544a49a0491e5365e78828502dfaf33aa511cc201821fc21921870efb32c54c50d', function (error, response, body) {
    console.error('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
});*/

client.on("message", function(message) {

    console.log("un message");
    const prefix = "!";
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    let test2 = makeRequest(uribrut)
    console.log(test2);
    console.log(message);
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        console.log()
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }

});

client.login(config.BOT_TOKEN);


async function makeRequest(url) {

    const config = {
        method: 'get',
        url: url
    }

    let res = await axios(config)
    console.log(res.data);
   return res.data;
}
