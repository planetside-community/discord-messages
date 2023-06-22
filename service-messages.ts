import { parse as parseYAML } from "yaml";
import { getState, writeState } from "./utils/state";
import { DiscordMessage, discordFetch } from "./utils/discord";
import { sleep } from "bun";
import { glob } from "glob";

const stateChannelID = process.env.STATE_CHANNEL_ID;
if (!stateChannelID) {
  throw new Error("STATE_CHANNEL_ID is not set");
}

type State = {
  // (m)essages: { ...: { (c)hannelID, (k)nownMessageIDs } }
  m: { [messageFile: string]: { c: string; k: { i: string }[] } };
};

type ServiceMessage = { text: string; pin?: boolean };

type ServiceMessageFile = {
  channelID: string;
  messages: ServiceMessage[];
};

let { state, messageID } = await getState<State>(
  stateChannelID,
  process.env.SVCMSG_STATE || ""
);

// Setup defaults...
state = {
  m: {},
  ...state,
};

const messageFiles = process.argv[2]
  ? [process.argv[2]]
  : await glob("service-messages/**/*.yaml");

try {
  for (const messageFile of messageFiles) {
    const key =
      messageFile.split("/").pop()?.replace(".yaml", "") || messageFile;
    const file = Bun.file(messageFile);
    const fileContents = await file.text();
    const data: ServiceMessageFile = parseYAML(fileContents);

    console.info(`=== PROCESSING ${messageFile} ===`);

    state.m[key] = state.m[key] || { c: data.channelID, k: [] };

    if (state.m[key].c !== data.channelID) {
      console.info(`=> CHANNEL CHANGED, RESETTING STATE`);
      console.info(
        "I don't clean up old messages, so you'll have to do that manually."
      );
      state.m[key] = { c: data.channelID, k: [] };
    }

    let knownMessageIDs = state.m[key].k;

    for (const [idx, message] of data.messages.entries()) {
      await sleep(2000);

      if (knownMessageIDs[idx]?.i) {
        const messageID = knownMessageIDs[idx].i;
        // Pull current message
        const response: DiscordMessage = await discordFetch(
          `/channels/${data.channelID}/messages/${messageID}`
        );

        if (response.content === message.text) {
          console.info(`=> MESSAGE ${idx + 1} UNCHANGED, SKIPPING`);
          continue;
        }

        console.info(`=> UPDATING MESSAGE ${idx + 1}`);
        await discordFetch(
          `/channels/${data.channelID}/messages/${messageID}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              content: message.text,
            }),
          }
        );
        continue;
      }

      console.info(`=> SENDING MESSAGE ${idx + 1}`);
      const response: DiscordMessage = await discordFetch(
        `/channels/${data.channelID}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content: message.text,
          }),
        }
      );

      knownMessageIDs[idx] = { i: response.id };
    }
  }
} finally {
  await writeState(stateChannelID, messageID, state);
}
