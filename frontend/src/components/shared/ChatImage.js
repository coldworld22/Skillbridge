import Image from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_AVATAR = "/images/default-avatar.png";

const ChatImage = ({ src, alt, width = 40, height = 40, ...rest }) => {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_AVATAR);

  useEffect(() => {
    setImgSrc(src || DEFAULT_AVATAR);
  }, [src]);

  const isExternal =
    typeof imgSrc === "string" &&
    (imgSrc.startsWith("http") || imgSrc.startsWith("blob:") || imgSrc.startsWith("data:"));

  return (
    <Image
      src={imgSrc || DEFAULT_AVATAR}
      alt={alt}
      width={width}
      height={height}
      unoptimized={isExternal}
      onError={() => {
        if (imgSrc !== DEFAULT_AVATAR) {
          setImgSrc(DEFAULT_AVATAR);
        }
      }}
      {...rest}
    />
  );
};

export default ChatImage;
