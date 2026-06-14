const KNOWN_CHANNEL_TEXT_KEYS = new Set([
  "cash",
  "bank",
  "mada",
  "apple",
  "jahez",
  "hunger",
  "card",
  "online",
]);

const CHANNEL_ALIAS_TO_TEXT_KEY = {
  cash: "cash",
  bank: "bank",
  mada: "mada",
  apple: "apple",
  "apple pay": "apple",
  jahez: "jahez",
  hunger: "hunger",
  hungerstation: "hunger",
  card: "card",
  online: "online",
  نقد: "cash",
  نقدي: "cash",
  بنك: "bank",
  حساب: "bank",
  مدى: "mada",
  جاهز: "jahez",
  هنقرستيشن: "hunger",
};

function normalizeChannelAlias(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function resolveAliasTextKey(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return CHANNEL_ALIAS_TO_TEXT_KEY[trimmed]
    || CHANNEL_ALIAS_TO_TEXT_KEY[normalizeChannelAlias(trimmed)]
    || "";
}

/**
 * Resolve a built-in sales channel copy key (cash, bank, mada, …) from channel metadata.
 * @param {Record<string, unknown> | null | undefined} channel
 */
export function resolveSalesChannelTextKey(channel) {
  if (!channel || typeof channel !== "object") return "";

  if (channel.custom !== true && typeof channel.text === "string" && channel.text.trim()) {
    const textKey = channel.text.trim();
    if (KNOWN_CHANNEL_TEXT_KEYS.has(textKey)) return textKey;
  }

  const legacyCandidates = [
    channel.legacyId,
    typeof channel.id === "string" && !channel.id.includes("-") ? channel.id : "",
  ];
  for (const candidate of legacyCandidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const textKey = resolveAliasTextKey(candidate);
    if (textKey) return textKey;
  }

  const nameCandidates = [channel.nameAr, channel.nameEn, channel.name];
  for (const candidate of nameCandidates) {
    const textKey = resolveAliasTextKey(candidate);
    if (textKey) return textKey;
  }

  return "";
}

/**
 * @param {Record<string, unknown> | null | undefined} channel
 * @param {"ar" | "en"} lang
 * @param {(lang: "ar" | "en", key: string) => string} textFn
 */
export function resolveSalesChannelLabel(channel, lang, textFn) {
  const textKey = resolveSalesChannelTextKey(channel);
  if (textKey) {
    const translated = textFn(lang, textKey);
    if (translated && translated !== textKey) return translated;
  }

  if (channel?.custom === true) {
    return lang === "ar"
      ? String(channel.nameAr || channel.nameEn || channel.name || "")
      : String(channel.nameEn || channel.nameAr || channel.name || "");
  }

  if (textKey) return textFn(lang, textKey);
  return String(channel?.id || "");
}

/**
 * @param {Record<string, unknown>} row
 * @param {Array<Record<string, unknown>>} configuredChannels
 * @param {"ar" | "en"} lang
 * @param {(channel: Record<string, unknown>, lang: "ar" | "en") => string} channelNameFn
 */
export function resolveSalesChannelRowLabel(row, configuredChannels = [], lang, channelNameFn) {
  const channelId = typeof row?.channelId === "string" ? row.channelId : "";
  const configured = configuredChannels.find((channel) => (
    channel?.id === channelId
    || channel?.legacyId === channelId
    || channel?.apiChannelId === channelId
  ));
  if (configured) return channelNameFn(configured, lang);

  if (typeof row?.name === "string" && row.name.trim()) {
    return resolveSalesChannelLabel({
      custom: true,
      nameAr: row.name,
      nameEn: row.name,
    }, lang, (currentLang, key) => channelNameFn({ text: key, custom: false }, currentLang));
  }

  return channelId;
}

/**
 * Prefer configured channel metadata over entry snapshot names when aggregating totals.
 * @param {Record<string, unknown>} row
 * @param {Array<Record<string, unknown>>} configuredChannels
 */
export function resolveAggregatedChannelShape(row, configuredChannels = []) {
  const channelId = typeof row?.channelId === "string" ? row.channelId : "";
  const configured = configuredChannels.find((channel) => (
    channel?.id === channelId
    || channel?.legacyId === channelId
    || channel?.apiChannelId === channelId
  ));
  if (configured) {
    return { ...configured, amount: 0 };
  }

  const textKey = resolveSalesChannelTextKey({
    id: channelId,
    nameAr: row?.name,
    nameEn: row?.name,
    name: row?.name,
  });
  if (textKey) {
    return {
      id: channelId,
      text: textKey,
      custom: false,
      amount: 0,
    };
  }

  const snapshotName = typeof row?.name === "string" && row.name.trim()
    ? row.name.trim()
    : channelId;
  return {
    id: channelId,
    custom: true,
    nameAr: snapshotName,
    nameEn: snapshotName,
    amount: 0,
  };
}
