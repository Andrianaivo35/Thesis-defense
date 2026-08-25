'use client'
import styled from 'styled-components'

/* ============================================
   HEADER MOBILE (uniquement visible < 768px)
   ============================================ */

export const MobileHeader = styled.header`
  display: none;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 90;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 16px;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    display: flex;
  }
`

export const HamburgerButton = styled.button`
  background: white;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #A98B76;
    border-color: #BFA28C;
    background: #f5f3eb;
  }
`

/* logo image + texte, alignes a gauche */
export const MobileLogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;

  img {
    display: block;
    flex-shrink: 0;
    height: auto;
    object-fit: contain;
  }

  &:hover {
    opacity: 0.85;
  }
`

export const MobileLogoMark = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 3px 8px rgba(169, 139, 118, 0.35);
`

export const MobileLogoText = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;
  white-space: nowrap;
`

/* ============================================
   OVERLAY SOMBRE (fond mobile)
   ============================================ */

export const Overlay = styled.div`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  z-index: 95;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 768px) {
    display: block;
  }
`

/* ============================================
   SIDEBAR PRINCIPALE
   ============================================ */

export const UniversiteSidebar = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 100;
  transition: transform 0.3s ease;

  /* Sur mobile : sidebar cachée par défaut, slide-in quand ouverte */
  @media (max-width: 768px) {
    width: 260px;
    transform: ${p => p.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    box-shadow: ${p => p.$isOpen ? '4px 0 20px rgba(0, 0, 0, 0.15)' : 'none'};
  }
`

/* logo image + texte alignes a gauche, sur la meme colonne que le menu */
export const SidebarLogoArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px 12px 8px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: opacity 0.2s ease;

  img {
    display: block;
    flex-shrink: 0;
    height: auto;
    object-fit: contain;
  }

  &:hover {
    opacity: 0.85;
  }
`

export const SidebarLogoMark = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.4);
  flex-shrink: 0;
`

export const SidebarLogoText = styled.span`
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.4px;
  white-space: nowrap;
`

/* Bouton fermer (mobile uniquement) */
export const SidebarCloseButton = styled.button`
  display: none;
  position: absolute;
  top: 18px;
  right: 14px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
  z-index: 2;

  &:hover {
    background: #f1f5f9;
    color: #dc2626;
    transform: rotate(90deg);
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

/* ============================================
   MENU (liste verticale des liens)
   ============================================ */

export const UniversiteMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`

export const UniversiteMenuLink = styled.button`
  background: ${p => p.$active ? '#f5f3eb' : 'transparent'};
  border: none;
  padding: 11px 14px;
  font-size: 14px;
  font-weight: ${p => p.$active ? 700 : 500};
  color: ${p => p.$active ? '#A98B76' : '#475569'};
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  width: 100%;
  position: relative;

  /* Petite barre à gauche pour l'élément actif */
  ${p => p.$active && `
    &::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: #A98B76;
      border-radius: 0 3px 3px 0;
    }
  `}

  svg {
    color: ${p => p.$active ? '#A98B76' : '#94a3b8'};
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  &:hover {
    color: #A98B76;
    background: #f8f5ef;

    svg {
      color: #A98B76;
    }
  }
`

/* ============================================
   DÉCONNEXION (fixée en bas)
   ============================================ */

export const UniversiteLogoutButton = styled.button`
  background: white;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  padding: 11px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  width: 100%;
  margin-top: auto;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: #fef2f2;
    border-color: #dc2626;
  }
`