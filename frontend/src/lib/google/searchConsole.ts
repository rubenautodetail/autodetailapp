import { google } from "googleapis";
import { getAuthenticatedClient } from "./oauth";

export interface SearchConsolePerformance {
  siteUrl: string;
  startDate: string;
  endDate: string;
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

export async function getSearchConsolePerformance(
  siteUrl: string = "https://dtailwash.com/",
  days: number = 30
): Promise<SearchConsolePerformance | null> {
  const { client, authenticated } = await getAuthenticatedClient();
  if (!authenticated || !client) {
    return null;
  }

  try {
    const webmasters = google.webmasters({ version: "v3", auth: client });

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86_400_000).toISOString().split("T")[0];

    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 10,
      },
    });

    const rows = response.data.rows || [];
    let totalClicks = 0;
    let totalImpressions = 0;
    let sumPosition = 0;

    const topQueries = rows.map((row) => {
      const clicks = row.clicks || 0;
      const impressions = row.impressions || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 0;

      totalClicks += clicks;
      totalImpressions += impressions;
      sumPosition += position;

      return {
        query: row.keys?.[0] || "",
        clicks,
        impressions,
        ctr,
        position,
      };
    });

    const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const averagePosition = rows.length > 0 ? sumPosition / rows.length : 0;

    return {
      siteUrl,
      startDate,
      endDate,
      totalClicks,
      totalImpressions,
      averageCtr,
      averagePosition,
      topQueries,
    };
  } catch (error) {
    console.error("Google Search Console API Error:", error);
    return null;
  }
}
