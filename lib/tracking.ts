// Types for tracking data
export interface VisitorInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  isp: string;
  connection: string;
  threat: string;
  vpn: boolean;
  proxy: boolean;
}

export interface ClientFingerprint {
  userAgent: string;
  language: string;
  languages: readonly string[];
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
    orientation?: string;
  };
  viewport: {
    width: number;
    height: number;
  };
  timezone: string;
  timezoneOffset: number;
  timestamp: string;
  referrer: string;
  url: string;
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
  };
  webgl?: {
    vendor: string;
    renderer: string;
  };
  canvas?: string;
  fonts?: string[];
  plugins?: string[];
}

export interface GeoLocationData {
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
  threat?: string;
}

// Client-side fingerprinting functions
export class ClientFingerprinter {
  static async generateFingerprint(): Promise<ClientFingerprint> {
    const fingerprint: ClientFingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: screen.orientation?.type,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      url: window.location.href,
      storage: {
        localStorage: this.hasLocalStorage(),
        sessionStorage: this.hasSessionStorage(),
        indexedDB: this.hasIndexedDB(),
      },
    };

    // Add WebGL fingerprint if available
    try {
      fingerprint.webgl = this.getWebGLFingerprint();
    } catch (e) {
      console.warn('WebGL fingerprinting failed:', e);
    }

    // Add Canvas fingerprint if available
    try {
      fingerprint.canvas = await this.getCanvasFingerprint();
    } catch (e) {
      console.warn('Canvas fingerprinting failed:', e);
    }

    // Add font detection if available
    try {
      fingerprint.fonts = await this.getAvailableFonts();
    } catch (e) {
      console.warn('Font detection failed:', e);
    }

    // Add plugin detection
    try {
      fingerprint.plugins = this.getPlugins();
    } catch (e) {
      console.warn('Plugin detection failed:', e);
    }

    return fingerprint;
  }

  private static hasLocalStorage(): boolean {
    try {
      return typeof Storage !== 'undefined' && localStorage !== null;
    } catch {
      return false;
    }
  }

  private static hasSessionStorage(): boolean {
    try {
      return typeof Storage !== 'undefined' && sessionStorage !== null;
    } catch {
      return false;
    }
  }

  private static hasIndexedDB(): boolean {
    try {
      return 'indexedDB' in window;
    } catch {
      return false;
    }
  }

  private static getWebGLFingerprint(): { vendor: string; renderer: string } | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
        || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (!gl) return undefined;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return undefined;

      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      };
    } catch {
      return undefined;
    }
  }

  private static async getCanvasFingerprint(): Promise<string | undefined> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return undefined;

      // Draw a complex pattern for fingerprinting
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Canvas fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Browser fingerprinting', 4, 45);

      // Add some geometric shapes
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      return canvas.toDataURL();
    } catch {
      return undefined;
    }
  }

  private static async getAvailableFonts(): Promise<string[]> {
    const testFonts = [
      // Windows fonts
      'Arial', 'Calibri', 'Cambria', 'Courier New', 'Georgia', 'Impact',
      'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype', 'Tahoma',
      'Times New Roman', 'Trebuchet MS', 'Verdana',
      // Mac fonts
      'American Typewriter', 'Andale Mono', 'Arial Black', 'Arial Narrow',
      'Arial Rounded MT Bold', 'Arial Unicode MS', 'Avenir', 'Avenir Next',
      'Baskerville', 'Big Caslon', 'Bodoni 72', 'Bodoni 72 Oldstyle',
      'Bradley Hand', 'Brush Script MT', 'Chalkboard', 'Chalkboard SE',
      'ChalkboardSE-Regular', 'Cochin', 'Comic Sans MS', 'Copperplate',
      'Courier', 'Didot', 'Futura', 'Geneva', 'Gill Sans', 'Helvetica',
      'Helvetica Neue', 'Herculanum', 'Hoefler Text', 'Lucida Grande',
      'Marker Felt', 'Menlo', 'Monaco', 'Noteworthy', 'Optima',
      'Palatino', 'Papyrus', 'Phosphate', 'Rockwell', 'Savoye LET',
      'SignPainter', 'Skia', 'Snell Roundhand', 'Tahoma', 'Times',
      'Trattatello', 'Zapfino',
      // Linux fonts
      'Ubuntu', 'Liberation Sans', 'Liberation Serif', 'Liberation Mono',
      'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono',
      // Google fonts (commonly loaded)
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
      'Raleway', 'PT Sans', 'Lora', 'Merriweather', 'Nunito Sans'
    ];

    const availableFonts: string[] = [];
    
    for (const font of testFonts) {
      if (await this.isFontAvailable(font)) {
        availableFonts.push(font);
      }
    }

    return availableFonts;
  }

  private static async isFontAvailable(fontName: string): Promise<boolean> {
    try {
      // Create a test element
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const baseFonts = ['monospace', 'sans-serif', 'serif'];

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return false;

      context.font = `${testSize} ${baseFonts[0]}`;
      const baselineSize = context.measureText(testString).width;

      context.font = `${testSize} ${fontName}, ${baseFonts[0]}`;
      const testSize1 = context.measureText(testString).width;

      context.font = `${testSize} ${fontName}, ${baseFonts[1]}`;
      const testSize2 = context.measureText(testString).width;

      return testSize1 !== baselineSize || testSize2 !== baselineSize;
    } catch {
      return false;
    }
  }

  private static getPlugins(): string[] {
    try {
      const plugins: string[] = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push(plugin.name);
      }
      return plugins;
    } catch {
      return [];
    }
  }
}

// Server-side utilities
export class ServerTracker {
  static extractClientIP(request: Request): string {
    // Check various headers for the real IP address
    const headers = request.headers;
    
    // Cloudflare
    const cfConnectingIP = headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;
    
    // Standard forwarded headers
    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    // Real IP header
    const xRealIP = headers.get('x-real-ip');
    if (xRealIP) return xRealIP;
    
    // Other possible headers
    const xClientIP = headers.get('x-client-ip');
    if (xClientIP) return xClientIP;
    
    const xForwarded = headers.get('x-forwarded');
    if (xForwarded) return xForwarded;
    
    const forwardedFor = headers.get('forwarded-for');
    if (forwardedFor) return forwardedFor;
    
    const forwarded = headers.get('forwarded');
    if (forwarded) {
      const match = forwarded.match(/for=([^;,\s]+)/);
      if (match) return match[1];
    }
    
    // Fallback
    return '127.0.0.1';
  }

  static async fetchGeoLocation(ip: string): Promise<GeoLocationData> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting&lang=en`,
      {
        headers: {
          'User-Agent': 'LocationTracker/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Geo API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(`Geo API failed: ${data.status} - ${data.message}`);
    }

    return data;
  }

  static detectVPN(geoData: GeoLocationData, userAgent: string): boolean {
    const vpnIndicators = [
      'vpn', 'proxy', 'tor', 'nord', 'express', 'surfshark', 'cyberghost',
      'private internet access', 'pia', 'tunnelbear', 'hotspot shield',
      'windscribe', 'protonvpn', 'mullvad', 'purevpn', 'ipvanish',
      'hide.me', 'zenmate', 'hola', 'betternet'
    ];
    
    const suspiciousIsps = [
      'digitalocean', 'amazon', 'google cloud', 'microsoft azure',
      'vultr', 'linode', 'ovh', 'hetzner', 'scaleway'
    ];

    const isp = geoData.isp?.toLowerCase() || '';
    const org = geoData.org?.toLowerCase() || '';
    const ua = userAgent.toLowerCase();
    console.log("UA:", ua);

    
    // Check for VPN indicators in ISP/Org names
    const hasVpnIndicator = vpnIndicators.some(indicator => 
      isp.includes(indicator) || org.includes(indicator)
    );

    // Check for hosting/cloud providers
    const isSuspiciousIsp = suspiciousIsps.some(provider => 
      isp.includes(provider) || org.includes(provider)
    );

    // Check API flags
    const hasProxyFlag = geoData.proxy || geoData.hosting;

    return hasVpnIndicator || hasProxyFlag || isSuspiciousIsp;
  }

  static getThreatLevel(geoData: GeoLocationData, isVPN: boolean, userAgent: string): string {
    // Check for known threat indicators
    if (geoData.threat && geoData.threat !== 'low') {
      return geoData.threat;
    }

    // VPN/Proxy usage increases threat level
    if (isVPN || geoData.proxy) {
      return 'medium';
    }

    // Hosting providers are suspicious
    if (geoData.hosting) {
      return 'medium';
    }

    // Check for suspicious user agents
    const suspiciousUAPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
      'java', 'php', 'ruby', 'perl', 'go-http-client', 'okhttp'
    ];

    const ua = userAgent.toLowerCase();
    const hasSuspiciousUA = suspiciousUAPatterns.some(pattern => ua.includes(pattern));
    
    if (hasSuspiciousUA) {
      return 'medium';
    }

    return 'low';
  }

  static getConnectionType(userAgent: string, geoData: GeoLocationData): string {
    if (geoData.mobile) return 'Mobile';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile')) return 'Mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
    if (ua.includes('smart-tv') || ua.includes('tv')) return 'Smart TV';
    if (ua.includes('playstation') || ua.includes('xbox') || ua.includes('nintendo')) return 'Gaming Console';
    
    return 'Broadband';
  }

  static generateDeviceFingerprint(userAgent: string, headers: Record<string, string>): string {
    const fingerprintData = [
      userAgent,
      headers['accept-language'] || '',
      headers['accept-encoding'] || '',
      headers['accept'] || '',
      headers['dnt'] || '',
      headers['upgrade-insecure-requests'] || ''
    ].join('|');

    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

// Privacy analysis utilities
export class PrivacyAnalyzer {
  static analyzePrivacyLevel(visitorData: VisitorInfo, fingerprint: ClientFingerprint): {
    score: number;
    level: 'low' | 'medium' | 'high';
    concerns: string[];
    recommendations: string[];
  } {
    let score = 0;
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // VPN/Proxy analysis
    if (visitorData.vpn) {
      score += 20;
      concerns.push('VPN detected - attempting to hide real location');
    } else {
      concerns.push('No VPN protection - real location exposed');
      recommendations.push('Consider using a VPN for better privacy');
    }

    // Browser fingerprinting
    if (fingerprint.canvas) {
      score -= 15;
      concerns.push('Canvas fingerprinting possible');
      recommendations.push('Use browser extensions to block canvas fingerprinting');
    }

    if (fingerprint.webgl) {
      score -= 10;
      concerns.push('WebGL fingerprinting detected');
      recommendations.push('Disable WebGL in browser settings');
    }

    if (fingerprint.fonts && fingerprint.fonts.length > 20) {
      score -= 10;
      concerns.push('Large font collection increases fingerprint uniqueness');
    }

    // Tracking protection
    const dntEnabled = fingerprint.userAgent.includes('DNT') || 
                      fingerprint.userAgent.includes('Do Not Track');
    if (!dntEnabled) {
      score -= 5;
      concerns.push('Do Not Track not enabled');
      recommendations.push('Enable Do Not Track in browser settings');
    }

    // Determine privacy level
    let level: 'low' | 'medium' | 'high';
    if (score >= 50) level = 'high';
    else if (score >= 20) level = 'medium';
    else level = 'low';

    return { score: Math.max(0, Math.min(100, score)), level, concerns, recommendations };
  }
}