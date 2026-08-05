import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VisionFlow — Intelligent Video Analytics',
  description:
    'Computer vision platform that detects and tracks people in videos using YOLO, OpenCV and FFmpeg.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
