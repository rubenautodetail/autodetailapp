import { google } from "googleapis";
import { getAuthenticatedClient } from "./oauth";

export interface AnalyticsSummary {
  measurementId: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  periodDays: number;
}

export function getGAMeasurementId(): string | null {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null;
}

export async function getAnalyticsData(
  propertyId: string = "properties/J70SXKFB1N",
  days: number = 30
): Promise<AnalyticsSummary | null> {
  const { client, authenticated } = await getAuthenticatedClient();
  if (!authenticated || !client) {
    return null;
  }

  try {
    const analyticsData = google.analyticsdata({ version: "v1beta", auth: client });

    const res = await analyticsData.properties.runReport({
      property: propertyId.startsWith("properties/") ? propertyId : `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
        ],
      },
    });

    const row = res.data.rows?.[0];
    if (row && row.metricValues) {
      return {
        measurementId: getGAMeasurementId() || propertyId,
        activeUsers: Number(row.metricValues[0]?.value || 0),
        sessions: Number(row.metricValues[1]?.value || 0),
        pageViews: Number(row.metricValues[2]?.value || 0),
        bounceRate: Number(row.metricValues[3]?.value || 0),
        periodDays: days,
      };
    }
  } catch (err) {
    console.error("Google Analytics Data API Error:", err);
  }

  return null;
}
