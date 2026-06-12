"use client";

import { useCallback, useEffect, useState } from "react";
import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import { buildEmployeeInviteWhatsAppMessage } from "@/core/messaging/whatsapp-auth-messages";
import {
  createMemberInvitationViaApi,
  fetchMemberInvitationsViaApi,
  revokeMemberInvitationViaApi,
} from "@/features/member-invitations/client/member-invitations-api-client";

export function useOwnerTeamInvites({
  organizationId,
  actorUserId,
  actorRole,
  activeStoredBusinesses,
}) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("employee");
  const [storeId, setStoreId] = useState(activeStoredBusinesses[0]?.id || "");
  const [creating, setCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const loadInvitations = useCallback(async () => {
    if (!organizationId || !actorUserId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await fetchMemberInvitationsViaApi({
        organizationId,
        actorUserId,
        actorRole,
      });
      setInvitations(Array.isArray(payload?.invitations) ? payload.invitations : []);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  }, [actorRole, actorUserId, organizationId]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    if (!storeId && activeStoredBusinesses[0]?.id) {
      setStoreId(activeStoredBusinesses[0].id);
    }
  }, [activeStoredBusinesses, storeId]);

  const copyText = useCallback(async (value, field) => {
    if (!value || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(""), 2000);
  }, []);

  const createInvite = useCallback(async () => {
    if (!displayName.trim() || !phoneNumber.trim() || !pin.trim() || !storeId || creating) return;
    setCreating(true);
    setError("");
    try {
      const created = await createMemberInvitationViaApi({
        organizationId,
        actorUserId,
        actorRole,
        displayName: displayName.trim(),
        role,
        storeId,
        phoneNumber: phoneNumber.trim(),
        pin: pin.trim(),
      });
      setCreatedInvite(created);
      setDisplayName("");
      setPhoneNumber("");
      setPin("");
      await loadInvitations();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to create invitation.");
    } finally {
      setCreating(false);
    }
  }, [
    actorRole,
    actorUserId,
    creating,
    displayName,
    loadInvitations,
    organizationId,
    phoneNumber,
    pin,
    role,
    storeId,
  ]);

  const revokeInvite = useCallback(async (invitationId) => {
    setError("");
    try {
      await revokeMemberInvitationViaApi({
        organizationId,
        actorUserId,
        actorRole,
        invitationId,
      });
      setCreatedInvite((current) => (
        current?.invitationId === invitationId ? null : current
      ));
      await loadInvitations();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to revoke invitation.");
    }
  }, [actorRole, actorUserId, loadInvitations, organizationId]);

  const shareInviteWhatsApp = useCallback((invite) => {
    const message = buildEmployeeInviteWhatsAppMessage({
      employeeName: invite.displayName,
      organizationName: invite.organizationName,
      storeName: invite.storeName,
      inviteUrl: invite.inviteUrl,
      pin: invite.pin,
    });
    const url = buildWhatsAppShareUrl(message, invite.phoneNumber);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const canCreate = Boolean(
    displayName.trim() && phoneNumber.trim() && pin.trim() && storeId && !creating,
  );

  return {
    invitations,
    loading,
    error,
    displayName,
    setDisplayName,
    phoneNumber,
    setPhoneNumber,
    pin,
    setPin,
    role,
    setRole,
    storeId,
    setStoreId,
    creating,
    createdInvite,
    copiedField,
    canCreate,
    copyText,
    createInvite,
    revokeInvite,
    shareInviteWhatsApp,
  };
}
