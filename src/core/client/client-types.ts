export type JsonStringMap = Record<string, string>;

export type RuntimeApiMaps = {
  storeIdMap: JsonStringMap;
  userIdMap: JsonStringMap;
  salesChannelIdMap: JsonStringMap;
};

export type RuntimeApiMapOverrides = Partial<RuntimeApiMaps>;

export type PrototypeApiAuthHeadersInput = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
};

export type ResolvePrototypeApiContextInput = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
};

export type ResolvedPrototypeApiContext = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  storeId: string;
};
