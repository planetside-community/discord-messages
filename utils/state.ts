import { DiscordMessage, discordFetch } from "./discord";

export const createState = async (stateChannelID: string) => {
  if (!process.env.ALLOW_NEW_STATE) {
    throw new Error("ALLOW_NEW_STATE is not set, refusing to continue.");
  }

  const response: DiscordMessage = await discordFetch(
    `/channels/${stateChannelID}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content: "null",
      }),
    }
  );

  console.info(`=== CREATED NEW STATE MESSAGE ===`);
  console.info(`MESSGAE ID: ${response.id}`);

  return response.id;
};

export const getState = async <StateT>(
  stateChannelID: string,
  messageID: string,
  preventCreate = false
): Promise<{ state: StateT | null; messageID: string }> => {
  if (!messageID) {
    if (preventCreate) {
      return { state: null, messageID: "" };
    }

    messageID = await createState(stateChannelID);
  }

  const response: DiscordMessage = await discordFetch(
    `/channels/${stateChannelID}/messages/${messageID}`
  );

  return { state: JSON.parse(response.content) || null, messageID };
};

export const writeState = async <StateT>(
  stateChannelID: string,
  messageID: string,
  state: StateT
) => {
  const { state: originalState }: { state: StateT | null } = await getState(
    stateChannelID,
    messageID,
    true
  );

  if (JSON.stringify(originalState) === JSON.stringify(state)) {
    console.info("=== STATE UNCHANGED, SKIPPING WRITE ===");
    return;
  }

  await discordFetch(`/channels/${stateChannelID}/messages/${messageID}`, {
    method: "PATCH",
    body: JSON.stringify({
      content: JSON.stringify(state),
    }),
  });

  console.info("=== STATE UPDATED ===");
};
