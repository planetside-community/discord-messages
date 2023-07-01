export const environment: "production" | "staging" =
  process.env.ENVIRONMENT === "production" ? "production" : "staging";

export const guideChannelID = {
  production: "1109555207710457976",
  staging: "1121544143093633044",
}[environment];

export const usefulGuidesState = {
  production: `${import.meta.dir}/../state/production/useful-guides.json`,
  staging: `${import.meta.dir}/../state/staging/useful-guides.json`,
}[environment];

export const serviceMessagesState = {
  production: `${import.meta.dir}/../state/production/service-messages.json`,
  staging: `${import.meta.dir}/../state/staging/service-messages.json`,
}[environment];

export const serviceMessageChannel = (productionChannel: string) => {
  if (environment !== "production") {
    return "1108928162118766633";
  }

  return productionChannel;
};

export const shouldSkip = (skip?: boolean) => {
  return skip && environment === "production";
};
