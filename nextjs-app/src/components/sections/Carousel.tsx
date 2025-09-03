export default function Carousel() {
  return (
    // Cancel the global header spacer so the hero starts at the very top (mobile + desktop)
    <section className="relative -mt-20 md:-mt-24">
      {/* Full-viewport hero on desktop, comfortable height on mobile */}
      <div className="relative w-full overflow-hidden hero-viewport">
        <video
          muted
          loop
          playsInline
          autoPlay
          id="background-video"
          className="absolute inset-0 h-full w-full object-cover blur-sm"
        >
          <source src="/outils/images/video_drone.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        {/* Centered copy; larger, responsive typography */}
        <div className="relative z-10 mx-auto flex h-full max-w-5xl items-center px-4 sm:px-6 text-white">
          <div>
            <h1 className="drop-shadow text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight break-words">
              Le <span className="text-primary">syndic</span> local et efficace.
            </h1>
            <h2 className="mt-4 drop-shadow text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold">Une réponse en 48h garantie.</h2>
          </div>
        </div>
        <a href="#features" className="scroll-arrow" aria-label="Défiler vers le bas">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5"></path>
            <path d="M7 6l5 5 5-5"></path>
          </svg>
        </a>
      </div>
    </section>
  )
}
