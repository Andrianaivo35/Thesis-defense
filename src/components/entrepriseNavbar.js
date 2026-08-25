'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getUtilisateur, logout } from '@/lib/auth'
import Image from 'next/image'
import {
  Briefcase, Inbox, UserSearch, MessageCircle, User, LogOut, Menu, X
} from 'lucide-react'
import {
  MobileHeader, MobileLogoArea, MobileLogoMark, MobileLogoText, HamburgerButton,
  Overlay,
  CompanySidebar, SidebarLogoArea, SidebarLogoMark, SidebarLogoText,
  SidebarCloseButton,
  CompanyMenu, CompanyMenuLink, CompanyLogoutButton
} from '@/components/styleEntrepriseNavbar'

export default function EntrepriseNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUtilisateur()

  const idEntreprise = user?.idEntreprise

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
        <MobileLogoArea onClick={() => router.push('/pages/entrepriseOffre')}>
          <MobileLogoMark>SS</MobileLogoMark>
          <MobileLogoText>Stage Share</MobileLogoText>
        </MobileLogoArea>
      </MobileHeader>

      {/* === OVERLAY SOMBRE === */}
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}

      {/* === SIDEBAR === */}
      <CompanySidebar $isOpen={isOpen}>
        <SidebarLogoArea onClick={() => navigate('/pages/entrepriseOffre')}>
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

        <CompanyMenu>
          <CompanyMenuLink
            $active={isActive('/pages/listeOffre')}
            onClick={() => navigate('/pages/listeOffre')}
          >
            <Briefcase size={18} strokeWidth={2} />
            Mes offres
          </CompanyMenuLink>

          <CompanyMenuLink
            $active={isActive('/pages/entrepriseCandidature')}
            onClick={() => navigate('/pages/entrepriseCandidature')}
          >
            <Inbox size={18} strokeWidth={2} />
            Candidatures
          </CompanyMenuLink>

          <CompanyMenuLink
            $active={isActive('/pages/rechercheCandidat')}
            onClick={() => navigate('/pages/rechercheCandidat')}
          >
            <UserSearch size={18} strokeWidth={2} />
            Recherche candidat
          </CompanyMenuLink>

          <CompanyMenuLink
            $active={isActive('/pages/messages')}
            onClick={() => navigate('/pages/messages')}
          >
            <MessageCircle size={18} strokeWidth={2} />
            Discussion
          </CompanyMenuLink>

          <CompanyMenuLink
            $active={isActive('/pages/entrepriseProfil')}
            onClick={() => idEntreprise && navigate(`/pages/entrepriseProfil/${idEntreprise}`)}
          >
            <User size={18} strokeWidth={2} />
            Profil
          </CompanyMenuLink>
        </CompanyMenu>

        <CompanyLogoutButton onClick={handleLogout}>
          <LogOut size={17} strokeWidth={2} />
          Déconnexion
        </CompanyLogoutButton>
      </CompanySidebar>
    </>
  )
}