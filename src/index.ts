import {
  ActivityType,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Client,
  CommandInteraction,
  Interaction,
} from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import ora from "ora";
import { Command } from "./utils/command";

dotenv.config();

const setstatus: Command = {
  name: "setstatus",
  description: "set your status on omg.lol!",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "address",
      description: "your omg.lol address",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "status",
      description: "your status",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "emoji",
      description: "the emoji to use",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "api_key",
      description: "your omg.lol api key (this isn't stored!)",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const status = interaction.options.get("status", true).value?.toString();
    const emoji = interaction.options.get("emoji", true).value?.toString();
    const apiKey = interaction.options.get("api_key", true).value?.toString();
    const address = interaction.options.get("address", true).value?.toString();

    const res = await fetch(`https://api.omg.lol/address/${address}/statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey ?? "",
      },
      body: JSON.stringify({
        content: status ?? "",
        emoji: emoji ?? "",
      }),
    });
    const resjson = (await res.json()) as {
      response: {
        message: string;
        id: string;
        url: string;
      };
    };

    if (res.status === 200) {
      interaction.reply({
        content: "status set! " + resjson?.response.url,
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: "error setting status! " + res.status,
        ephemeral: true,
      });
    }
  },
};

const Commands: Command[] = [setstatus];

export enum Colors {
  RED = 0xff8f8f,
  GREEN = 0x8fff94,
}

const client = new Client({
  intents: [],
});

client.once("ready", async () => {
  if (!client.user || !client.application) return;

  client.user.setStatus("idle");
  client.user.setActivity("getting ready...", { type: ActivityType.Competing });

  const applicationsSpinner = ora("setting application commands...").start();
  // ** GLOBAL COMMANDS ** //
  await client.application.commands.set(Commands);

  //   // ** TEMP SERVER COMMANDS ** //
  //   await client.guilds.cache
  //     .find((g) => g.id === "1008526603753635901")
  //     ?.commands.set([]);

  applicationsSpinner.stopAndPersist({
    symbol: "✅",
    text: "application commands set",
  });

  console.log("online+ready :^)");

  const presenceSpinner = ora("setting presence...").start();
  client.user.setStatus("online");
  client.user.setActivity("with statuses!", { type: ActivityType.Playing });
  presenceSpinner.stopAndPersist({ symbol: "✅", text: "presence set" });
});

const handleSlashCommand = async (
  client: Client,
  interaction: CommandInteraction
): Promise<void> => {
  const slashCommand = Commands.find((c) => c.name === interaction.commandName);
  if (!slashCommand) {
    interaction.followUp({ content: "An error has occurred" });
    return;
  }

  slashCommand.run(client, interaction);
};

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isCommand() || interaction.isContextMenuCommand()) {
    await handleSlashCommand(client, interaction);
  }
});

client.login(process.env.TOKEN);
