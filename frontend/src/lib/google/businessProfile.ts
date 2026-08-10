import { google } from "googleapis";
import { getAuthenticatedClient } from "./oauth";

export interface BusinessProfileDetails {
  title: string;
  storeCode?: string;
  primaryCategory?: string;
  phone?: string;
  websiteUrl?: string;
  address?: string;
  rating?: number;
  totalReviews?: number;
}

export async function getBusinessProfileDetails(): Promise<BusinessProfileDetails | null> {
  const { client, authenticated } = await getAuthenticatedClient();
  if (!authenticated || !client) {
    return null;
  }

  try {
    const mybusinessAccount = google.mybusinessaccountmanagement({ version: "v1", auth: client });
    const accountsRes = await mybusinessAccount.accounts.list();

    const accounts = accountsRes.data.accounts || [];
    if (accounts.length === 0) {
      return null;
    }

    const firstAccount = accounts[0];
    const mybusinessInfo = google.mybusinessbusinessinformation({ version: "v1", auth: client });

    const locationsRes = await mybusinessInfo.accounts.locations.list({
      parent: firstAccount.name!,
      readMask: "name,title,storeCode,primaryCategory,phoneNumbers,websiteUri,storefrontAddress",
    });

    const location: any = locationsRes.data.locations?.[0];
    if (location) {
      const addr = location.storefrontAddress;
      const formattedAddress = addr
        ? `${addr.addressLines?.join(", ") || ""}, ${addr.locality || ""}, ${addr.administrativeArea || ""} ${addr.postalCode || ""}`
        : "Miami, FL";

      const categoryName =
        location.primaryCategory?.displayName ||
        location.categories?.primaryCategory?.displayName ||
        "Car Detailing Service";
      return {
        title: location.title || "Lux Auto Detail Services",
        storeCode: location.storeCode || undefined,
        primaryCategory: categoryName,
        phone: location.phoneNumbers?.primaryPhone || "(305) 000-0000",
        websiteUrl: location.websiteUri || "https://www.dtailwash.com",
        address: formattedAddress,
      };
    }
  } catch (err) {
    console.error("Google Business Profile API Error:", err);
  }

  return null;
}
