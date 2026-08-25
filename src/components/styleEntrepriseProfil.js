'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 24px 20px 60px 20px;
  max-width: 1100px;
  margin: 0 auto;
`

export const BackButton = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;

    svg { transform: translateX(-2px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

/* ===== BANNIÈRE (fond blanc + contour terre) ===== */

export const BannerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: white;
  border: 2px solid #A98B76;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(169, 139, 118, 0.12);

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    padding: 24px;
    gap: 16px;
  }
`

export const BannerLogo = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(169, 139, 118, 0.28);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const BannerInfo = styled.div`
  flex: 1;
`

export const BannerName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    justify-content: center;
    font-size: 22px;
  }
`

export const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #eef0d9;
  border: 1px solid #d6dcb3;
  color: #4d5e2c;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;

  svg { flex-shrink: 0; }
`

/* ===== SOUS-TITRE DE BANNIÈRE : chaque valeur porte son libelle ===== */

export const BannerMetaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;

  @media (max-width: 640px) {
    justify-content: center;
  }
`

export const BannerMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 13px;
  background: #f8f6f1;
  border: 1px solid #e8e0d4;
  border-radius: 9px;

  @media (max-width: 640px) {
    align-items: center;
  }
`

export const BannerMetaLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
`

export const BannerMetaValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
`

export const BannerEditButton = styled.button`
  margin-top: 18px;
  padding: 11px 22px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.28);
  align-self: flex-start;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`

/* ===== CONTENT GRID ===== */

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  align-items: start;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const Section = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #BABF94;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const SectionContent = styled.div`
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
`

export const MemberSince = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== CONTACT ===== */

export const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`

export const ContactIcon = styled.div`
  color: #A98B76;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
`

/* libelle au-dessus de la valeur : on sait ce qu'on lit */
export const ContactBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`

export const ContactLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

export const ContactValue = styled.div`
  font-size: 13.5px;
  color: #334155;
  line-height: 1.45;
  word-break: break-word;
`

export const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.45;
  font-weight: 500;
  text-decoration: none;
  word-break: break-word;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: #A98B76;
    border-bottom-color: #d4b89d;
  }
`

/* ===== OFFRES SECTION ===== */

export const OffresSection = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const OffresList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const OffreItem = styled.div`
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #BABF94;
  border-radius: 10px;
  transition: all 0.2s ease;
  background: #fdfcfa;

  &:hover {
    border-color: #BFA28C;
    border-left-color: #A98B76;
    background: #f9f6f1;
    box-shadow: 0 4px 12px rgba(169, 139, 118, 0.12);
  }
`

export const OffreItemTitle = styled.h3`
  font-size: 16.5px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 14px 0;
  line-height: 1.35;
`

/* grille de paires libelle / valeur, deux par ligne */
export const OffreDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 28px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const OffreRow = styled.div`
  display: grid;
  grid-template-columns: 118px 1fr;
  align-items: baseline;
  gap: 10px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: 1px;
  }
`

export const OffreRowLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.7;
`

export const OffreRowValue = styled.span`
  font-size: 13.5px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.7;
  word-break: break-word;
`

export const OffreItemButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(169, 139, 118, 0.4);

    svg { transform: translateX(3px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

export const EmptyOffres = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed #e2e8f0;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 15px;
`

export const ErrorCard = styled.div`
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
  margin-top: 40px;

  h2 {
    color: #1e293b;
    margin: 0 0 12px 0;
  }

  p {
    color: #64748b;
    margin: 0 0 20px 0;
  }
`

export const ErrorIcon = styled.div`
  color: #dc2626;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
`

export const MessageButton = styled.button`
  width: 100%;
  margin-top: 18px;
  padding: 11px 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(169, 139, 118, 0.4);
  }
`