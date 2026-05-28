import React from "react";
import Image from "next/image";

const Loading = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#121212]">
      <div className="h-8 w-8">
        <Image
          src="/loader.gif"
          alt="Loading..."
          fill
          sizes="2rem"
          className="object-contain"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
};

export default Loading;

