'use client'

import { useEffect, useRef } from 'react'

interface Props {
  widgetUrl: string
  niche: string
}

export default function GptWidget({ widgetUrl, niche }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any previous widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = widgetUrl
    script.async = true
    script.id = 'gpt-widget-script'
    containerRef.current.appendChild(script)

    return () => {
      const existing = document.getElementById('gpt-widget-script')
      if (existing) existing.remove()
    }
  }, [widgetUrl, niche])

  return <div ref={containerRef} className="gpt-widget-container" style={{ width: '100%', height: '100%' }} />
}