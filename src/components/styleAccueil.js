'use client'
import styled, { css } from 'styled-components'


export const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);

  /* evite que la navbar sticky cache le haut des sections lors du scroll */
  section {
    scroll-margin-top: 80px;
  }
`

/* ===== NAVBAR ===== */

export const Navbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 48px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);

  @media (max-width: 640px) {
    padding: 14px 20px;
  }
`

export const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`

export const LogoMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 4px 10px rgba(169, 139, 118, 0.35);
`

export const LogoText = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;

  @media (max-width: 480px) { display: none; }
`

export const NavMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 640px) { gap: 4px; }
`

export const NavLink = styled.button`
  background: none;
  border: none;
  padding: 9px 16px;
  font-size: 14.5px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #A98B76;
    background: #f5f3eb;
  }

  @media (max-width: 640px) {
    padding: 8px 10px;
    font-size: 13px;
  }
`

export const ConnectButton = styled.button`
  padding: 9px 22px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 6px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.4);
  }

  @media (max-width: 640px) {
    padding: 8px 14px;
    font-size: 13px;
  }
`

/* ===== HERO ===== */

export const HeroSection = styled.section`
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 60px;
  align-items: center;
  padding: 80px 60px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 50px 24px;
    text-align: center;
  }
`

export const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`

export const HeroTitle = styled.h1`
  font-size: 46px;
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
  margin: 0;
  letter-spacing: -1px;

  span {
    background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 900px) { font-size: 36px; }
  @media (max-width: 480px) { font-size: 28px; }
`

export const HeroSubtitle = styled.p`
  font-size: 19px;
  font-weight: 500;
  color: #334155;
  margin: 0;
  line-height: 1.5;

  @media (max-width: 480px) { font-size: 16px; }
`

export const HeroText = styled.p`
  font-size: 15.5px;
  font-weight: 400;
  color: #64748b;
  margin: 0;
  line-height: 1.7;
  max-width: 540px;

  @media (max-width: 900px) { margin: 0 auto; }
`

export const HeroRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

export const HeroImageWrapper = styled.div`
  width: 100%;
  max-width: 480px;
  aspect-ratio: 1;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 50px rgba(169, 139, 118, 0.14);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const HeroImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7e6 0%, #eef0d9 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  span {
    display: flex;
    align-items: center;
    gap: 18px;
    color: #A98B76;
    opacity: 0.8;
  }
  small { font-size: 13px; color: #4d5e2c; font-weight: 600; }
`

/* ===== MODAL DE CONNEXION ===== */

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

export const ModalCard = styled.div`
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 44px 36px;
  max-width: 880px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.25s ease;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    padding: 30px 22px;
  }
`

export const ModalClose = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #f1f5f9;
  border: none;
  color: #475569;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  /* centrage de l'icone */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;

  &:hover {
    background: #fef2f2;
    color: #dc2626;
  }
`

export const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`

export const ModalTitle = styled.h2`
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;

  @media (max-width: 480px) { font-size: 22px; }
`

export const ModalSubtitle = styled.p`
  font-size: 15px;
  color: #64748b;
  margin: 0;
`

export const RolesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`

/* green -> sauge | purple -> terre | blue -> sable */
const colorScheme = (c) => {
  if (c === 'green') return css`
    --c-from: #8a9463; --c-to: #BABF94;
    --c-bg: #eef0d9; --c-border: #d6dcb3;
  `
  if (c === 'purple') return css`
    --c-from: #A98B76; --c-to: #BFA28C;
    --c-bg: #f5f3eb; --c-border: #d4b89d;
  `
  if (c === 'blue') return css`
    --c-from: #a5713a; --c-to: #c79a68;
    --c-bg: #f5e6d1; --c-border: #e2c49c;
  `
}

export const RoleCard = styled.div`
  ${p => colorScheme(p.$couleur)}
  position: relative;
  padding: 28px 22px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--c-from), var(--c-to));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: var(--c-border);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.1);

    &::before { transform: scaleX(1); }
  }
`

export const RoleIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 14px auto;
  border-radius: 14px;
  background: var(--c-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-from);
`

export const RoleName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 7px 0;
`

export const RoleDesc = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 14px 0;
  line-height: 1.55;
`

export const RoleArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-from);
  transition: transform 0.2s ease;

  ${RoleCard}:hover & {
    transform: translateX(5px);
  }
`
/* ===== GUIDE : DE L'INSCRIPTION AU STAGE ===== */

export const GuideSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 60px 100px 60px;

  @media (max-width: 900px) {
    padding: 40px 24px 70px 24px;
  }
`

export const GuideTitle = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin: 0 0 50px 0;
  letter-spacing: -0.5px;
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #A98B76, #BFA28C);
    margin: 14px auto 0 auto;
    border-radius: 2px;
  }

  @media (max-width: 480px) {
    font-size: 26px;
    margin-bottom: 36px;
  }
`

export const GuideContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`

export const GuideImageSide = styled.div`
  display: flex;
  justify-content: center;
`

export const GuideImageWrapper = styled.div`
  width: 100%;
  max-width: 440px;
  aspect-ratio: 1;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(169, 139, 118, 0.14);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const GuideImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5e6d1 0%, #ecd5b6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #A98B76;
    opacity: 0.85;
  }
  small { font-size: 13px; color: #8a5a20; font-weight: 600; }
`

export const GuideStepsSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`

export const GuideStep = styled.div`
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 16px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(4px);
    border-color: #d4b89d;
    box-shadow: 0 8px 20px rgba(169, 139, 118, 0.12);
  }
`

/* contient desormais une icone au lieu du chiffre */
export const GuideStepNumber = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(169, 139, 118, 0.35);
`

export const GuideStepInfo = styled.div`
  flex: 1;
`

/* petit numero d'ordre : garde l'information de sequence */
export const GuideStepEyebrow = styled.span`
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #8a9463;
  letter-spacing: 0.6px;
  margin-bottom: 3px;
`

export const GuideStepTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
`

export const GuideStepText = styled.p`
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.55;
`

/* ===== CARROUSELS HORIZONTAUX ===== */

export const CarouselSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 60px;

  @media (max-width: 900px) {
    padding: 40px 24px;
  }
`

export const CarouselTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 28px 0;
  letter-spacing: -0.4px;
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 50px;
    height: 3px;
    background: linear-gradient(90deg, #A98B76, #BFA28C);
    margin-top: 10px;
    border-radius: 2px;
  }

  @media (max-width: 480px) {
    font-size: 22px;
  }
`

export const HorizontalScroll = styled.div`
  display: flex;
  gap: 18px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 4px 22px 4px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, #A98B76, #BFA28C);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #96775f;
  }
`

/* ===== CARTE OFFRE (petite) ===== */

export const OffreSmallCard = styled.div`
  flex: 0 0 300px;
  scroll-snap-align: start;
  padding: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    transform: translateY(-4px);
    border-color: #d4b89d;
    box-shadow: 0 14px 28px rgba(169, 139, 118, 0.18);
  }

  @media (max-width: 480px) {
    flex: 0 0 260px;
  }
`

export const OffreCompanyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
`

export const OffreCompanyLogo = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const OffreCompanyName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const OffreSmallTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
  min-height: 44px;
`

export const OffreSmallMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

export const OffreMetaItem = styled.span`
  font-size: 12.5px;
  color: #64748b;
  font-weight: 500;

  /* alignement texte + icone */
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { flex-shrink: 0; color: #BFA28C; }
`

/* ===== CARTE ENTREPRISE (petite) ===== */

export const EntrepriseSmallCard = styled.div`
  flex: 0 0 260px;
  scroll-snap-align: start;
  padding: 22px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;

  &:hover {
    transform: translateY(-4px);
    border-color: #d4b89d;
    box-shadow: 0 14px 28px rgba(169, 139, 118, 0.18);
  }
`

export const EntrepriseSmallLogo = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.25);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const EntrepriseSmallName = styled.h3`
  font-size: 15.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`

export const EntrepriseSmallSector = styled.span`
  font-size: 11.5px;
  font-weight: 600;
  color: #4d5e2c;
  background: #eef0d9;
  padding: 3px 9px;
  border-radius: 6px;
`

export const EntrepriseSmallDesc = styled.p`
  font-size: 12.5px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
`

export const EmptyHint = styled.div`
  padding: 30px 20px;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 14px;
`

/* ===== FOOTER ===== */

export const Footer = styled.footer`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  margin-top: 40px;
`

export const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 60px 30px 60px;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 40px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 40px 24px 24px 24px;
  }
`

export const FooterColumn = styled.div`
  h4 {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 14px 0;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`

export const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
`

export const FooterText = styled.p`
  font-size: 13.5px;
  color: #94a3b8;
  line-height: 1.65;
  margin: 0;
  max-width: 320px;
`

export const FooterLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
`

export const FooterLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font-size: 13.5px;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: white;
  }
`

export const FooterBottom = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px 24px;
  text-align: center;
  font-size: 12.5px;
  color: #64748b;
`
/* ===== BOUTON "VOIR PLUS" SUR LA CARTE OFFRE ===== */

export const OffreSmallButton = styled.button`
  margin-top: auto;
  padding: 8px 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(169, 139, 118, 0.4);
  }
`

/* ===== MODAL DÉTAILS DE L'OFFRE (intégré) ===== */

export const DetailModalCard = styled.div`
  position: relative;
  background: white;
  border-radius: 20px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.25s ease;
`

export const DetailModalHeader = styled.div`
  display: flex;
  gap: 18px;
  padding: 30px 32px 24px 32px;
  background: linear-gradient(135deg, #f5f7e6 0%, #eef0d9 100%);
  border-bottom: 1px solid #d6dcb3;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    align-items: center;
    padding: 24px 20px;
  }
`

export const DetailCompanyLogo = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(169, 139, 118, 0.35);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const DetailHeaderInfo = styled.div`
  flex: 1;
`

export const DetailCompanyName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #A98B76;
  margin-bottom: 4px;
`

export const DetailOfferTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px 0;
  line-height: 1.25;

  @media (max-width: 480px) { font-size: 18px; }
`

export const DetailBadges = styled.div`
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
`

export const DetailBadge = styled.span`
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;

  ${p => {
    if (p.$variant === 'purple') return `background: #f5f3eb; color: #8a6a52;`
    if (p.$variant === 'blue') return `background: #f5e6d1; color: #8a5a20;`
    return `background: #eef0d9; color: #4d5e2c;`
  }}
`

export const DetailModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;

  @media (max-width: 640px) { padding: 20px; }
`

export const DetailSection = styled.div`
  margin-bottom: 22px;

  &:last-child { margin-bottom: 0; }
`

export const DetailSectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;

  display: flex;
  align-items: center;
  gap: 8px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const DetailText = styled.p`
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
`

export const DetailInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 540px) { grid-template-columns: 1fr; }
`

export const DetailInfoItem = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 13px;
`

export const DetailInfoLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 3px;

  display: flex;
  align-items: center;
  gap: 5px;

  svg { color: #BFA28C; flex-shrink: 0; }
`

export const DetailInfoValue = styled.div`
  font-size: 13.5px;
  color: #1e293b;
  font-weight: 500;
`

export const DetailCompetencesList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const DetailCompetenceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  background: ${p => p.$obligatoire ? '#f5e6d1' : '#eef0d9'};
  color: ${p => p.$obligatoire ? '#8a5a20' : '#4d5e2c'};
  border: 1px solid ${p => p.$obligatoire ? '#e2c49c' : '#d6dcb3'};

  small { font-weight: 500; opacity: 0.75; }
  strong {
    display: inline-flex;
    align-items: center;
    color: #c79a68;
  }
`

export const DetailModalFooter = styled.div`
  padding: 18px 32px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;

  @media (max-width: 640px) { padding: 16px 20px; }
`

export const PostulerButton = styled.button`
  width: 100%;
  padding: 13px 22px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(169, 139, 118, 0.45);
  }
`

/* ===== MODAL AUTHENTIFICATION REQUISE ===== */

export const AuthChoiceRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
`

export const AuthChoiceCard = styled.div`
  position: relative;
  padding: 28px 22px;
  background: ${p => p.$secondary ? 'white' : 'linear-gradient(135deg, #f5f7e6 0%, #eef0d9 100%)'};
  border: 2px solid ${p => p.$secondary ? '#e2e8f0' : '#d6dcb3'};
  border-radius: 14px;
  cursor: pointer;
  text-align: center;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(169, 139, 118, 0.2);
    border-color: ${p => p.$secondary ? '#d4b89d' : '#BABF94'};
  }
`

export const AuthChoiceIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A98B76;
  margin-bottom: 10px;
`

export const AuthChoiceTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
`

export const AuthChoiceDesc = styled.p`
  font-size: 13px;
  color: #475569;
  line-height: 1.55;
  margin: 0 0 14px 0;
`

export const AuthChoiceAction = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(169, 139, 118, 0.3);
`