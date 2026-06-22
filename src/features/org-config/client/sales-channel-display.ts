const KNOWN_CHANNEL_TEXT_KEYS = new Set([
  "cash",
  "bank",
  "mada",
  "apple",
  "jahez",
  "hunger",
  "keeta",
  "card",
  "online",
]);

const CHANNEL_ALIAS_TO_TEXT_KEY: Record<string, string> = {
  cash: "cash",
  bank: "bank",
  mada: "mada",
  apple: "apple",
  "apple pay": "apple",
  jahez: "jahez",
  hunger: "hunger",
  hungerstation: "hunger",
  keeta: "keeta",
  card: "card",
  online: "online",
  نقد: "cash",
  نقدي: "cash",
  بنك: "bank",
  حساب: "bank",
  بطاقة: "card",
  مدى: "mada",
  جاهز: "jahez",
  هنقرستيشن: "hunger",
  كيتا: "keeta",
};

function normalizeChannelAlias(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isUuidLike(value: unknown): boolean {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

export { isUuidLike };

function resolveAliasTextKey(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return CHANNEL_ALIAS_TO_TEXT_KEY[trimmed]
    || CHANNEL_ALIAS_TO_TEXT_KEY[normalizeChannelAlias(trimmed)]
    || "";
}

/**
 * Resolve a built-in sales channel copy key (cash, bank, mada, …) from channel metadata.
 */
export function resolveSalesChannelTextKey(channel: Record<string, unknown> | null | undefined) {
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

export function resolveSalesChannelLabel(
  channel: Record<string, unknown> | null | undefined,
  lang: "ar" | "en",
  textFn: (lang: "ar" | "en", key: string) => string,
) {
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

export function resolveSalesChannelRowLabel(
  row: Record<string, unknown>,
  configuredChannels: Array<Record<string, unknown>> = [],
  lang: "ar" | "en",
  channelNameFn: (channel: Record<string, unknown>, lang: "ar" | "en") => string,
) {
  const channelId = typeof row?.channelId === "string" ? row.channelId : "";
  const configured = configuredChannels.find((channel) => (
    channel?.id === channelId
    || channel?.legacyId === channelId
    || channel?.apiChannelId === channelId
  ));
  if (configured) return channelNameFn(configured, lang);

  if (typeof row?.name === "string" && row.name.trim() && !isUuidLike(row.name)) {
    return resolveSalesChannelLabel({
      custom: true,
      nameAr: row.name,
      nameEn: row.name,
    }, lang, (currentLang, key) => channelNameFn({ text: key, custom: false }, currentLang));
  }

  return channelId && !isUuidLike(channelId) ? channelId : "";
}

/**
 * Stable key for register filters / exports — merges legacy UUID rows with catalog ids (cash, jahez, …).
 */
export function resolveRegisterIncomeSourceFilterKey(
  row: Record<string, unknown>,
  configuredChannels: Array<Record<string, unknown>> = [],
) {
  const shape = resolveAggregatedChannelShape(row, configuredChannels);
  const textKey = resolveSalesChannelTextKey(shape);
  if (textKey) return textKey;
  if (shape.custom === true) {
    const customId = typeof shape.id === "string" && shape.id.trim()
      ? shape.id.trim()
      : typeof row?.channelId === "string"
        ? row.channelId.trim()
        : "";
    return customId ? `custom:${customId}` : "";
  }
  return typeof shape.id === "string" && shape.id.trim()
    ? shape.id.trim()
    : typeof row?.channelId === "string"
      ? row.channelId.trim()
      : "";
}

export function entryRowMatchesIncomeSourceFilter(
  row: Record<string, unknown>,
  filterKey: string,
  configuredChannels: Array<Record<string, unknown>> = [],
) {
  if (filterKey === "all") return true;
  return resolveRegisterIncomeSourceFilterKey(row, configuredChannels) === filterKey;
}

export function resolveAggregatedChannelShape(
  row: Record<string, unknown>,
  configuredChannels: Array<Record<string, unknown>> = [],
) {
  const channelId = typeof row?.channelId === "string" ? row.channelId : "";
  const configured = configuredChannels.find((channel) => (
    channel?.id === channelId
    || channel?.legacyId === channelId
    || channel?.apiChannelId === channelId
  ));
  if (configured) {
    const snapshotName = typeof row?.name === "string" && row.name.trim()
      ? row.name.trim()
      : "";
    const hasConfiguredLabel = [
      configured.text,
      configured.name,
      configured.nameAr,
      configured.nameEn,
      configured.legacyId,
    ].some((value) => typeof value === "string" && value.trim());
    return {
      ...configured,
      ...(!hasConfiguredLabel && snapshotName
        ? { name: snapshotName, custom: configured.custom ?? true }
        : {}),
      amount: 0,
    };
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
