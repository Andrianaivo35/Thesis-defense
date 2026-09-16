'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 28px 60px 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  min-height: 100vh;

  @media (max-width: 640px) {
    padding: 20px 16px 50px 16px;
  }
`

/* ===== SECTION HERO =====
   Identique à rechercheEntreprise et listeOffre : les trois pages sont
   les portes d'entrée de la recherche, elles s'annoncent de la même
   façon. Seul le texte change.

   Le titre ne porte plus d'icône : le dégradé du texte passe par
   -webkit-text-fill-color: transparent, qu'il fallait ensuite annuler
   sur le svg. Sans icône, la règle disparaît avec le problème. */

export const HeroSection = styled.section`
  text-align: center;
  padding: 50px 24px 30px 24px;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 640px) {
    padding: 30px 16px 20px 16px;
  }
`

export const HeroTitle = styled.h1`
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 18px 0;
  letter-spacing: -0.8px;
  line-height: 1.2;

  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 640px) {
    font-size: 26px;
    margin-bottom: 14px;
  }
`

export const HeroDescription = styled.p`
  font-size: 15.5px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 32px 0;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 640px) {
    font-size: 14px;
    margin-bottom: 24px;
  }
`

/* ===== ONGLETS ===== */

export const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0;
  overflow-x: auto;

  @media (max-width: 480px) {
    justify-content: center;
  }
`

export const TabButton = styled.button`
  background: ${p => p.$active ? 'white' : 'transparent'};
  color: ${p => p.$active ? '#A98B76' : '#64748b'};
  border: none;
  border-bottom: 3px solid ${p => p.$active ? '#A98B76' : 'transparent'};
  padding: 12px 22px;
  font-size: 14px;
  font-weight: ${p => p.$active ? '700' : '600'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    color: #A98B76;
    background: #f5f3eb;
  }

  svg { flex-shrink: 0; }
`

/* ===== BARRE DE RECHERCHE AVEC ICÔNE ===== */
/* IMPORTANT : SearchBarWrapper et SearchBarIcon DOIVENT être déclarés AVANT SearchBar */

export const SearchBarWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 24px;
`

export const SearchBarIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 1;
`

export const SearchBar = styled.input`
  width: 100%;
  padding: 13px 18px 13px 46px;
  font-size: 14.5px;
  border: 1.5px solid #e2e8f0;
  border-radius: 11px;
  outline: none;
  background: white;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;

  &::placeholder { color: #94a3b8; }

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }

  ${SearchBarWrapper}:focus-within ${SearchBarIcon} {
    color: #A98B76;
  }
`

/* ===== GRILLE DE CARTES ===== */

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const Card = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #A98B76 0%, #BFA28C 100%);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(169, 139, 118, 0.15);
    border-color: #BFA28C;

    &::before {
      transform: scaleX(1);
    }
  }
`

export const CardLogo = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.3);
  overflow: hidden;
  text-transform: uppercase;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const CardName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  line-height: 1.3;
`

export const CardSubtext = styled.p`
  font-size: 12.5px;
  color: #64748b;
  margin: 0 0 12px 0;
  font-weight: 600;
`

export const CardBody = styled.p`
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 14px 0;
  flex-grow: 1;
  min-height: 38px;
`

export const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`

export const CardInfoItem = styled.div`
  font-size: 12.5px;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
`

export const CardBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #eef0d9;
  color: #4d5e2c;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;

  svg { flex-shrink: 0; }
`

export const ViewButton = styled.span`
  font-size: 12.5px;
  font-weight: 700;
  color: #A98B76;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;

  svg {
    transition: transform 0.2s ease;
  }

  ${Card}:hover & {
    color: #8a6f5d;

    svg {
      transform: translateX(3px);
    }
  }
`

/* ===== ÉTATS ===== */

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 14px;
  color: #64748b;
  font-size: 14px;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 15px;
  color: #64748b;
`