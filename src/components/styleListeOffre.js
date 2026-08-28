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
  margin-bottom: 32px;
`

/* ===== EN-TÊTE : message d'accueil + bouton Publier ===== */

export const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`

export const WelcomeText = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  min-height: 22px; /* évite un saut de mise en page pendant le chargement de user */
`

export const PublishButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 22px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(169, 139, 118, 0.25);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(169, 139, 118, 0.4);
  }

  &:focus-visible {
    outline: 3px solid rgba(169, 139, 118, 0.45);
    outline-offset: 2px;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: rotate(90deg);
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`

/* ===== BARRE DE RECHERCHE AVEC ICÔNE INTÉGRÉE ===== */
/* IMPORTANT : SearchBarWrapper et SearchIcon DOIVENT être déclarés AVANT SearchBar */

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
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 1;
`

export const SearchBar = styled.input`
  width: 100%;
  padding: 14px 20px 14px 50px;
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
    box-shadow: 0 0 0 4px rgba(169, 139, 118, 0.15);
  }

  &::placeholder {
    color: #94a3b8;
  }

  ${SearchBarWrapper}:focus-within ${SearchIcon} {
    color: #A98B76;
  }
`

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid #BABF94;
`

export const OffersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const OfferCard = styled.div`
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  gap: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(169, 139, 118, 0.2);
    border-color: #BFA28C;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`

export const CompanySection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 140px;
  padding-right: 24px;
  border-right: 1px solid #e2e8f0;

  @media (max-width: 640px) {
    flex-direction: row;
    justify-content: flex-start;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding-right: 0;
    padding-bottom: 12px;
    min-width: auto;
  }
`

export const CompanyLogo = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 12px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const CompanyName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;

  @media (max-width: 640px) {
    text-align: left;
  }
`

export const OfferDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const OfferTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`

export const OfferMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: #64748b;
  font-size: 13px;
`

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg {
    color: #A98B76;
    flex-shrink: 0;
  }
`

export const ViewButton = styled.button`
  align-self: flex-start;
  padding: 10px 22px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(169, 139, 118, 0.4);

    svg {
      transform: translateX(3px);
    }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

/* ===== BADGE "VOTRE OFFRE" (offres appartenant à l'entreprise connectée) ===== */

export const OwnOfferBadge = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(186, 191, 148, 0.25);
  color: #5c6136;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
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
/* ===== Pagination ===== */

export const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 28px;
  flex-wrap: wrap;
`

export const PaginationButton = styled.button`
  padding: 9px 18px;
  background: white;
  color: #A98B76;
  border: 1.5px solid #d4b89d;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f5f3eb;
    border-color: #A98B76;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

export const PaginationInfo = styled.span`
  font-size: 13.5px;
  color: #64748b;
  font-weight: 600;
`
