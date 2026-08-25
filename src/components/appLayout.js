'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import styled from 'styled-components'
import { getUtilisateur } from '@/lib/auth'

const MainContent = styled.main`
  min-height: 100vh;
  transition: padding 0.3s ease;

  /* Décale le contenu à droite pour laisser place à la sidebar sur desktop */
  @media (min-width: 769px) {
    padding-left: ${p => p.$hasSidebar ? '240px' : '0'};
  }
`

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const [hasSidebar, setHasSidebar] = useState(false)

  useEffect(() => {
    // Re-vérifie à chaque changement de page (utile après login/logout)
    const user = getUtilisateur()
    setHasSidebar(!!user)
  }, [pathname])

  return <MainContent $hasSidebar={hasSidebar}>{children}</MainContent>
}