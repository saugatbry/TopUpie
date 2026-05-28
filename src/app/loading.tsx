import React from "react";
import Image from "next/image";

const Loading = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="h-16 w-16">
        <Image
          src="/loader.gif"
          alt="Loading..."
          fill
          sizes="4rem"
          className="object-contain"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
};

export default Loading;

