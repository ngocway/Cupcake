import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subHours, subDays, startOfHour, startOfDay, format, differenceInMinutes } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h"; // "4h" | "24h" | "7d" | "30d"

    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;
    let bucketIntervalMinutes: number;
    let totalBuckets: number;

    if (range === "4h") {
      startDate = subHours(now, 4);
      prevStartDate = subHours(startDate, 4);
      prevEndDate = startDate;
      bucketIntervalMinutes = 5;
      totalBuckets = 48; // 4 hours * 12 buckets/hour
    } else if (range === "24h") {
      startDate = subHours(now, 24);
      prevStartDate = subHours(startDate, 24);
      prevEndDate = startDate;
      bucketIntervalMinutes = 60;
      totalBuckets = 24;
    } else if (range === "7d") {
      startDate = startOfDay(subDays(now, 6)); // 7 days including today
      prevStartDate = startOfDay(subDays(startDate, 7));
      prevEndDate = startDate;
      bucketIntervalMinutes = 24 * 60;
      totalBuckets = 7;
    } else {
      // 30d
      startDate = startOfDay(subDays(now, 29)); // 30 days including today
      prevStartDate = startOfDay(subDays(startDate, 30));
      prevEndDate = startDate;
      bucketIntervalMinutes = 24 * 60;
      totalBuckets = 30;
    }

    // 1. Fetch current period logs
    const currentLogs = await prisma.pageViewLog.findMany({
      where: {
        createdAt: { gte: startDate, lte: now }
      },
      orderBy: { createdAt: "asc" }
    });

    // 2. Fetch previous period logs (for comparison metrics)
    const prevLogs = await prisma.pageViewLog.findMany({
      where: {
        createdAt: { gte: prevStartDate, lte: prevEndDate }
      }
    });

    // --- METRICS COMPUTATION ---
    const computeStats = (logs: typeof currentLogs) => {
      const pageviews = logs.length;
      
      const ipSet = new Set<string>();
      const ipViews: Record<string, number> = {};
      const ipTimes: Record<string, Date[]> = {};

      logs.forEach(log => {
        ipSet.add(log.ipHash);
        ipViews[log.ipHash] = (ipViews[log.ipHash] || 0) + 1;
        if (!ipTimes[log.ipHash]) ipTimes[log.ipHash] = [];
        ipTimes[log.ipHash].push(log.createdAt);
      });

      const uniqueVisitors = ipSet.size;

      // Bounce rate: IPs with exactly 1 view / total unique IPs
      let bounceCount = 0;
      Object.keys(ipViews).forEach(ip => {
        if (ipViews[ip] === 1) bounceCount++;
      });
      const bounceRate = uniqueVisitors > 0 ? (bounceCount / uniqueVisitors) * 100 : 0;

      // Session duration: average span in minutes for IPs with multiple views
      let totalDuration = 0;
      let multiViewCount = 0;
      Object.keys(ipTimes).forEach(ip => {
        const times = ipTimes[ip];
        if (times.length > 1) {
          const diff = differenceInMinutes(times[times.length - 1], times[0]);
          // Cap it at 30 minutes to ignore sessions where users left tab open
          totalDuration += Math.min(diff, 30);
          multiViewCount++;
        } else if (times.length === 1) {
          totalDuration += 2; // Estimate 2 minutes for single-page view
          multiViewCount++;
        }
      });
      const avgSessionDuration = multiViewCount > 0 ? totalDuration / multiViewCount : 0;

      return { pageviews, uniqueVisitors, bounceRate, avgSessionDuration };
    };

    const currentStats = computeStats(currentLogs);
    const prevStats = computeStats(prevLogs);

    // Calculate percentage changes
    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const changes = {
      pageviews: calcChange(currentStats.pageviews, prevStats.pageviews),
      uniqueVisitors: calcChange(currentStats.uniqueVisitors, prevStats.uniqueVisitors),
      bounceRate: calcChange(currentStats.bounceRate, prevStats.bounceRate),
      avgSessionDuration: calcChange(currentStats.avgSessionDuration, prevStats.avgSessionDuration)
    };

    // --- CHART DATA GENERATION ---
    const chartData: any[] = [];
    
    // Initialize buckets
    for (let i = 0; i < totalBuckets; i++) {
      let bucketStart: Date;
      let bucketName: string;

      if (range === "4h") {
        bucketStart = new Date(startDate.getTime() + i * bucketIntervalMinutes * 60 * 1000);
        bucketName = format(bucketStart, "HH:mm");
      } else if (range === "24h") {
        bucketStart = startOfHour(new Date(startDate.getTime() + i * bucketIntervalMinutes * 60 * 1000));
        bucketName = format(bucketStart, "HH:00");
      } else {
        bucketStart = startOfDay(subDays(now, (totalBuckets - 1) - i));
        bucketName = format(bucketStart, "MMM dd");
      }

      chartData.push({
        name: bucketName,
        timestamp: bucketStart.getTime(),
        pageviews: 0,
        uniqueVisitors: new Set<string>()
      });
    }

    // Fill buckets with logs
    currentLogs.forEach(log => {
      const logTime = log.createdAt.getTime();
      // Find the closest bucket
      let foundBucket = chartData[chartData.length - 1];
      for (let i = 0; i < chartData.length - 1; i++) {
        if (logTime >= chartData[i].timestamp && logTime < chartData[i + 1].timestamp) {
          foundBucket = chartData[i];
          break;
        }
      }
      foundBucket.pageviews++;
      foundBucket.uniqueVisitors.add(log.ipHash);
    });

    // Map unique visitor sets to size counts
    const formattedChartData = chartData.map(bucket => ({
      name: bucket.name,
      pageviews: bucket.pageviews,
      uniqueVisitors: bucket.uniqueVisitors.size
    }));

    // --- TOP PAGES RANKING ---
    const pathCounts: Record<string, { pageviews: number; ipSet: Set<string> }> = {};
    currentLogs.forEach(log => {
      // Clean path to ignore query string in grouping
      const cleanPath = log.path.split("?")[0];
      if (!pathCounts[cleanPath]) {
        pathCounts[cleanPath] = { pageviews: 0, ipSet: new Set() };
      }
      pathCounts[cleanPath].pageviews++;
      pathCounts[cleanPath].ipSet.add(log.ipHash);
    });

    const topPages = Object.keys(pathCounts)
      .map(path => ({
        path,
        pageviews: pathCounts[path].pageviews,
        uniqueVisitors: pathCounts[path].ipSet.size,
        share: currentStats.pageviews > 0 
          ? parseFloat(((pathCounts[path].pageviews / currentStats.pageviews) * 100).toFixed(1))
          : 0
      }))
      .sort((a, b) => b.pageviews - a.pageviews)
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        pageviews: currentStats.pageviews,
        uniqueVisitors: currentStats.uniqueVisitors,
        bounceRate: parseFloat(currentStats.bounceRate.toFixed(1)),
        avgSessionDuration: parseFloat(currentStats.avgSessionDuration.toFixed(1))
      },
      changes,
      chartData: formattedChartData,
      topPages
    });
  } catch (error) {
    console.error("Failed to query traffic analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
