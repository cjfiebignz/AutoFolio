import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  // Return false during SSR to favor desktop/standard layout as default
  // or until mounted if logic depends on window.
  return mounted ? isMobile : false;
}
