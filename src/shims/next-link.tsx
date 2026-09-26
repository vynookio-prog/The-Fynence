import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  to?: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, to, children, ...props }, ref) => {
    const target = href || to || '/';

    // If external link, anchor hash, or mailto, render standard <a>
    if (
      typeof target === 'string' &&
      (target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('#') ||
        target.startsWith('mailto:'))
    ) {
      return (
        <a ref={ref} href={target} {...props}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink ref={ref} to={target} {...(props as any)}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = 'Link';
export default Link;
