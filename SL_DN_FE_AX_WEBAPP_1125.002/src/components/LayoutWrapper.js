"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";

export default function LayoutWrapper({ children }) {
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.warn("NEXT_PUBLIC_API_URL is not configured");
          return;
        }

        const response = await fetch(`${apiUrl}/ss`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          console.warn(`API returned status ${response.status}`);
          return;
        }

        const data = await response.json();
        const companyDetails = data.company_details?.[0];
        if (companyDetails?.background_image && typeof document !== 'undefined') {
          // Apply background image directly to DOM element to avoid hydration issues
          const layoutElement = document.querySelector('[data-layout-wrapper]');
          if (layoutElement) {
            layoutElement.style.backgroundImage = `url(${apiUrl}/company/image/file/background/${companyDetails.background_image})`;
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn("Fetch request timed out");
        } else {
          console.warn("Failed to fetch company details:", error.message);
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    fetchCompanyDetails();
  }, []);

  return (
    <div
      data-layout-wrapper
      suppressHydrationWarning
      style={{
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
}
