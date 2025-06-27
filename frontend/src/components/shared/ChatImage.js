import Image from 'next/image';

const ChatImage = ({ src, alt, width = 40, height = 40, ...rest }) => {
  const isExternal =
    typeof src === 'string' &&
    (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:'));
  return (
    <Image src={src} alt={alt} width={width} height={height} unoptimized={isExternal} {...rest} />
  );
};

export default ChatImage;
