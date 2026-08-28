'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getUtilisateur, logout } from '@/lib/auth'
import { Briefcase, FileText, MessageCircle, Building2, User, LogOut, Menu, X } from 'lucide-react'
import Image from 'next/image'
import {
  MobileHeader, MobileLogoArea, MobileLogoMark, MobileLogoText, HamburgerButton,
  Overlay,
  StudentSidebar, SidebarLogoArea, SidebarLogoMark, SidebarLogoText,
  SidebarCloseButton,
  StudentMenu, StudentMenuLink, StudentLogoutButton
} from '@/components/styleEtudiantNavbar'

export default function EtudiantNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUtilisateur()

  const idEtudiant = user?.idEtudiant

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
      {/* === HEADER MOBILE (bouton hamburger + logo) === */}
      <MobileHeader>
        <HamburgerButton onClick={() => setIsOpen(true)} aria-label="Ouvrir le menu">
          <Menu size={22} strokeWidth={2} />
        </HamburgerButton>
        <MobileLogoArea onClick={() => router.push('/pages/listeOffre')}>
          <MobileLogoMark>SS</MobileLogoMark>
          <MobileLogoText>Stage Share</MobileLogoText>
        </MobileLogoArea>
      </MobileHeader>

      {/* === OVERLAY sombre derrière la sidebar mobile === */}
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}

      {/* === SIDEBAR PRINCIPALE === */}
      <StudentSidebar $isOpen={isOpen}>
        {/* Logo + bouton fermer (mobile uniquement) */}
        <SidebarLogoArea onClick={() => navigate('/pages/listeOffre')}>
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

        {/* Menu principal */}
        <StudentMenu>
          <StudentMenuLink
            $active={isActive('/pages/listeOffre')}
            onClick={() => navigate('/pages/listeOffre')}
          >
            <Briefcase size={18} strokeWidth={2} />
            Offres de stage
          </StudentMenuLink>

          <StudentMenuLink
            $active={isActive('/pages/etudiantCandidature')}
            onClick={() => navigate('/pages/etudiantCandidature')}
          >
            <FileText size={18} strokeWidth={2} />
            Mes candidatures
          </StudentMenuLink>

          <StudentMenuLink
            $active={isActive('/pages/messages')}
            onClick={() => navigate('/pages/messages')}
          >
            <MessageCircle size={18} strokeWidth={2} />
            Discussion
          </StudentMenuLink>

          <StudentMenuLink
            $active={isActive('/pages/listeEntreprises') || isActive('/pages/rechercheEntreprise')}
            onClick={() => navigate('/pages/rechercheEntreprise')}
          >
            <Building2 size={18} strokeWidth={2} />
            Trouver une entreprise
          </StudentMenuLink>

          <StudentMenuLink
            $active={isActive('/pages/etudiantProfil')}
            onClick={() => idEtudiant && navigate(`/pages/etudiantProfil/${idEtudiant}`)}
          >
            <User size={18} strokeWidth={2} />
            Profil
          </StudentMenuLink>
        </StudentMenu>

        {/* Déconnexion en bas */}
        <StudentLogoutButton onClick={handleLogout}>
          <LogOut size={17} strokeWidth={2} />
          Déconnexion
        </StudentLogoutButton>
      </StudentSidebar>
    </>
  )
} 