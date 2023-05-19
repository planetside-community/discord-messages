export const discordFetch = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`https://discord.com/api/v10${url}`, {
    ...(options || {}),
    headers: {
      ...(options.headers || {}),
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      `Discord API returned ${response.status} ${response.statusText}`
    );
    console.error(await response.text());
    throw new Error("Discord API returned an error");
  }

  return response.json();
};

export type DiscordMessage = {
  id: string;
  content: string;
};
