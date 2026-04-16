import React, { useState } from 'react';
import { Download, Smartphone, Monitor, Gamepad2, Globe, CheckCircle, Star, Trophy, Users, Zap } from 'lucide-react';

const ProductsPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('web');

  const platforms = {
    web: {
      icon: Globe,
      name: 'Web Browser',
      description: 'Play instantly in any modern browser',
      features: [
        'No installation required',
        'Cross-platform compatible',
        'Auto-updates',
        'Cloud save',
        'Instant access'
      ],
      requirements: {
        browser: 'Chrome 90+, Firefox 88+, Safari 14+, Edge 90+',
        connection: 'Broadband internet',
        storage: 'None required'
      },
      button: {
        text: 'Play Now',
        link: '/play',
        color: 'from-cyan-500 to-blue-500'
      }
    },
    
    mobile: {
      icon: Smartphone,
      name: 'Mobile App',
      description: 'Play on the go with iOS and Android',
      features: [
        'Touch-optimized controls',
        'Offline mode available',
        'Push notifications',
        'Cloud sync across devices',
        'Mobile-optimized graphics'
      ],
      requirements: {
        ios: 'iOS 14.0 or later, iPhone 8 or newer',
        android: 'Android 8.0 or later, 2GB RAM minimum',
        storage: '1.5 GB available space'
      },
      button: {
        text: 'Download for Mobile',
        downloads: [
          { platform: 'App Store', link: '/download/ios', available: false },
          { platform: 'Google Play', link: '/download/android', available: false }
        ],
        color: 'from-purple-500 to-pink-500'
      },
      comingSoon: true
    },
    
    desktop: {
      icon: Monitor,
      name: 'Desktop App',
      description: 'Full-featured desktop experience',
      features: [
        'Native performance',
        'Gamepad support',
        'Offline play',
        'High-quality graphics',
        'Keyboard & mouse optimized'
      ],
      requirements: {
        windows: 'Windows 10/11 (64-bit)',
        mac: 'macOS 11 Big Sur or later',
        linux: 'Ubuntu 20.04+ or equivalent',
        specs: 'Intel i5 / Ryzen 5, 8GB RAM, 2GB storage'
      },
      button: {
        text: 'Download for Desktop',
        downloads: [
          { platform: 'Windows', link: '/download/windows.exe', available: false },
          { platform: 'macOS', link: '/download/macos.dmg', available: false },
          { platform: 'Linux', link: '/download/linux.AppImage', available: false }
        ],
        color: 'from-green-500 to-emerald-500'
      },
      comingSoon: true
    },
    
    console: {
      icon: Gamepad2,
      name: 'Game Consoles',
      description: 'Premium console experience',
      features: [
        'Controller support',
        'Couch co-op',
        '4K graphics (PS5/Xbox Series X)',
        'Achievement system',
        'Console-exclusive features'
      ],
      requirements: {
        playstation: 'PlayStation 5, PlayStation 4 Pro',
        xbox: 'Xbox Series X/S, Xbox One X',
        nintendo: 'Nintendo Switch (planned)',
        storage: '5 GB available space'
      },
      button: {
        text: 'Get on Console',
        downloads: [
          { platform: 'PlayStation Store', link: '/download/ps5', available: false },
          { platform: 'Microsoft Store', link: '/download/xbox', available: false },
          { platform: 'Nintendo eShop', link: '/download/switch', available: false }
        ],
        color: 'from-red-500 to-orange-500'
      },
      comingSoon: true
    }
  };

  const stats = [
    { icon: Users, value: '1M+', label: 'Active Players' },
    { icon: Trophy, value: '50M+', label: 'Matches Played' },
    { icon: Star, value: '4.8/5', label: 'Average Rating' },
    { icon: Zap, value: '<50ms', label: 'Server Latency' }
  ];

  const features = [
    {
      title: 'Real Teams & Players',
      description: 'Play with authentic teams from Premier League, La Liga, Serie A, Bundesliga, and more',
      icon: '⚽'
    },
    {
      title: 'AI-Powered Opponents',
      description: 'Face intelligent AI that adapts to your playstyle with multiple difficulty levels',
      icon: '🤖'
    },
    {
      title: 'Online Multiplayer',
      description: 'Compete against players worldwide in real-time matches',
      icon: '🌐'
    },
    {
      title: 'Career Mode',
      description: 'Build your legacy through tournaments and seasons',
      icon: '🏆'
    },
    {
      title: 'Realistic Celebrations',
      description: 'Experience authentic goal celebrations from your favorite players',
      icon: '🎉'
    },
    {
      title: 'Regular Updates',
      description: 'Weekly roster updates, new features, and seasonal content',
      icon: '🔄'
    }
  ];

  const PlatformIcon = platforms[selectedPlatform].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/field-bg.jpg')] opacity-10 bg-cover bg-center"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-12">
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              NEON FIFA PRO
            </div>
            <div className="flex gap-4">
              <a href="/play" className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-semibold transition-colors">
                Play Now
              </a>
              <a href="/about" className="px-6 py-2 border border-purple-500 hover:bg-purple-500/20 text-purple-300 rounded-lg font-semibold transition-colors">
                Learn More
              </a>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Future of Football Gaming
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Experience FIFA-quality football with real teams, players, and competitions. 
              Play anywhere, on any device.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-purple-500/30">
                  <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          Choose Your Platform
        </h2>

        {/* Platform Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {Object.entries(platforms).map(([key, platform]) => {
            const Icon = platform.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedPlatform(key)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedPlatform === key
                    ? 'border-cyan-400 bg-cyan-900/30 shadow-lg shadow-cyan-500/50'
                    : 'border-slate-700 bg-slate-800/50 hover:border-purple-500'
                }`}
              >
                <Icon className={`w-12 h-12 mx-auto mb-3 ${
                  selectedPlatform === key ? 'text-cyan-400' : 'text-slate-400'
                }`} />
                <div className={`font-semibold ${
                  selectedPlatform === key ? 'text-cyan-400' : 'text-slate-300'
                }`}>
                  {platform.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Platform Details */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-purple-500/30 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - Description */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl">
                  <PlatformIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    {platforms[selectedPlatform].name}
                  </h3>
                  <p className="text-slate-400">
                    {platforms[selectedPlatform].description}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Features</h4>
                <div className="space-y-3">
                  {platforms[selectedPlatform].features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Button */}
              {platforms[selectedPlatform].comingSoon ? (
                <div className="space-y-4">
                  <div className="px-6 py-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-yellow-400 text-center font-semibold">
                    Coming Soon
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    Sign up to be notified when {platforms[selectedPlatform].name} becomes available
                  </p>
                  <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors">
                    Notify Me
                  </button>
                </div>
              ) : platforms[selectedPlatform].button.downloads ? (
                <div className="space-y-3">
                  {platforms[selectedPlatform].button.downloads.map((download, index) => (
                    <a
                      key={index}
                      href={download.link}
                      className={`block px-6 py-4 bg-gradient-to-r ${platforms[selectedPlatform].button.color} hover:shadow-lg text-white rounded-lg font-semibold transition-all text-center ${
                        !download.available && 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={(e) => !download.available && e.preventDefault()}
                    >
                      <Download className="w-5 h-5 inline mr-2" />
                      {download.platform}
                      {!download.available && ' (Coming Soon)'}
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  href={platforms[selectedPlatform].button.link}
                  className={`block px-8 py-4 bg-gradient-to-r ${platforms[selectedPlatform].button.color} hover:shadow-lg text-white rounded-lg font-bold text-lg transition-all text-center`}
                >
                  {platforms[selectedPlatform].button.text}
                </a>
              )}
            </div>

            {/* Right Column - Requirements */}
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">System Requirements</h4>
              <div className="bg-slate-900/50 rounded-xl p-6 space-y-4">
                {Object.entries(platforms[selectedPlatform].requirements).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-cyan-400 text-sm font-semibold uppercase mb-1">
                      {key.replace('_', ' ')}
                    </div>
                    <div className="text-slate-300">{value}</div>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-blue-300 font-semibold mb-1">Free to Play</div>
                    <div className="text-sm text-blue-200">
                      Start playing immediately with no upfront cost. Optional in-game purchases available.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          Why Neon FIFA Pro?
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-800/50 backdrop-blur rounded-xl border border-purple-500/30 p-6 hover:border-cyan-500/50 transition-colors">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-y border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Play?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join millions of players worldwide and experience the future of football gaming.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/play"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50 text-white rounded-lg font-bold text-lg transition-all"
            >
              Play Free Now
            </a>
            <a
              href="/register"
              className="px-8 py-4 border-2 border-purple-500 hover:bg-purple-500/20 text-purple-300 rounded-lg font-bold text-lg transition-all"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Neon FIFA Pro</h3>
              <p className="text-slate-400 text-sm">
                The next generation of football gaming.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platforms</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#web" className="hover:text-cyan-400">Web Browser</a></li>
                <li><a href="#mobile" className="hover:text-cyan-400">Mobile Apps</a></li>
                <li><a href="#desktop" className="hover:text-cyan-400">Desktop</a></li>
                <li><a href="#console" className="hover:text-cyan-400">Consoles</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/help" className="hover:text-cyan-400">Help Center</a></li>
                <li><a href="/faq" className="hover:text-cyan-400">FAQ</a></li>
                <li><a href="/contact" className="hover:text-cyan-400">Contact Us</a></li>
                <li><a href="/feedback" className="hover:text-cyan-400">Feedback</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/terms" className="hover:text-cyan-400">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-cyan-400">Privacy Policy</a></li>
                <li><a href="/licenses" className="hover:text-cyan-400">Licenses</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            <p>© 2024 Neon FIFA Pro. All rights reserved.</p>
            <p className="mt-2 text-xs">
              This is an independent game. Not affiliated with FIFA, EA Sports, or any football organization.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductsPage;
