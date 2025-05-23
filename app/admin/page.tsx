'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Globe, 
  Shield, 
  Activity,
  MapPin,
  Monitor,
  Clock,
  TrendingUp,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface Visitor {
  id: string;
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
  visitedAt: string;
}

interface DashboardStats {
  totalVisitors: number;
  uniqueCountries: number;
  uniqueDevices: number;
  recentVisitors: Visitor[];
  topCountries: Array<{ country: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-white">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Error Loading Dashboard</h2>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Eye className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Surveillance Dashboard</h1>
                <p className="text-slate-300">Real-time visitor tracking & analytics</p>
              </div>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              LIVE MONITORING
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Visitors</p>
                  <p className="text-3xl font-bold text-blue-400">{stats?.totalVisitors || 0}</p>
                </div>
                <Users className="w-12 h-12 text-blue-400 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Countries</p>
                  <p className="text-3xl font-bold text-green-400">{stats?.uniqueCountries || 0}</p>
                </div>
                <Globe className="w-12 h-12 text-green-400 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Device Types</p>
                  <p className="text-3xl font-bold text-purple-400">{stats?.uniqueDevices || 0}</p>
                </div>
                <Monitor className="w-12 h-12 text-purple-400 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-orange-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Now</p>
                  <p className="text-3xl font-bold text-orange-400">{stats?.recentVisitors.length || 0}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Countries */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-300">
                <MapPin className="w-5 h-5" />
                <span>Top Countries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-white">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400 rounded-full" 
                          style={{ 
                            width: `${(country.count / (stats?.totalVisitors || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-blue-300 font-mono text-sm w-8">{country.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Browsers */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-300">
                <Monitor className="w-5 h-5" />
                <span>Top Browsers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topBrowsers.map((browser, index) => (
                  <div key={browser.browser} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-white truncate max-w-32">{browser.browser}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-400 rounded-full" 
                          style={{ 
                            width: `${(browser.count / (stats?.totalVisitors || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-green-300 font-mono text-sm w-8">{browser.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Visitors */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-300">
              <Clock className="w-5 h-5" />
              <span>Recent Visitors</span>
              <Badge variant="destructive" className="ml-auto">
                LIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left py-3 px-2">Time</th>
                    <th className="text-left py-3 px-2">IP Address</th>
                    <th className="text-left py-3 px-2">Location</th>
                    <th className="text-left py-3 px-2">Device</th>
                    <th className="text-left py-3 px-2">Browser</th>
                    <th className="text-left py-3 px-2">OS</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentVisitors.map((visitor) => (
                    <tr key={visitor.id} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-2 text-slate-300 font-mono text-xs">
                        {new Date(visitor.visitedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-mono text-red-300">{visitor.ip}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          <span className="text-white text-xs">
                            {visitor.city}, {visitor.country}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary" className="text-xs">
                          {visitor.device}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-white text-xs max-w-32 truncate">
                        {visitor.browser}
                      </td>
                      <td className="py-3 px-2 text-white text-xs max-w-32 truncate">
                        {visitor.os}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Surveillance System Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 animate-pulse text-green-400" />
              <span className="text-sm">Real-time Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}