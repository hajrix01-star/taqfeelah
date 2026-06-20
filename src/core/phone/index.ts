export { AppLoginPhoneField } from "@/core/phone/AppLoginPhoneField";
export { StandardLoginPhoneField } from "@/core/phone/StandardLoginPhoneField";
export type { StandardLoginPhoneSurface } from "@/core/phone/StandardLoginPhoneField";
export { LoginPhoneFields } from "@/core/phone/LoginPhoneFields";
export { assertValidLoginPhone, normalizeLoginPhone } from "@/core/phone/normalize-login-phone";
export { expandPhoneSearchDigits } from "@/core/phone/expand-phone-search-digits";
export {
  composeLoginPhone,
  DEFAULT_DIAL_CODE,
  formatLoginPhoneForDisplay,
  sanitizeNationalPhoneInput,
  splitLoginPhone,
} from "@/core/phone/split-login-phone";
