import Image from "next/image";
import genkai from "@/assets/genkai.gif";

const Loading = () => {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "clamp(90px, 14vw, 130px)",
          height: "clamp(90px, 14vw, 130px)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid rgba(233, 55, 107, 0.15)",
            borderTopColor: "#e9376b",
            borderRightColor: "#e9376b",
            animation: "loader-spin 0.8s linear infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "clamp(54px, 8vw, 80px)",
            height: "clamp(54px, 8vw, 80px)",
            background:
              "radial-gradient(circle, rgba(233, 55, 107, 0.15) 0%, transparent 70%)",
            animation: "loader-pulse 2s ease-in-out infinite",
          }}
        />
        <Image
          src={genkai}
          alt="Loading..."
          unoptimized
          priority
          style={{
            width: "clamp(70px, 11vw, 100px)",
            height: "clamp(70px, 11vw, 100px)",
            objectFit: "contain",
            animation: "loader-float 3s ease-in-out infinite",
            position: "relative",
            zIndex: 10,
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
