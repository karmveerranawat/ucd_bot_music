const { SlashCommandBuilder } = require("@discordjs/builders");
const { queueEmbed } = require("./play");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Displays Queue"),
  async execute(message) {
    message.reply({ embeds: [queueEmbed] });
  },
};
