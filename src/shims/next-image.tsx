import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt = '',
  width,
  height,
  fill,
  priority: _priority,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  className,
  ...props
}) => {
  const imageStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        width: '100%',
        height: '100%',
        inset: 0,
        objectFit: 'cover',
        ...style,
      }
    : { ...style };

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={imageStyle}
      className={className}
      {...props}
    />
  );
};

export default Image;
