const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// 📂 Charger les commandes automatiquement
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// 🧠 Anti-spam system
const spamMap = new Map();

// 📢 Fonction logs (salon #logs)
function log(guild, message) {
  const channel = guild.channels.cache.find(c => c.name === "logs");
  if (channel) channel.send(message);
}

client.once("ready", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

// 💬 Messages
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/g);
  const commandName = args.shift().toLowerCase();

  // 🧠 ANTI-SPAM
  const now = Date.now();
  const userId = message.author.id;

  if (!spamMap.has(userId)) spamMap.set(userId, []);

  const timestamps = spamMap.get(userId);
  timestamps.push(now);

  const recent = timestamps.filter(t => now - t < 4000);
  spamMap.set(userId, recent);

  if (recent.length > 5) {
    message.delete().catch(() => {});
    message.channel.send(`⚠️ ${message.author} spam détecté !`);

    log(message.guild, `🚨 Spam supprimé : ${message.author.tag}`);
    return;
  }

  // 📦 Commandes
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    command.execute(message, args, log);
  } catch (err) {
    console.error(err);
    message.reply("❌ Erreur commande");
  }
});

client.login("TON_TOKEN_ICI");
