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
  }
`

export const BannerAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  text-transform: uppercase;
  box-shadow: 0 6px 16px rgba(169, 139, 118, 0.28);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const BannerInfo = styled.div`
  flex: 1;
`

export const BannerName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;

  @media (max-width: 640px) {
    font-size: 22px;
  }
`

export const BannerSubtitle = styled.div`
  font-size: 15px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 16px;
`

export const ContactBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;

  @media (max-width: 640px) {
    justify-content: center;
  }
`

export const ContactItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  background: #f8f6f1;
  border: 1px solid #e8e0d4;
  padding: 5px 11px;
  border-radius: 7px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== SECTIONS ===== */

/* align-items: start pour que la colonne la plus courte
   ne s'etire pas a la hauteur de la plus longue */
export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 20px;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`

export const Section = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
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

export const BioText = styled.p`
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
`

/* ===== INFOS : libelle a gauche, valeur a droite ===== */

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
`

export const InfoItem = styled.div`
  display: grid;
  grid-template-columns: 128px 1fr;
  align-items: baseline;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid #f4f0e9;

  &:first-child { padding-top: 0; }
  &:last-child { border-bottom: none; padding-bottom: 0; }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 2px;
  }
`

export const InfoLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.5;
`

export const InfoValue = styled.div`
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
`

/* ===== PARCOURS : chaque donnee porte son libelle ===== */

export const ParcoursList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const ParcoursCard = styled.div`
  padding: 0 0 20px 0;
  border-bottom: 1px solid #f4f0e9;

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`

export const ParcoursTitle = styled.h3`
  font-size: 15.5px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px 0;
  line-height: 1.35;
`

export const ParcoursDetails = styled.div`
  display: flex;
  flex-direction: column;
`

/* colonne de libelles plus etroite qu'ailleurs :
   la section n'occupe plus que la moitie de la largeur */
export const ParcoursRow = styled.div`
  display: grid;
  grid-template-columns: 104px 1fr;
  align-items: baseline;
  gap: 12px;
  padding: 6px 0;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 2px;
  }
`

export const ParcoursRowLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.6;
`

export const ParcoursRowValue = styled.div`
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
`

export const ParcoursLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13.5px;
  color: #334155;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  word-break: break-all;

  svg { color: #A98B76; flex-shrink: 0; }

  &:hover {
    color: #A98B76;
    border-bottom-color: #d4b89d;
  }
`

/* Conteneur de bloc pour la liste de documents : SectionTitle est en
   inline-flex (h2), et DocumentLink est un <button> — tous deux
   inline-level, ils s'alignaient donc côte à côte sur la même ligne au
   lieu de passer sous le titre. Ce wrapper, en display: flex (block-level
   par défaut), force le retour à la ligne comme les autres sections
   (BioText, InfoList, SkillList...). */
export const DocumentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

/* Lien de document protégé (CV) : mêmes teintes que ParcoursLink, en
   <button> puisque l'ouverture passe par fetch+blob authentifié, pas par
   un href direct. */
export const DocumentLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  font-size: 13.5px;
  color: #6b5744;
  font-weight: 600;
  background: #f5f3eb;
  border: 1px solid #d4b89d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  svg { color: #A98B76; flex-shrink: 0; }

  &:hover { background: #eef0d9; border-color: #A98B76; }
`

/* ===== COMPÉTENCES : pastilles, groupées par catégorie ===== */

export const SkillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const SkillChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  background: #f5f3eb;
  color: #6b5744;
  border: 1px solid #d4b89d;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;

  small { color: #A98B76; font-weight: 700; }
`

/* ===== CENTRES D'INTÉRÊT : texte simple, sans pastille ===== */

export const InterestList = styled.div`
  display: flex;
  flex-direction: column;
`

export const InterestItem = styled.div`
  display: grid;
  grid-template-columns: 104px 1fr;
  align-items: baseline;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f4f0e9;

  &:first-child { padding-top: 0; }
  &:last-child { border-bottom: none; padding-bottom: 0; }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 2px;
  }
`

export const InterestDomaine = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.5;
`

export const InterestMission = styled.div`
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
`

/* ===== ÉTATS ===== */

export const EmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 8px;
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

  h2 { color: #1e293b; margin: 0 0 12px 0; }
  p { color: #64748b; margin: 0 0 20px 0; }
`

export const ErrorIcon = styled.div`
  color: #dc2626;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
`

export const EmptyStateLink = styled.a`
  color: #A98B76;
  cursor: pointer;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: #8a6f5d;
    text-decoration: underline;

    svg { transform: translateX(2px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

/* ===== BANNIÈRE STAGE EN COURS (gardée en jaune — alerte universelle) ===== */

export const StageBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: linear-gradient(135deg, #fef9c3 0%, #fde68a 100%);
  border: 1.5px solid #facc15;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(250, 204, 21, 0.15);

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`

export const StageIcon = styled.div`
  color: #b45309;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const StageContent = styled.div`
  flex: 1;
`

export const StageTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`

export const StageDetails = styled.div`
  font-size: 14px;
  color: #78350f;
  line-height: 1.5;

  strong {
    font-weight: 700;
    color: #1e293b;
  }
`

/* ===== BOUTONS DE BANNIÈRE ===== */

export const BannerMessageButton = styled.button`
  margin-top: 16px;
  padding: 11px 22px;
  background: linear-gradient(135deg, #6f8040 0%, #8a9a55 100%);
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
  box-shadow: 0 4px 12px rgba(111, 128, 64, 0.25);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(111, 128, 64, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
`

export const BannerEditButton = styled.button`
  margin-top: 16px;
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

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`
/* colonne de la grille pouvant empiler plusieurs sections */
export const GridColumn = styled.div`
  display: flex;
  flex-direction: column;
`


/* ===== ZONE DE DANGER ===== =====================================
   Volontairement en rouge et non dans la palette terre du reste :
   c'est la seule action de la page qui detruit des donnees, elle
   doit se distinguer des sections ordinaires au premier coup d'oeil.
*/

export const DangerZone = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding: 22px 24px;
  margin-top: 8px;
  background: #fffaf9;
  border: 1px solid #f3c7c0;
  border-radius: 12px;
`

export const DangerZoneText = styled.div`
  flex: 1;
  min-width: 240px;

  h4 {
    font-size: 15px;
    font-weight: 700;
    color: #b1453a;
    margin: 0 0 5px 0;
  }

  p {
    font-size: 13px;
    color: #8a8175;
    line-height: 1.6;
    margin: 0;
    max-width: 520px;
  }
`

export const DangerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  color: #b1453a;
  border: 1.5px solid #d97a6d;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: #b1453a;
    border-color: #b1453a;
    color: white;
  }
`

/* ===== MODALE DE SUPPRESSION ===== */

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(30, 41, 59, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

export const ModalBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 16px;
  padding: 30px 28px 24px 28px;
  box-shadow: 0 20px 50px rgba(30, 41, 59, 0.3);
  max-height: 90vh;
  overflow-y: auto;
`

export const ModalClose = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  padding: 2px;
  transition: color 0.2s ease;

  &:hover { color: #475569; }
`

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 18px;
`

export const ModalIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fdeeec;
  color: #b1453a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const ModalTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`

export const ModalWarning = styled.p`
  font-size: 13.5px;
  line-height: 1.65;
  color: #6b5744;
  background: #fffaf9;
  border-left: 3px solid #d97a6d;
  border-radius: 0 8px 8px 0;
  padding: 13px 15px;
  margin: 0 0 22px 0;

  strong { color: #b1453a; font-weight: 700; }
`

export const ModalField = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #8a8175;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }

  code {
    background: #fdeeec;
    color: #b1453a;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11.5px;
    letter-spacing: 0;
  }

  input {
    width: 100%;
    padding: 11px 13px;
    font-size: 14px;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
      border-color: #d97a6d;
      box-shadow: 0 0 0 3px rgba(217, 122, 109, 0.14);
    }

    &:disabled { background: #f8fafc; color: #94a3b8; }
  }
`

export const ModalError = styled.div`
  font-size: 13px;
  line-height: 1.55;
  color: #b1453a;
  background: #fdeeec;
  border-radius: 8px;
  padding: 10px 13px;
  margin-bottom: 16px;
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`

export const ModalCancelButton = styled.button`
  padding: 10px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const ModalDeleteButton = styled.button`
  padding: 10px 18px;
  background: #b1453a;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(177, 69, 58, 0.25);

  &:hover:not(:disabled) {
    background: #96382e;
    box-shadow: 0 8px 18px rgba(177, 69, 58, 0.35);
  }

  &:disabled {
    background: #e3b4ae;
    box-shadow: none;
    cursor: not-allowed;
  }
`