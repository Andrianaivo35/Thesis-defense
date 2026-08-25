'use client'
import styled from 'styled-components'

/* ============================================================
   SECTION "RECOMMANDE POUR VOUS"
   Palette terre / sable / sauge
   Terre : #A98B76 -> #BFA28C | #f5f3eb | #d4b89d
   Sauge : #BABF94  #d6dcb3  #eef0d9  #4d5e2c
   Sable : #f5e6d1  #8a5a20
   ============================================================ */

export const RecoSection = styled.section`
  margin-bottom: 38px;
`

export const RecoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 8px;
  }
`

export const RecoTitleGroup = styled.div`
  flex: 1;
  min-width: 0;
`

export const RecoTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 4px 0;
  font-size: 21px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.4px;

  svg { color: #A98B76; flex-shrink: 0; }

  @media (max-width: 480px) { font-size: 18px; }
`

export const RecoSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.5;
`

export const RecoRefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid #e8e0d4;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: #8a6a52;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #f5f3eb;
    border-color: #d4b89d;
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  svg { flex-shrink: 0; }
`

/* ===== DEFILEMENT HORIZONTAL DES CARTES ===== */

export const RecoScroll = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 4px 16px 4px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;

  &::-webkit-scrollbar { height: 7px; }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, #A98B76, #BFA28C);
    border-radius: 4px;
  }
`

export const RecoCard = styled.article`
  position: relative;
  flex: 0 0 320px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: white;
  border: 1.5px solid #efe8dd;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(169, 139, 118, 0.06);
  transition: all 0.25s ease;
  overflow: hidden;

  /* liseré terre sur le bord gauche */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #A98B76, #BFA28C);
  }

  &:hover {
    transform: translateY(-4px);
    border-color: #d4b89d;
    box-shadow: 0 14px 30px rgba(169, 139, 118, 0.2);
  }

  @media (max-width: 480px) {
    flex: 0 0 275px;
  }
`

/* badge de correspondance, en haut a droite de la carte */
export const RecoScoreBadge = styled.span`
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #eef0d9;
  color: #4d5e2c;
  border: 1px solid #d6dcb3;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.2px;

  svg { flex-shrink: 0; }
`

export const RecoCompanyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 84px; /* laisse la place au badge */
`

export const RecoCompanyLogo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const RecoCompanyName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const RecoOfferTitle = styled.h3`
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  min-height: 44px;
`

export const RecoMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
`

export const RecoMetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 500;
  color: #64748b;

  svg { flex-shrink: 0; color: #BFA28C; }
`

/* raisons du match : c'est ce qui rend la reco credible */
export const RecoReasons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px dashed #efe8dd;
`

export const RecoReasonChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 600;
  background: ${p => p.$fort ? '#f5e6d1' : '#f5f3eb'};
  color: ${p => p.$fort ? '#8a5a20' : '#8a6a52'};
  border: 1px solid ${p => p.$fort ? '#ecd6b8' : '#e8e0d4'};

  svg { flex-shrink: 0; }
`

export const RecoButton = styled.button`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.35);
  }
`

/* ===== ETATS ===== */

export const RecoLoadingRow = styled.div`
  display: flex;
  gap: 16px;
  padding: 4px;
`

export const RecoSkeleton = styled.div`
  flex: 0 0 320px;
  height: 230px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f8f5f0 25%, #f1ece4 50%, #f8f5f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  @media (max-width: 480px) {
    flex: 0 0 275px;
  }
`

export const RecoEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 32px 24px;
  background: linear-gradient(155deg, #faf6ef 0%, #f3f1e4 100%);
  border: 1px dashed #d4b89d;
  border-radius: 16px;

  svg { color: #BFA28C; }

  strong {
    font-size: 14.5px;
    font-weight: 700;
    color: #475569;
  }

  span {
    font-size: 13px;
    color: #8a8175;
    max-width: 420px;
    line-height: 1.55;
  }
`

export const RecoEmptyLink = styled.button`
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: white;
  border: 1.5px solid #d4b89d;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  color: #8a6a52;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    background: #f5f3eb;
    gap: 9px;
  }
`