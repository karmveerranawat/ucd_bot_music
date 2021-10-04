const { SlashCommandBuilder } = require("@discordjs/builders");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop Music If playing"),
  async execute(message, args) {
    var connection = getVoiceConnection(message.channel.guild.id);
    if (connection == null)
      return message.reply("No connections at the moment to stop !");
    try {
      connection.destroy();
    } catch (e) {
      console.log("Can not stop music cuz " + e);
    }
  },
};
