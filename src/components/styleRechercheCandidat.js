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

/* Même hiérarchie d'accueil que rechercheEntreprise (côté étudiant) : un titre
   et un court texte de contexte avant les onglets/la recherche. */
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
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 14px 0;
  letter-spacing: -0.8px;
  line-height: 1.2;

  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 640px) { font-size: 26px; }
`

export const HeroDescription = styled.p`
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 640px) { font-size: 14px; }
`

export const HeaderSection = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

/* ===== BARRE DE RECHERCHE AVEC ICÔNE ===== */

export const SearchBarWrapper = styled.div`
  position: relative;
  width: 100%;
`

export const SearchBarIcon = styled.div`
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

  ${SearchBarWrapper}:focus-within ${SearchBarIcon} {
    color: #A98B76;
  }
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
  font-weight: 700;
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
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }
`

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #BABF94;
`

/* ===== ÉTUDIANTS ===== */

export const CandidatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const CandidatCard = styled.div`
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
    box-shadow: 0 12px 28px rgba(169, 139, 118, 0.15);
    border-color: #BFA28C;

    &::before {
      transform: scaleX(1);
    }
  }
`

/* avatar + nom alignes horizontalement */
export const CandidatTop = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

export const CandidatAvatar = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.3);
  text-transform: uppercase;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const CandidatHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

export const CandidatName = styled.h3`
  font-size: 16.5px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
`

export const CandidatLevel = styled.span`
  display: inline-block;
  width: fit-content;
  font-size: 11px;
  font-weight: 700;
  color: #4d5e2c;
  background: #eef0d9;
  padding: 3px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`

export const CandidatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const CandidatInfoItem = styled.div`
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const CandidatBio = styled.p`
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
  font-style: italic;
`

export const CandidatFooter = styled.div`
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const StatsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const StatBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #4d5e2c;
  background: #eef0d9;
  padding: 4px 9px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  svg { flex-shrink: 0; }
`

export const ViewProfileButton = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #A98B76;
  align-self: flex-end;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { transition: transform 0.2s ease; }

  ${CandidatCard}:hover & {
    color: #8a6f5d;

    svg { transform: translateX(4px); }
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

/* ===== ONGLETS ===== */

export const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  overflow-x: auto;
  margin-bottom: 4px;

  @media (max-width: 480px) { justify-content: center; }
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

/* ===== GRILLE DES COHORTES ===== */

export const CohortesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const CohorteCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: white;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #BABF94 0%, #A98B76 100%);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(169, 139, 118, 0.18);
    border-color: #BFA28C;
  }
`

/* logo + identite de l'universite, sur la meme ligne */
export const CohorteUniversiteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
`

export const CohorteUniversiteLogo = styled.div`
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(169, 139, 118, 0.3);

  img { width: 100%; height: 100%; object-fit: cover; }
`

/* colonne : nom complet en haut, sigle en dessous */
export const CohorteUniversiteInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
`

export const CohorteUniversiteFullName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
`

export const CohorteUniversiteSigle = styled.div`
  font-size: 11.5px;
  font-weight: 600;
  color: #A98B76;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { flex-shrink: 0; }
`

/* conserve pour compatibilite eventuelle */
export const CohorteUniversiteName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #A98B76;
  display: flex;
  align-items: center;
  gap: 6px;
`

export const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef0d9;
  color: #4d5e2c;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 700;

  svg { flex-shrink: 0; }
`

export const CohorteTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.35;
`

export const CohorteMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-grow: 1;
`

export const CohorteMetaItem = styled.div`
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const CohorteFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  gap: 10px;
  flex-wrap: wrap;
`

export const CohorteEtudiantsBadge = styled.span`
  background: #eef0d9;
  color: #4d5e2c;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { flex-shrink: 0; }
`

export const CohorteVoirButton = styled.button`
  padding: 8px 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(169, 139, 118, 0.4);
  }
`

/* ===== MODAL DÉTAIL COHORTE ===== */

export const DetailOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  animation: fadeIn 0.15s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

export const DetailModal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 760px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

export const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f5f3eb 0%, #ede5d7 100%);
  border-radius: 16px 16px 0 0;
  gap: 16px;
`

export const DetailTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #7a5a3f;
  margin: 0;
  line-height: 1.3;
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const DetailClose = styled.button`
  background: white;
  border: 1.5px solid #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: #fee2e2;
    border-color: #dc2626;
    color: #dc2626;
    transform: rotate(90deg);
  }
`

export const DetailBody = styled.div`
  padding: 24px 26px;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 640px) { padding: 18px; }
`

export const UniversiteCard = styled.div`
  background: linear-gradient(135deg, #f5f3eb 0%, #ede5d7 100%);
  border: 1px solid #d4b89d;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`

export const UniversiteCardLogo = styled.div`
  width: 52px;
  height: 52px;
  background: white;
  color: #A98B76;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const UniversiteCardInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const UniversiteCardName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #7a5a3f;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  svg:first-child { color: #A98B76; flex-shrink: 0; }

  @media (max-width: 640px) { justify-content: center; }
`

export const UniversiteCardLocation = styled.div`
  font-size: 12.5px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { color: #A98B76; flex-shrink: 0; }

  @media (max-width: 640px) { justify-content: center; }
`

export const ContactUniversiteButton = styled.button`
  padding: 9px 18px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.4);
  }
`

export const DetailSection = styled.div`
  margin-bottom: 22px;

  &:last-child { margin-bottom: 0; }
`

export const DetailSectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #BABF94;
  display: flex;
  align-items: center;
  gap: 8px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
`

export const DetailField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

export const DetailLabel = styled.span`
  font-size: 11.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

export const DetailValue = styled.span`
  font-size: 14px;
  color: #0f172a;
  word-break: break-word;
`

export const DetailDescription = styled.p`
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  margin: 0;
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 10px;
  border-left: 3px solid #A98B76;
  white-space: pre-wrap;
`

export const EtudiantsListModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const EtudiantRow = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;

  &:hover {
    background: #f5f3eb;
    border-color: #BFA28C;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

export const EtudiantInfoModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

export const EtudiantNomComplet = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
`

export const EtudiantEmail = styled.div`
  font-size: 12.5px;
  color: #64748b;
  word-break: break-all;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const EtudiantCvAction = styled.button`
  padding: 8px 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(169, 139, 118, 0.4);

    svg { transform: translateY(1px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

export const EtudiantSansCv = styled.span`
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  white-space: nowrap;
`