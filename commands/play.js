const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
let trigger = 0;
let queue = [];
//player and resource initiation
const player = createAudioPlayer();

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
function playAudio(args) {
  const resource = createAudioResource(ytdl(args, { filter: "audio" }));
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
    const videoFinder = async (query) => {
      const videoResult = await ytSearch(query);
      return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
    };

    const video = await videoFinder(args);
    playAudio(video.url);
  }
}

function addListerners(message) {
  var connection = getVoiceConnection(message.channel.guild.id);
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log("Disconnected");
    player.removeAllListeners();
    player.stop();
    trigger = 0;
  });

  connection.on(VoiceConnectionStatus.Destroyed, async () => {
    console.log("Destroyed");
    player.removeAllListeners();
    player.stop();
    trigger = 0;
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
      return message.channel.send("Bot Disconnected due to empty queue");
    } else {
      console.log("player idle" + queue);
      //play the next song on queue
      await audioVerifyPlayer(queue[0]);
      message.channel.send("Now Playing " + queue[0]);
      //change song sequence for next time
      queue.shift();
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
        queue.push(args.join(" "));
        console.log(queue);
        message.channel.send(
          "song has been added to the queue, current queue is " + queue
        );
      }
    }
  },
};
