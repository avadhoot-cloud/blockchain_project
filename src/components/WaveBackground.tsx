const WaveBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg
      className="absolute bottom-0 left-0 w-full opacity-[0.06] animate-wave-drift"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="hsl(var(--primary))"
        d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
    <svg
      className="absolute bottom-0 left-0 w-full opacity-[0.04]"
      style={{ animation: 'wave-drift 12s ease-in-out infinite reverse' }}
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="hsl(var(--accent))"
        d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
    {/* Grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
  </div>
);

export default WaveBackground;
