'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Monitor, 

  Eye,
  Wifi,
  Activity,
  Shield,
  Zap
} from 'lucide-react';

interface VisitorData {
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

export default function HomePage() {
  const [isTracking, setIsTracking] = useState(true);
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // Collect client-side data
        const clientData = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          url: window.location.href
        };

        // Send to API
        const response = await fetch('/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });

        if (response.ok) {
          const data = await response.json();
          setVisitorData(data.visitorInfo);
        }
      } catch (error) {
        console.error('Tracking failed:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsTracking(false), 2000);
      }
    };

    trackVisitor();
  }, []);

  if (isLoading || isTracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800 flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border-2 border-red-400 animate-ping"></div>
              <div className="absolute inset-4 rounded-full border border-red-300 animate-spin"></div>
              <Eye className="absolute inset-0 m-auto w-16 h-16 text-red-400 animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black text-red-500 tracking-wider animate-pulse">
              TRACKING...
            </h1>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-red-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-red-300 text-xl font-mono">
              Collecting your digital fingerprint...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-black text-white">
      {/* Main Message */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent"></div>
        <div className="container mx-auto px-6 py-20 text-center relative z-10">
          <div className="space-y-6">
            <Badge variant="destructive" className="text-lg px-6 py-2 font-mono">
              <Shield className="w-5 h-5 mr-2" />
              SURVEILLANCE ACTIVE
            </Badge>
            
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 tracking-wider drop-shadow-2xl animate-pulse">
              I GOT YOUR
            </h1>
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 tracking-wider drop-shadow-2xl">
              LOCATION
            </h1>
            
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Activity className="w-8 h-8 text-red-400 animate-pulse" />
              <p className="text-2xl font-mono text-red-300">
                Your digital footprint has been captured
              </p>
              <Activity className="w-8 h-8 text-red-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Display */}
      {visitorData && (
        <div className="container mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Location Card */}
            <Card className="bg-slate-800/50 border-red-800 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MapPin className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-bold text-red-300">Location</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">IP Address:</span>
                    <span className="font-mono text-red-300">{visitorData.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white">{visitorData.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Region:</span>
                    <span className="text-white">{visitorData.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">City:</span>
                    <span className="text-white">{visitorData.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coordinates:</span>
                    <span className="font-mono text-red-300">
                      {visitorData.latitude.toFixed(4)}, {visitorData.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Card */}
            <Card className="bg-slate-800/50 border-red-800 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Monitor className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-bold text-red-300">Device</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Device Type:</span>
                    <span className="text-white">{visitorData.device}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Operating System:</span>
                    <span className="text-white">{visitorData.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Browser:</span>
                    <span className="text-white">{visitorData.browser}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">VPN:</span>
                    <Badge variant={visitorData.vpn ? "destructive" : "secondary"}>
                      {visitorData.vpn ? "Detected" : "None"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Proxy:</span>
                    <Badge variant={visitorData.proxy ? "destructive" : "secondary"}>
                      {visitorData.proxy ? "Detected" : "None"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Card */}
            <Card className="bg-slate-800/50 border-red-800 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Wifi className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-bold text-red-300">Network</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ISP:</span>
                    <span className="text-white">{visitorData.isp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connection:</span>
                    <span className="text-white">{visitorData.connection}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timezone:</span>
                    <span className="text-white">{visitorData.timezone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Threat Level:</span>
                    <Badge variant={visitorData.threat === 'low' ? "secondary" : "destructive"}>
                      {visitorData.threat.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Agent Card - Full Width */}
            <Card className="bg-slate-800/50 border-red-800 backdrop-blur-sm md:col-span-2 lg:col-span-3">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-bold text-red-300">Digital Fingerprint</h3>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-xs font-mono text-gray-300 break-all leading-relaxed">
                    {visitorData.userAgent}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warning Message */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-3 bg-red-900/30 border border-red-700 rounded-lg px-8 py-4">
              <Eye className="w-6 h-6 text-red-400" />
              <p className="text-red-300 font-mono text-lg">
                Your privacy is an illusion. Every click is tracked.
              </p>
              <Eye className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}