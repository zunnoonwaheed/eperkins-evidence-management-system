import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxWidth?: string;
}

/**
 * PageContainer - Reusable wrapper for page content
 * Provides consistent spacing and max-width constraints
 */
export default function PageContainer({
  children,
  className,
  style,
  maxWidth = '800px',
}: PageContainerProps) {
  const containerStyle = maxWidth
    ? { ...style, maxWidth }
    : style;

  return (
    <div className={`wrap ${className || ''}`} style={containerStyle}>
      {children}
    </div>
  );
}
