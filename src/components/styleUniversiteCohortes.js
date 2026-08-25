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

/* ===== HEADER ===== */

export const HeaderSection = styled.div`
  display: flex; 
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 22px;
  border-bottom: 3px solid #BABF94;
  flex-wrap: wrap;
`

export const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
  display: inline-flex;
  align-items: center;
  gap: 12px;

  svg { color: #A98B76; flex-shrink: 0; }

  @media (max-width: 480px) { font-size: 22px; }
`

export const PageSubtitle = styled.p`
  font-size: 14.5px;
  color: #64748b;
  margin: 0;
  max-width: 640px;
  line-height: 1.55;
`

export const CreateButton = styled.button`
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
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(169, 139, 118, 0.4);
  }
`

/* ===== ERREUR ===== */

export const ErrorMessage = styled.div`
  padding: 14px 18px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin-bottom: 18px;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 10px;
`

export const ErrorIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

/* ===== GRILLE DES CARDS ===== */

export const AnnoncesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 18px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const AnnonceCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #BABF94;
  border-radius: 14px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(169, 139, 118, 0.15);
    border-color: #BFA28C;
    border-left-color: #A98B76;
  }
`

export const AnnonceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`

export const AnnonceTitle = styled.h3`
  font-size: 16.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  flex: 1;
  line-height: 1.3;
`

export const StatutBadge = styled.span`
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;

  ${p => {
    if (p.$statut === 'Active')
      return `background: #eef0d9; color: #4d5e2c;`  /* sauge - actif */
    if (p.$statut === 'Cloturee' || p.$statut === 'Clôturée')
      return `background: #fee2e2; color: #991b1b;`  /* rouge - clôturé */
    return `background: #f1f5f9; color: #475569;`   /* gris - archivé */
  }}
`

export const AnnonceMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

export const MetaItem = styled.div`
  font-size: 13px;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const EtudiantsCount = styled.div`
  padding: 8px 12px;
  background: #eef0d9;
  color: #4d5e2c;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  svg { flex-shrink: 0; }
`

/* ===== ACTIONS ===== */

export const AnnonceActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const ActionButton = styled.button`
  flex: 1;
  min-width: 90px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  svg { flex-shrink: 0; }
`

export const VoirButton = styled(ActionButton)`
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(169, 139, 118, 0.4);
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const ModifierButton = styled(ActionButton)`
  background: white;
  color: #A98B76;
  border: 1.5px solid #d4b89d;

  &:hover {
    background: #f5f3eb;
    border-color: #A98B76;
  }
`

export const SupprimerButton = styled(ActionButton)`
  background: white;
  color: #dc2626;
  border: 1.5px solid #fecaca;

  &:hover {
    background: #fef2f2;
    border-color: #dc2626;
  }
`

/* ===== ÉTATS ===== */

export const EmptyState = styled.div`
  background: white;
  border: 2px dashed #d4b89d;
  border-radius: 16px;
  padding: 50px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  svg {
    color: #A98B76;
    opacity: 0.75;
    margin-bottom: 4px;
  }
`

export const EmptyTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
`

export const EmptyText = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0 0 16px 0;
  max-width: 460px;
  line-height: 1.6;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 15px;
  color: #64748b;
`

/* ============================================
   POPUP DE CONFIRMATION SUPPRESSION
   ============================================ */

export const ConfirmPopup = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

export const ConfirmBox = styled.div`
  background: white;
  border-radius: 14px;
  padding: 28px 26px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.2s ease;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

export const ConfirmIcon = styled.div`
  color: #dc2626;
  margin: 0 auto 12px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fee2e2;
`

export const ConfirmTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
`

export const ConfirmText = styled.p`
  font-size: 13.5px;
  color: #475569;
  margin: 0 0 22px 0;
  line-height: 1.55;

  strong { color: #0f172a; }
`

export const ConfirmButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`

export const ConfirmCancelButton = styled.button`
  padding: 10px 22px;
  background: white;
  color: #475569;
  border: 1.5px solid #cbd5e1;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const ConfirmDeleteButton = styled.button`
  padding: 10px 22px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(220, 38, 38, 0.4);
  }

  &:disabled { opacity: 0.65; cursor: not-allowed; }
`

/* ============================================
   MODAL DÉTAIL ANNONCE
   ============================================ */

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
`

export const DetailModal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease;
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

/* ===== LISTE ÉTUDIANTS DANS LE MODAL ===== */

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