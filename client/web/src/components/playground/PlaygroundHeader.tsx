type PlaygroundHeader = {
  height: number;
};

export const PlaygroundHeader = ({ height }: PlaygroundHeader) => {
  return (
    <div
      className={`relative z-50 flex gap-4 pt-16 px-4 lg:px-12 text-groq-content-text w-full justify-center items-center shrink-0 bg-groq-content-bg`}
      style={{
        height: height + "px",
      }}
    >
      <div className="flex w-full justify-between text-white">
        <a href="https://console.groq.com/" target="_blank">
          <img
            width="108px"
            height="auto"
            src="/groq-logo.svg"
            alt="Groq logo"
          />
        </a>
        <a
          href="https://docs.livekit.io/agents"
          target="_blank"
          className="flex gap-2 items-center pb-8 hover:opacity-80 transition-all"
        >
          <span className="text-base">Built with</span>
          <img src="/logo.svg" width="72px" alt="LiveKit logo" />
        </a>
      </div>
    </div>
  );
};
