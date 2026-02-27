/**
 * SVG Brand Icons for Connector Integrations
 *
 * Proper brand-accurate SVG icons instead of emoji placeholders.
 * Each icon is a React component that accepts className for sizing/color.
 */

import React from 'react';

interface IconProps {
    className?: string;
}

export function SlackIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
            <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
            <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
            <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E" />
        </svg>
    );
}

export function JiraIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" fill="#2684FF" />
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" fill="url(#jira-a)" fillOpacity="0.08" />
            <path d="M17.357 5.729H5.786a5.218 5.218 0 0 0 5.232 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.734a1.005 1.005 0 0 0-1.005-1.005z" fill="#2684FF" />
            <path d="M23.143 0H11.571a5.217 5.217 0 0 0 5.214 5.215h2.13v2.057A5.215 5.215 0 0 0 24.128 12.5V1.005A1.005 1.005 0 0 0 23.143 0z" fill="#2684FF" />
            <defs>
                <linearGradient id="jira-a" x1="11.3" y1="12.3" x2="7" y2="17" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0052CC" />
                    <stop offset="1" stopColor="#2684FF" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function NotionIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.03 2.109c-.466-.373-.84-.56-1.773-.467l-12.836.933c-.466.047-.56.28-.373.466l1.411 1.167zm.793 3.267v13.962c0 .746.373 1.026 1.213.98l14.523-.84c.84-.046.933-.56.933-1.166V6.568c0-.606-.233-.933-.746-.886l-15.177.886c-.56.047-.746.327-.746.887zm14.337.419c.093.42 0 .84-.42.887l-.7.14v10.322c-.607.327-1.166.513-1.633.513-.746 0-.933-.233-1.493-.933l-4.571-7.179v6.946l1.447.326s0 .84-1.166.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V8.381l-1.166-.093c-.094-.42.14-1.026.793-1.073l3.453-.233 4.758 7.272v-6.433l-1.213-.14c-.094-.466.233-.84.653-.886l3.313-.207zm-15.83-5.703L17.124.935c1.4-.14 1.773-.047 2.66.606l3.64 2.567c.606.42.793.607.793 1.12v16.576c0 1.026-.373 1.633-1.68 1.726l-15.457.933c-.98.047-1.446-.093-1.96-.746L1.66 19.83c-.56-.747-.793-1.307-.793-1.96V3.1c0-.84.373-1.54 1.893-1.72v.01z" fillRule="evenodd" />
        </svg>
    );
}

export function GongIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="11" stroke="#7C3AED" strokeWidth="2" />
            <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.4c-3.53 0-6.4-2.87-6.4-6.4S8.47 5.6 12 5.6s6.4 2.87 6.4 6.4-2.87 6.4-6.4 6.4z" fill="#7C3AED" />
            <circle cx="12" cy="12" r="3.5" fill="#7C3AED" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function ConfluenceIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M2.146 17.24c-.248.397-.538.863-.776 1.224a.577.577 0 0 0 .183.794l3.608 2.206a.577.577 0 0 0 .793-.176c.214-.345.483-.793.774-1.282 1.69-2.845 3.396-2.506 6.458-1.127l3.475 1.565a.577.577 0 0 0 .763-.3l1.83-4.07a.577.577 0 0 0-.282-.756c-.872-.397-2.397-1.09-3.483-1.565-4.965-2.196-9.127-2.065-13.343 3.487z" fill="#1868DB" />
            <path d="M21.854 6.76c.248-.397.538-.863.776-1.224a.577.577 0 0 0-.183-.794L18.839 2.536a.577.577 0 0 0-.793.176c-.214.345-.483.793-.774 1.282-1.69 2.845-3.396 2.506-6.458 1.127L7.339 3.556a.577.577 0 0 0-.763.3L4.746 7.926a.577.577 0 0 0 .282.756c.872.397 2.397 1.09 3.483 1.565 4.965 2.197 9.127 2.065 13.343-3.487z" fill="#1868DB" />
        </svg>
    );
}

export function PageIndexIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="2" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="18" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 21l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/** Map connector type to its icon component */
export const CONNECTOR_ICONS: Record<string, React.FC<IconProps>> = {
    slack: SlackIcon,
    jira: JiraIcon,
    notion: NotionIcon,
    gong: GongIcon,
    confluence: ConfluenceIcon,
    pageindex: PageIndexIcon,
};
