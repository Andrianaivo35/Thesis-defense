'use client'

import { useState } from 'react'
import { StyleSheetManager } from 'styled-components'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet } from 'styled-components'

export default function StyledComponentsRegistry({ children }) {
  const [styledComponentsStyleSheet] = useState(
    () => new ServerStyleSheet()
  )

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  if (typeof window !== 'undefined') {
    return <>{children}</>
  }

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  )
}
