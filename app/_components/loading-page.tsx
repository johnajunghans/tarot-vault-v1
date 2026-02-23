export default function LoadingScreen() {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow" />
          <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow delay-200" />
          <div className="w-2 h-2 rotate-45 bg-gold animate-pulse-glow delay-500" />
        </div>
      </div>
    );
  }