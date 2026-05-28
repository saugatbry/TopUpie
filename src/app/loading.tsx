import React from "react";
import Image from "next/image";

const Loading = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="h-[10.25rem] w-[10.25rem]">
        <Image
          src="/loader.gif"
          alt="Loading..."
          fill
          sizes="10.25rem"
          className="object-contain"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
};

export default Loading;

