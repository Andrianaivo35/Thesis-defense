'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getUtilisateur, logout } from '@/lib/auth'
import Image from 'next/image'
import {
  LayoutDashboard, Search, MessageCircle, User, LogOut, Menu, X
} from 'lucide-react'
import {
  MobileHeader, MobileLogoArea, MobileLogoMark, MobileLogoText, HamburgerButton,
  Overlay,
  UniversiteSidebar, SidebarLogoArea, SidebarLogoMark, SidebarLogoText,
  SidebarCloseButton,
  UniversiteMenu, UniversiteMenuLink, UniversiteLogoutButton
} from '@/components/styleUniversiteNavbar'

export default function UniversiteNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUtilisateur()

  const idUniversite = user?.idUniversite

  const [isOpen, setIsOpen] = useState(false)

  // Fermer le menu automatiquement quand on change de page (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Bloquer le scroll du body quand la sidebar mobile est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
  }

  const navigate = (path) => {
    router.push(path)
    setIsOpen(false)
  }

  const isActive = (path) => pathname?.startsWith(path)

  return (
    <>
      {/* === HEADER MOBILE === */}
      <MobileHeader>
        <HamburgerButton onClick={() => setIsOpen(true)} aria-label="Ouvrir le menu">
          <Menu size={22} strokeWidth={2} />
        </HamburgerButton>
        <MobileLogoArea onClick={() => router.push('/pages/universiteDashboard')}>
          <MobileLogoMark>SS</MobileLogoMark>
          <MobileLogoText>Stage Share</MobileLogoText>
        </MobileLogoArea>
      </MobileHeader>

      {/* === OVERLAY SOMBRE === */}
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}

      {/* === SIDEBAR === */}
      <UniversiteSidebar $isOpen={isOpen}>
        <SidebarLogoArea onClick={() => navigate('/pages/universiteDashboard')}>
          <Image
            src="/images/14.png"
            width={100}
            height={100}
            alt='logo'
          />
          <SidebarLogoText>Stage Share</SidebarLogoText>
        </SidebarLogoArea>

        <SidebarCloseButton onClick={() => setIsOpen(false)} aria-label="Fermer le menu">
          <X size={20} strokeWidth={2} />
        </SidebarCloseButton>

        <UniversiteMenu>
          <UniversiteMenuLink
            $active={isActive('/pages/universiteDashboard')}
            onClick={() => navigate('/pages/universiteDashboard')}
          >
            <LayoutDashboard size={18} strokeWidth={2} />
            Tableau de bord
          </UniversiteMenuLink>

          <UniversiteMenuLink
            $active={isActive('/pages/universiteRecherche')}
            onClick={() => navigate('/pages/universiteRecherche')}
          >
            <Search size={18} strokeWidth={2} />
            Trouver
          </UniversiteMenuLink>

          <UniversiteMenuLink
            $active={isActive('/pages/messages')}
            onClick={() => navigate('/pages/messages')}
          >
            <MessageCircle size={18} strokeWidth={2} />
            Discussion
          </UniversiteMenuLink>

          <UniversiteMenuLink
            $active={isActive('/pages/universiteProfil')}
            onClick={() => idUniversite && navigate(`/pages/universiteProfil/${idUniversite}`)}
          >
            <User size={18} strokeWidth={2} />
            Compte
          </UniversiteMenuLink>
        </UniversiteMenu>

        <UniversiteLogoutButton onClick={handleLogout}>
          <LogOut size={17} strokeWidth={2} />
          Déconnexion
        </UniversiteLogoutButton>
      </UniversiteSidebar>
    </>
  )
}