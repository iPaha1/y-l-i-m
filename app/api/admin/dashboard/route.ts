import { prismadb } from '@/lib/db';
import { NextResponse } from 'next/server';


// Type definitions for the API response
interface CountryGroup {
  country: string;
  _count: {
    country: number;
  };
}

interface DeviceGroup {
  device: string;
  _count: {
    device: number;
  };
}

interface BrowserGroup {
  browser: string;
  _count: {
    browser: number;
  };
}

interface OSGroup {
  os: string;
  _count: {
    os: number;
  };
}

interface VisitorFrequencyGroup {
  ip: string;
  _count: {
    ip: number;
  };
}

export async function GET() {
  try {
    // Get total visitors
    const totalVisitors = await prismadb.visitor.count();

    // Get unique countries with proper typing
    const uniqueCountries = await prismadb.visitor.groupBy({
      by: ['country'],
      _count: {
        country: true,
      },
    });

    // Get unique devices with proper typing  
    const uniqueDevices = await prismadb.visitor.groupBy({
      by: ['device'],
      _count: {
        device: true,
      },
    });

    // Get recent visitors (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const recentVisitors = await prismadb.visitor.findMany({
      where: {
        visitedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        visitedAt: 'desc',
      },
      take: 20,
    });

    // Get top countries
    const topCountries = uniqueCountries
      .sort((a: CountryGroup, b: CountryGroup) => b._count.country - a._count.country)
      .slice(0, 10)
      .map((item: CountryGroup) => ({
        country: item.country,
        count: item._count.country,
      }));

    // Get top browsers
    const browserStats = await prismadb.visitor.groupBy({
      by: ['browser'],
      _count: {
        browser: true,
      },
    });

    const topBrowsers = browserStats
      .sort((a: BrowserGroup, b: BrowserGroup) => b._count.browser - a._count.browser)
      .slice(0, 10)
      .map((item: BrowserGroup) => ({
        browser: item.browser,
        count: item._count.browser,
      }));

    // Get top devices
    const topDevices = uniqueDevices
      .sort((a: DeviceGroup, b: DeviceGroup) => b._count.device - a._count.device)
      .slice(0, 10)
      .map((item: DeviceGroup) => ({
        device: item.device,
        count: item._count.device,
      }));

    // Get hourly visitor data for the last 24 hours
    const hourlyData = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i, 0, 0, 0);
      const nextHour = new Date(hour);
      nextHour.setHours(nextHour.getHours() + 1);

      const count = await prismadb.visitor.count({
        where: {
          visitedAt: {
            gte: hour,
            lt: nextHour,
          },
        },
      });

      hourlyData.push({
        hour: hour.getHours(),
        count,
        timestamp: hour.toISOString(),
      });
    }

    // Get visitor locations for mapping
    const visitorLocations = await prismadb.visitor.findMany({
      where: {
        latitude: {
          not: 0,
        },
        longitude: {
          not: 0,
        },
      },
      select: {
        latitude: true,
        longitude: true,
        city: true,
        country: true,
        visitedAt: true,
      },
      orderBy: {
        visitedAt: 'desc',
      },
      take: 100,
    });

    // Get OS statistics
    const osStats = await prismadb.visitor.groupBy({
      by: ['os'],
      _count: {
        os: true,
      },
    });

    const topOS = osStats
      .sort((a: OSGroup, b: OSGroup) => b._count.os - a._count.os)
      .slice(0, 10)
      .map((item: OSGroup) => ({
        os: item.os,
        count: item._count.os,
      }));

    // Get ISP statistics
    const ispData = await prismadb.visitor.findMany({
      select: {
        ip: true,
        visitedAt: true,
      },
      orderBy: {
        visitedAt: 'desc',
      },
      take: 50,
    });

    if (ispData.length === 0) {
      return NextResponse.json({
        error: 'No ISP data available',
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }
    

    // Calculate visitor frequency - Get all visitors first, then filter
    const allVisitorsByIP = await prismadb.visitor.groupBy({
      by: ['ip'],
      _count: {
        ip: true,
      },
      orderBy: {
        _count: {
          ip: 'desc',
        },
      },
    });

    // Filter for repeat visitors (more than 1 visit) and take top 10
    const repeatVisitors = allVisitorsByIP
      .filter((item: VisitorFrequencyGroup) => item._count.ip > 1)
      .slice(0, 10)
      .map((item: VisitorFrequencyGroup) => ({
        ip: item.ip,
        visits: item._count.ip,
      }));

    // Calculate daily statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayVisitors = await prismadb.visitor.count({
      where: {
        visitedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayVisitors = await prismadb.visitor.count({
      where: {
        visitedAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    const growthRate = yesterdayVisitors > 0 
      ? ((todayVisitors - yesterdayVisitors) / yesterdayVisitors * 100).toFixed(1)
      : '0';

    const response = {
      totalVisitors,
      uniqueCountries: uniqueCountries.length,
      uniqueDevices: uniqueDevices.length,
      recentVisitors,
      topCountries,
      topBrowsers,
      topDevices,
      topOS,
      hourlyData,
      visitorLocations,
      repeatVisitors,
      dailyStats: {
        today: todayVisitors,
        yesterday: yesterdayVisitors,
        growthRate: `${growthRate}%`,
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // No need to disconnect when using singleton pattern
    // await prismadb.$disconnect();
  }
}

// Optional: Add a POST endpoint for real-time updates
export async function POST() {
  try {
    // This could be used for real-time notifications
    // or to trigger specific tracking actions
    
    const recentCount = await prismadb.visitor.count({
      where: {
        visitedAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
    });

    return NextResponse.json({
      success: true,
      recentActivity: recentCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Dashboard POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // No need to disconnect when using singleton pattern
    // await prismadb.$disconnect();
  }
}