import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

interface GeoLocationData {
  query: string;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  reverse: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
  threat: string;
}

interface ClientData {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  timezone: string;
  timestamp: string;
  referrer: string;
  url: string;
}

// Helper function to get real IP address
function getRealIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // Fallback to localhost if no IP found in headers
  return '127.0.0.1';
}

// Helper function to detect VPN/Proxy
function detectVPN(geoData: GeoLocationData, userAgent: string): boolean {
  const vpnIndicators = [
    'vpn', 'proxy', 'tor', 'nord', 'express', 'surfshark',
    'cyberghost', 'private internet access', 'pia'
  ];
  
  const isp = geoData.isp?.toLowerCase() || '';
  const org = geoData.org?.toLowerCase() || '';
  const ua = userAgent.toLowerCase();
  
  return vpnIndicators.some(indicator => 
    isp.includes(indicator) || org.includes(indicator) || ua.includes(indicator)
  ) || geoData.proxy || geoData.hosting;
}

// Helper function to determine threat level
function getThreatLevel(geoData: GeoLocationData, isVPN: boolean): string {
  if (geoData.threat && geoData.threat !== 'low') return geoData.threat;
  if (isVPN || geoData.proxy) return 'medium';
  if (geoData.hosting) return 'medium';
  return 'low';
}

// Helper function to get connection type
function getConnectionType(userAgent: string, geoData: GeoLocationData): string {
  if (geoData.mobile) return 'Mobile';
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Broadband';
}

export async function POST(request: NextRequest) {
  try {
    // Get client data from request body
    const clientData: ClientData = await request.json();
    
    // Get IP address
    const ip = getRealIP(request);
    
    // Get additional headers
    const headers = {
      userAgent: request.headers.get('user-agent') || clientData.userAgent,
      acceptLanguage: request.headers.get('accept-language') || '',
      acceptEncoding: request.headers.get('accept-encoding') || '',
      connection: request.headers.get('connection') || '',
      dnt: request.headers.get('dnt') || '',
      upgrade: request.headers.get('upgrade-insecure-requests') || '',
    };

    console.log(`Tracking visitor with IP: ${ip}`);

    // Fetch geolocation data with additional fields
    let geoData: GeoLocationData;
    try {
      const geoResponse = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting,query&lang=en`,
        {
          headers: {
            'User-Agent': 'LocationTracker/1.0'
          }
        }
      );
      
      if (!geoResponse.ok) {
        throw new Error(`Geo API error: ${geoResponse.status}`);
      }
      
      geoData = await geoResponse.json();
      
      if (geoData.status !== 'success') {
        throw new Error(`Geo API failed: ${geoData.status}`);
      }
    } catch (error) {
      console.error('Geolocation fetch failed:', error);
      // Fallback data
      geoData = {
        query: ip,
        status: 'success',
        country: 'Unknown',
        countryCode: 'XX',
        region: 'XX',
        regionName: 'Unknown',
        city: 'Unknown',
        zip: 'Unknown',
        lat: 0,
        lon: 0,
        timezone: clientData.timezone || 'UTC',
        isp: 'Unknown ISP',
        org: 'Unknown Organization',
        as: 'Unknown',
        reverse: 'Unknown',
        mobile: false,
        proxy: false,
        hosting: false,
        threat: 'unknown'
      };
    }

    // Parse user agent
    const parser = new UAParser(headers.userAgent);
    const uaResult = parser.getResult();

    // Detect device type more accurately
    let deviceType = 'Desktop';
    if (uaResult.device.type) {
      deviceType = uaResult.device.type === 'mobile' ? 'Mobile' : 
                   uaResult.device.type === 'tablet' ? 'Tablet' : 'Desktop';
    } else if (geoData.mobile || headers.userAgent.includes('Mobile')) {
      deviceType = 'Mobile';
    } else if (headers.userAgent.includes('Tablet')) {
      deviceType = 'Tablet';
    }

    // Enhanced browser detection
    const browserName = uaResult.browser.name || 'Unknown';
    const browserVersion = uaResult.browser.version || 'Unknown';
    const browser = `${browserName} ${browserVersion}`;

    // Enhanced OS detection
    const osName = uaResult.os.name || 'Unknown';
    const osVersion = uaResult.os.version || 'Unknown';
    const os = `${osName} ${osVersion}`;

    // Detect VPN/Proxy
    const isVPN = detectVPN(geoData, headers.userAgent);
    const isProxy = geoData.proxy || isVPN;

    // Get threat level
    const threatLevel = getThreatLevel(geoData, isVPN);

    // Get connection type
    const connectionType = getConnectionType(headers.userAgent, geoData);

    // Prepare visitor data
    const visitorInfo = {
      ip,
      country: geoData.country,
      region: geoData.regionName,
      city: geoData.city,
      latitude: geoData.lat,
      longitude: geoData.lon,
      timezone: geoData.timezone,
      browser,
      os,
      device: deviceType,
      userAgent: headers.userAgent,
      isp: geoData.isp,
      connection: connectionType,
      threat: threatLevel,
      vpn: isVPN,
      proxy: isProxy,
    };

    // Save to database
    try {
      await prisma.visitor.create({
        data: {
          ip: visitorInfo.ip,
          country: visitorInfo.country,
          region: visitorInfo.region,
          city: visitorInfo.city,
          latitude: visitorInfo.latitude,
          longitude: visitorInfo.longitude,
          timezone: visitorInfo.timezone,
          browser: visitorInfo.browser,
          os: visitorInfo.os,
          device: visitorInfo.device,
          userAgent: visitorInfo.userAgent,
        },
      });

      console.log('Visitor data saved successfully');
      console.log(visitorInfo);
      
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      // Continue execution even if DB save fails
    }

    // Enhanced response with additional tracking data
    return NextResponse.json({
      success: true,
      message: 'Visitor tracked successfully',
      visitorInfo,
      additionalData: {
        headers: {
          acceptLanguage: headers.acceptLanguage,
          acceptEncoding: headers.acceptEncoding,
          connection: headers.connection,
          dnt: headers.dnt === '1' ? 'Do Not Track Enabled' : 'Tracking Allowed',
        },
        client: clientData,
        geoDetails: {
          countryCode: geoData.countryCode,
          zip: geoData.zip,
          organization: geoData.org,
          asn: geoData.as,
          reverse: geoData.reverse,
        },
        fingerprint: {
          screen: `${clientData.screen.width}x${clientData.screen.height}`,
          colorDepth: clientData.screen.colorDepth,
          pixelDepth: clientData.screen.pixelDepth,
          viewport: `${clientData.viewport.width}x${clientData.viewport.height}`,
          language: clientData.language,
          platform: clientData.platform,
          cookieEnabled: clientData.cookieEnabled,
          onLine: clientData.onLine,
        }
      }
    });


  } catch (error) {
    console.error('Tracking error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Tracking failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}