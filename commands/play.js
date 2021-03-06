const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const play = require("play-dl");
let trigger = 0;
let queue = [];

//player and resource initiation
const player = createAudioPlayer();

let queueEmbed = new MessageEmbed();
queueEmbed
  .setColor("#0099ff")
  .setTitle("MOOZIC QUEUE")
  .setURL("https://ucdupes.org/");

function embedCreator(oldQueue) {
  //temp embed init
  const tempEmbed = new MessageEmbed();

  //embed defaults
  tempEmbed
    .setColor("#0099ff")
    .setTitle("MOOZIC QUEUE")
    .setURL("https://ucdupes.org/");

  //creating embed based on queue
  oldQueue.forEach((element) => {
    tempEmbed.addFields({
      name: `Song **${element.song}**`,
      value: `Added by: ${element.author}`,
    });
  });

  return tempEmbed;
}
//vc join function
function vcConnect(message) {
  const connection = joinVoiceChannel({
    channelId: message.member.voice.channel.id,
    guildId: message.channel.guild.id,
    adapterCreator: message.channel.guild.voiceAdapterCreator,
  });
  return connection;
}

//player starting
function playAudio(stream) {
  let resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });
  //const resource = createAudioResource(ytdl(args, { filter: "audio" }));
  player.play(resource);
}

function validURL(str) {
  var regex =
    /(http|https):\/\/(\w+:{0,1}\w*)?(\s+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if (!regex.test(str)) {
    return false;
  } else {
    return true;
  }
}

async function audioVerifyPlayer(args) {
  console.log(args);
  if (validURL(args)) {
    playAudio(args);
  } else {
    let yt_info = await play.search(args, { limit: 1 });
    let stream = await play.stream(yt_info[0].url);
    playAudio(stream);
    // const videoFinder = async (query) => {
    //   const videoResult = await ytSearch(query);
    //   return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
    // };

    // const video = await videoFinder(args);
  }
}

function addListerners(message) {
  var connection = getVoiceConnection(message.channel.guild.id);
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log("Disconnected");
    player.removeAllListeners();
    player.stop();
    trigger = 0;
    queue = [];
  });

  connection.on(VoiceConnectionStatus.Destroyed, async () => {
    console.log("Destroyed");
    player.removeAllListeners();
    player.stop();
    trigger = 0;
    queue = [];
  });

  player.on(AudioPlayerStatus.Playing, () => {
    console.log("The audio player has started playing!");
  });

  player.on(AudioPlayerStatus.Idle, async () => {
    if (!queue.length) {
      connection.destroy();
      player.removeAllListeners();
      player.stop();
      trigger = 0;
      queue = [];
      return message.channel.send("Bot Disconnected due to empty queue");
    } else {
      //play the next song on queue
      await audioVerifyPlayer(queue[0].song);
      console.log(queue);
      message.channel.send(
        `Now playing ${queue[0].song} added by ${queue[0].author}`
      );
      //change song sequence for next time
      queue.shift();
      queueEmbed = embedCreator(queue);
    }
  });

  player.on(AudioPlayerStatus.Buffering, async () => {
    console.log("Its Buffering");
  });

  player.on("error", (error) => {
    console.log(error);
    message.channel.send("lmao bot crashed , error log is " + error);
  });
}

module.exports = {
  data: new SlashCommandBuilder().setName("play").setDescription("Plays Song"),
  async execute(message, args) {
    if (args.length) {
      //creating connection with vc and adding to queue
      if (trigger == 0) {
        var connection = vcConnect(message);

        connection.on(VoiceConnectionStatus.Ready, async () => {
          connection.subscribe(player);
          console.log(
            "The connection has entered the Ready state - ready to play audio!"
          );
          message.reply("Bot joined VC!");
        });

        //url / term checker
        audioVerifyPlayer(args.join(" "));
        addListerners(message);
        trigger++;
      } else {
        var connection = getVoiceConnection(message.channel.guild.id);
        queue.push({ song: args.join(" "), author: message.author });
        queueEmbed.addFields({
          name: `Newly Added Song : **${args.join(" ")}** `,
          value: `Added By : ${message.author}`,
        });
        message.reply({ embeds: [queueEmbed] });
      }
    }
  },
  queueEmbed,
};
