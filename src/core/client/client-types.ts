export type JsonStringMap = Record<string, string>;

export type RuntimeApiMaps = {
  storeIdMap: JsonStringMap;
  userIdMap: JsonStringMap;
  salesChannelIdMap: JsonStringMap;
};

export type RuntimeApiMapOverrides = Partial<RuntimeApiMaps>;

export type RuntimeApiAuthHeadersInput = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
};

export type ResolveRuntimeApiContextInput = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
};

export type ResolvedRuntimeApiContext = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  storeId: string;
};
