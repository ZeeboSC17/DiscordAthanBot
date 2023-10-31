const { Client, Events, GatewayIntentBits, SlashCommandBuilder, VoiceChannel, VoiceState } = require('discord.js')
const { joinVoiceChannel, createAudioPlayer, adapterCreator, voiceAdapterCreator, createAudioResource, StreamType } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');
const { join } = require('node:path');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
var city = 'Toronto'
var country = 'Canada'
var method = 2


client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user.tag}`);

  const ping = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with "pong"')


  client.application.commands.create(ping)

  const prayertimes = new SlashCommandBuilder()
    .setName('prayertimes')
    .setDescription('Prayer times for a location')

  client.application.commands.create(prayertimes)

  const set = new SlashCommandBuilder()
    .setName('set')
    .setDescription('Set the city, country and calculation method.')
    .addStringOption(option =>
      option.setName('city')
        .setDescription('City')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('country')
        .setDescription('Country')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('method')
        .setDescription('Method')
        .setRequired(true));

  client.application.commands.create(set)

  const run = new SlashCommandBuilder()
    .setName('adhan')
    .setDescription('Adhan')
    .addChannelOption(option =>
      option.setName('voicechannel')
        .setDescription('Select a voice channel')
        .setRequired(true));

  client.application.commands.create(run)


})

client.on(Events.InteractionCreate, interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ping") {
    interaction.reply("pong");
  }

  if (interaction.commandName === "adhan") {
    interaction.reply("Adhan is now playing.");

    const voiceChannel = interaction.options.getChannel('voicechannel')
    const gID = interaction.guildId;
    const vAdapter = voiceChannel.guild.voiceAdapterCreator;
    // const v = interaction.guild.voiceAdapterCreator;
    console.log(voiceChannel.id)
    console.log(gID)
    console.log(vAdapter)


    // Create a voice connection
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,               // The ID of the target voice channel
      guildId: gID,           // The ID of the guild to which the voice channel belongs
      adapterCreator: vAdapter,
      selfDeaf: false,
    });
    // console.log(connection)
    console.log('-------------------------------------------------')
    // connection.destroy();
    // console.log(connection)

    const player = createAudioPlayer();
    const resource = createAudioResource('adhan.mp3');
    player.play(resource);

    // Play "track.mp3" across two voice connections
    connection.subscribe(player);

  }

  if (interaction.commandName === "prayertimes") {
    citycountry('Toronto', 'Canada', interaction);
    // interaction.reply("pong");

  }

  const { options } = interaction;
  const cityN = options.getString('city');
  const countryN = options.getString('country');
  const methodN = options.getString('method');

  if (interaction.commandName === "set") {
    city = cityN
    country = countryN
    method = methodN
    interaction.reply(`City set to: ${cityN} \nCountry set to: ${countryN} \nMethod set to: ${methodN}`)
  }



})


client.login('MTE2ODQ3OTU0MjYwODkzMjg5NA.Gq42WO.L4-gfRHo1hO1l48KZ5wjwjrqmVJ-jHHDD0dpIU');



function citycountry(cityReq, countryReq, interaction) {

  const url = `http://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const prayerTimes = data.data;
      displayPrayerTimes(prayerTimes, interaction);
    })
    .catch(error => console.error(error));
}


function displayPrayerTimes(prayerTimes, interaction) {
  const convertedPrayerTimes = {
    Fajr: convertTo12HourClock(prayerTimes.timings.Fajr),
    Sunrise: convertTo12HourClock(prayerTimes.timings.Sunrise),
    Dhuhr: convertTo12HourClock(prayerTimes.timings.Dhuhr),
    Asr: convertTo12HourClock(prayerTimes.timings.Asr),
    Maghrib: convertTo12HourClock(prayerTimes.timings.Maghrib),
    Isha: convertTo12HourClock(prayerTimes.timings.Isha)
  };

  interaction.reply(`Fajr: ${convertedPrayerTimes.Fajr} \nSunrise: ${convertedPrayerTimes.Sunrise} \nDhuhr: ${convertedPrayerTimes.Dhuhr} \nAsr: ${convertedPrayerTimes.Asr} \nMaghrib: ${convertedPrayerTimes.Maghrib} \nIsha: ${convertedPrayerTimes.Isha}`)
}

function convertTo12HourClock(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = (hour % 12) || 12;
  const time12 = `${hour12}:${minutes} ${period}`;
  return time12;
}

