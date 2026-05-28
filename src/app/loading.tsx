const Loading = () => {
  return (
    <div className="flex items-center justify-center pt-[15vh]">
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "clamp(80px, 12vw, 120px)",
          height: "clamp(80px, 12vw, 120px)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid rgba(233, 55, 107, 0.15)",
            borderTopColor: "#e9376b",
            animation: "loader-spin 0.8s linear infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "clamp(48px, 7vw, 72px)",
            height: "clamp(48px, 7vw, 72px)",
            background: "radial-gradient(circle, rgba(233, 55, 107, 0.2) 0%, transparent 70%)",
            animation: "loader-pulse 2s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: "loader-glow 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
};

export default Loading;
