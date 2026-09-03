'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 640px) {
    padding: 20px 12px;
  }
`

export const HeaderSection = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const SearchBarWrapper = styled.div`
  position: relative;
  width: 100%;
`

export const SearchIcon = styled.div`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  display: flex;
  pointer-events: none;
`

export const SearchBar = styled.input`
  width: 100%;
  padding: 14px 20px 14px 46px;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 4px rgba(169, 139, 118, 0.1);
  }

  &::placeholder { color: #94a3b8; }
`

export const FiltersBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

export const FilterLabel = styled.span`
  font-size: 13px;
  color: #475569;
  font-weight: 600;
`

export const FilterSelect = styled.select`
  padding: 8px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  color: #1e293b;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.1);
  }
`

/* ===== STATISTIQUES ===== */

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #A98B76;
`

export const StatLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-top: 4px;
`

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
`

/* ===== GRILLE ÉTUDIANTS ===== */

export const EtudiantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const EtudiantCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
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
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(169, 139, 118, 0.18);
    border-color: #d4b89d;

    &::before { transform: scaleX(1); }
  }
`

export const EtudiantAvatar = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.3);
  text-transform: uppercase;

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const EtudiantHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const EtudiantName = styled.h3`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`

/* Badge de vérification d'identité — pastille pleine, à la LinkedIn/Facebook,
   volontairement distincte des étiquettes en pilule utilisées ailleurs
   (EtudiantLevel, StatutBadge...) pour ne jamais se confondre avec un statut
   de rattachement : ceci certifie une identité, pas une appartenance. */
export const VerifiedIdentityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  flex-shrink: 0;

  svg { display: block; }
`

export const VerifierButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6b5744;
  background: #ffffff;
  border: 1.5px solid #f5f3eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s, border-color .15s;

  &:hover:not(:disabled) { background: #f5f3eb; border-color: #d4b89d; }
  &:disabled { opacity: .5; cursor: not-allowed; }
`

export const EtudiantLevel = styled.span`
  display: inline-block;
  width: fit-content;
  font-size: 11px;
  font-weight: 700;
  color: #6b5744;
  background: #f5f3eb;
  padding: 3px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`

export const EtudiantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

export const EtudiantInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== TAG STAGE ===== */

export const StageTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #065f46;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.4;

  svg { flex-shrink: 0; }
  strong { font-weight: 700; }
`

export const NoStageTag = styled.div`
  font-size: 12.5px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 500;
`

export const EtudiantFooter = styled.div`
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
`

export const ViewProfileButton = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #A98B76;
  transition: all 0.2s ease;

  ${EtudiantCard}:hover & {
    color: #8d7160;
    transform: translateX(4px);
  }
`

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
  background: white;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 15px;
`
/* Sélecteur de promotion.

   Des boutons plutôt qu'une liste déroulante : une université en a
   quelques-unes, et chacune doit montrer son effectif et ce qui la
   distingue — comptes à activer, étudiants en stage. Une liste
   déroulante cacherait précisément ce qu'on vient regarder. */
export const BoutonPromotion = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 168px;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  border-radius: 11px;
  border: 1.5px solid ${p => (p.$actif ? '#d4b89d' : '#e2e8f0')};
  background: ${p => (p.$actif ? '#f5f3eb' : '#ffffff')};
  transition: border-color .15s, background .15s;

  &:hover { border-color: #d4b89d; }

  strong {
    font-size: 14px;
    font-weight: 700;
    color: ${p => (p.$actif ? '#6b5744' : '#1e293b')};
  }
  span {
    font-size: 12px;
    color: #64748b;
  }
`

/* Bouton d'action secondaire, repris du style des autres écrans.
   Défini ici plutôt qu'importé d'un module de candidature : cet écran ne
   doit pas dépendre de la feuille de style d'une autre fonctionnalité. */
export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  cursor: pointer;
  transition: border-color .15s, background .15s;

  &:hover:not(:disabled) { border-color: #d4b89d; background: #f8fafc; }
  &:disabled { opacity: .5; cursor: not-allowed; }
`

/* Bouton d'action sur une carte étudiant.

   ViewProfileButton est un <span> décoratif, avec un effet de survol
   piloté par la carte entière : s'en servir pour une action réelle
   donnerait un élément qui ressemble à un bouton sans en être un — ni
   focus au clavier, ni sémantique.

   Même accent que le reste de l'écran : rien de nouveau, seulement une
   action là où il n'y en avait aucune. */
export const ContactButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: #A98B76;
  background: #ffffff;
  border: 1.5px solid #f5f3eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s, border-color .15s;

  &:hover { background: #f5f3eb; border-color: #d4b89d; }
`
