type StoreAccessRow = {
  storeId: string;
  storeName: string;
  storeStatus: string;
};

export function filterActiveStores<T extends { status?: string }>(stores: T[]): T[] {
  return stores.filter((store) => store.status === "active" || !store.status);
}

export function formatMemberStoreAccessLabel(
  storeAccess: StoreAccessRow[] | undefined,
  emptyLabel: string,
): string {
  if (!storeAccess?.length) {
    return emptyLabel;
  }

  return storeAccess
    .map((entry) => (
      entry.storeStatus === "archived"
        ? `${entry.storeName} (${entry.storeStatus})`
        : entry.storeName
    ))
    .join("، ");
}
