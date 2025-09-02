export default function Carousel() {
  return (
    <section className="relative">
      <div className="relative h-[80vh] w-full overflow-hidden">
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
        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-24 text-white">
          <h1 className="text-5xl font-bold drop-shadow">Le syndic local et efficace.</h1>
          <h2 className="mt-4 text-3xl font-semibold drop-shadow">Une réponse en 48h garantie.</h2>
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
