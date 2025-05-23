import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/db';
import { UAParser } from 'ua-parser-js';
import { ServerTracker, type GeoLocationData, type ClientFingerprint } from '@/lib/tracking';


// Enhanced geolocation function with multiple API fallbacks
async function fetchGeoLocationWithFallback(ip: string, isLocalhost: boolean): Promise<GeoLocationData> {
  const apis = [
    {
      name: 'ip-api.com',
      url: `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting,query&lang=en`,
      transform: (data: GeoLocationData) => data
    },
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${ip}/json/`,
      transform: (data: Partial<GeoLocationData>) => ({
        query: ip,
        status: 'success',
        country: (data as Record<string, unknown>).country_name as string || 'Unknown',
        countryCode: (data as Record<string, unknown>).country_code as string || 'XX',
        region: (data as Record<string, unknown>).region_code as string || 'XX',
        regionName: (data as Record<string, unknown>).region as string || 'Unknown',
        city: (data as Record<string, unknown>).city as string || 'Unknown',
        zip: (data as Record<string, unknown>).postal as string || 'Unknown',
        lat: (data as Record<string, unknown>).latitude as number || 0,
        lon: (data as Record<string, unknown>).longitude as number || 0,
        timezone: (data as Record<string, unknown>).timezone as string || 'UTC',
        isp: (data as Record<string, unknown>).org as string || 'Unknown ISP',
        org: (data as Record<string, unknown>).org as string || 'Unknown Organization',
        as: (data as Record<string, unknown>).asn as string || 'Unknown',
        reverse: 'Unknown',
        mobile: false,
        proxy: false,
        hosting: false,
      })
    },
    {
      name: 'ipinfo.io',
      url: `https://ipinfo.io/${ip}/json`,
      transform: (data: Partial<GeoLocationData>) => {
        const loc = (data as Record<string, unknown>).loc as string | undefined;
        const [lat, lon] = (loc || '0,0').split(',').map(Number);
        return {
          query: ip,
          status: 'success',
          country: data.country || 'Unknown',
          countryCode: data.country || 'XX',
          region: data.region || 'XX',
          regionName: data.region || 'Unknown',
          city: data.city || 'Unknown',
          zip: data.countryCode || 'Unknown',
          lat: lat || 0,
          lon: lon || 0,
          timezone: data.timezone || 'UTC',
          isp: data.org || 'Unknown ISP',
          org: data.org || 'Unknown Organization',
          as: 'Unknown',
          reverse: data.isp || 'Unknown',
          longitude: data.lon || 0,
          latitude: data.lat || 0,
          mobile: false,
          proxy: false,
          hosting: false,
        };
      }
    }
  ];

  // If localhost, simulate realistic data for development
  if (isLocalhost) {
    console.log('Localhost detected - using simulated geolocation data');
    return {
      query: ip,
      status: 'success',
      country: 'United Kingdom',
      countryCode: 'GB',
      region: 'ENG',
      regionName: 'England',
      city: 'London',
      zip: 'EC1A 1BB',
      lat: 51.5074,
      lon: -0.1278,
      timezone: 'Europe/London',
      isp: 'Development Network',
      org: 'Local Development Environment',
      as: 'AS0 Localhost',
      reverse: 'localhost.localdomain',
      mobile: false,
      proxy: false,
      hosting: true,
    };
  }

  // Try each API in sequence
  for (const api of apis) {
    try {
      console.log(`Trying geolocation API: ${api.name}`);
      
      const response = await fetch(api.url, {
        headers: {
          'User-Agent': 'LocationTracker/2.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for API-specific error conditions
      if (api.name === 'ip-api.com' && data.status !== 'success') {
        throw new Error(`API returned status: ${data.status} - ${data.message || 'Unknown error'}`);
      }
      
      if (api.name === 'ipapi.co' && data.error) {
        throw new Error(`API error: ${data.reason || data.error}`);
      }

      const transformedData = api.transform(data);
      console.log(`Successfully got geolocation from ${api.name}`);
      return transformedData;

    } catch (error) {
      console.warn(`${api.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }

  throw new Error('All geolocation APIs failed');
}

// const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get client fingerprint data from request body
    const clientData: ClientFingerprint = await request.json();
    
    // Extract IP address using our utility
    const ip = ServerTracker.extractClientIP(request);
    
    // Get all request headers for analysis
    const requestHeaders = Object.fromEntries(request.headers.entries());
    
    console.log(`Tracking visitor with IP: ${ip}`);

    // Check if IP is localhost and handle accordingly
    let effectiveIP = ip;
    let isLocalhost = false;
    
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      isLocalhost = true;
      console.log('Local IP detected, attempting to get public IP...');
      
      // Try to get public IP for testing
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const publicIPResponse = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (publicIPResponse.ok) {
          const publicIPData = await publicIPResponse.json();
          effectiveIP = publicIPData.ip;
          console.log(`Using public IP for geolocation: ${effectiveIP}`);
        }
      } catch (ipError) {
        console.warn('Failed to get public IP:', ipError);
      }
    }

    // Fetch comprehensive geolocation data
    let geoData: GeoLocationData;
    try {
      // Use multiple API services for better reliability
      geoData = await fetchGeoLocationWithFallback(effectiveIP, isLocalhost);
    } catch (error) {
      console.error('All geolocation services failed:', error);
      // Enhanced fallback data with more realistic testing values
      geoData = {
        query: effectiveIP,
        status: 'success',
        country: isLocalhost ? 'United Kingdom' : 'Unknown',
        countryCode: isLocalhost ? 'GB' : 'XX',
        region: isLocalhost ? 'ENG' : 'XX',
        regionName: isLocalhost ? 'England' : 'Unknown',
        city: isLocalhost ? 'London' : 'Unknown',
        zip: isLocalhost ? 'SW1A 1AA' : 'Unknown',
        lat: isLocalhost ? 51.5074 : 0,
        lon: isLocalhost ? -0.1278 : 0,
        timezone: clientData.timezone || 'UTC',
        isp: isLocalhost ? 'Local Development' : 'Unknown ISP',
        org: isLocalhost ? 'Localhost' : 'Unknown Organization',
        as: isLocalhost ? 'AS0 Local Network' : 'Unknown',
        reverse: isLocalhost ? 'localhost' : 'Unknown',
        mobile: false,
        proxy: false,
        hosting: isLocalhost,
      };
    }

    // Parse user agent with enhanced detection
    const parser = new UAParser(clientData.userAgent);
    const uaResult = parser.getResult();

    // Enhanced device type detection
    let deviceType = 'Desktop';
    if (uaResult.device.type) {
      deviceType = uaResult.device.type === 'mobile' ? 'Mobile' : 
                   uaResult.device.type === 'tablet' ? 'Tablet' : 
                   uaResult.device.type === 'smarttv' ? 'Smart TV' : 'Desktop';
    } else if (geoData.mobile || clientData.userAgent.includes('Mobile')) {
      deviceType = 'Mobile';
    } else if (clientData.userAgent.includes('Tablet') || clientData.userAgent.includes('iPad')) {
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

    // Advanced threat detection
    const isVPN = ServerTracker.detectVPN(geoData, clientData.userAgent);
    const isProxy = geoData.proxy || isVPN;
    const threatLevel = ServerTracker.getThreatLevel(geoData, isVPN, clientData.userAgent);
    const connectionType = ServerTracker.getConnectionType(clientData.userAgent, geoData);

    // Generate device fingerprint
    const deviceFingerprint = ServerTracker.generateDeviceFingerprint(
      clientData.userAgent, 
      requestHeaders
    );

    // Prepare comprehensive visitor data
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
      userAgent: clientData.userAgent,
      isp: geoData.isp,
      connection: connectionType,
      threat: threatLevel,
      vpn: isVPN,
      proxy: isProxy,
    };

    // Save to database with error handling
    let dbSaveSuccess = false;
    try {
      await prismadb.visitor.create({
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
      
      dbSaveSuccess = true;
      console.log('Visitor data saved successfully to database');
      console.log('Visitor data:', visitorInfo);
    } catch (dbError) {
      console.error('Database save failed:', dbError);
      // Continue execution even if DB save fails
    }

    // Comprehensive response with all collected data
    return NextResponse.json({
      success: true,
      message: 'Visitor tracked successfully',
      dbSaved: dbSaveSuccess,
      visitorInfo,
      detailedAnalysis: {
        security: {
          threatLevel,
          vpnDetected: isVPN,
          proxyDetected: isProxy,
          hostingProvider: geoData.hosting,
          deviceFingerprint,
        },
        network: {
          isp: geoData.isp,
          organization: geoData.org,
          asn: geoData.as,
          reverse: geoData.reverse,
          connectionType,
        },
        location: {
          country: geoData.country,
          countryCode: geoData.countryCode,
          region: geoData.regionName,
          city: geoData.city,
          zip: geoData.zip,
          coordinates: `${geoData.lat}, ${geoData.lon}`,
          timezone: geoData.timezone,
        },
        device: {
          type: deviceType,
          browser: browser,
          os: os,
          userAgent: clientData.userAgent,
          screen: clientData.screen,
          viewport: clientData.viewport,
          language: clientData.language,
          languages: clientData.languages,
          platform: clientData.platform,
          cookieEnabled: clientData.cookieEnabled,
          onLine: clientData.onLine,
        },
        fingerprinting: {
          canvas: clientData.canvas ? 'Available' : 'Not available',
          webgl: clientData.webgl ? `${clientData.webgl.vendor} - ${clientData.webgl.renderer}` : 'Not available',
          fonts: clientData.fonts ? `${clientData.fonts.length} fonts detected` : 'Font detection failed',
          plugins: clientData.plugins ? `${clientData.plugins.length} plugins detected` : 'Plugin detection failed',
          storage: clientData.storage,
        },
        privacy: {
          dntHeader: requestHeaders['dnt'] === '1' ? 'Do Not Track Enabled' : 'Tracking Allowed',
          referrer: clientData.referrer || 'Direct visit',
          userAgentDetails: uaResult,
        },
        timing: {
          serverTime: new Date().toISOString(),
          clientTime: clientData.timestamp,
          timezoneOffset: clientData.timezoneOffset,
        }
      }
    });

  } catch (error) {
    console.error('Comprehensive tracking error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Tracking failed',
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

