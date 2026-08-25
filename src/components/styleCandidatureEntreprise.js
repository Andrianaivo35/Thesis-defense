'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 30px 20px;
  max-width: 1200px;
  margin: 0 auto;
`

export const PageHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 3px solid #BABF94;
`

export const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== STATS ===== */

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #BABF94;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    border-left-color: #A98B76;
    box-shadow: 0 4px 12px rgba(169, 139, 118, 0.15);
  }
`

export const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #A98B76;
  margin-bottom: 4px;
`

export const StatLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`

/* ===== FILTRES ===== */

export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  @media (max-width: 640px) {
    flex-direction: column;
  }
`

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
`

export const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

export const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }
`

/* ===== BARRE DE RECHERCHE AVEC ICÔNE ===== */
/* IMPORTANT : SearchInputWrapper et SearchInputIcon DOIVENT être déclarés AVANT SearchInput */

export const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`

export const SearchInputIcon = styled.div`
  position: absolute;
  left: 12px;
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

export const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }

  &::placeholder {
    color: #94a3b8;
  }

  ${SearchInputWrapper}:focus-within ${SearchInputIcon} {
    color: #A98B76;
  }
`

/* ===== LISTE CANDIDATURES ===== */

export const CandidaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const CandidatCard = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 140px;
  gap: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(169, 139, 118, 0.15);
    border-color: #BFA28C;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`

export const CandidatLeft = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
`

export const CandidatAvatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  text-transform: uppercase;
  box-shadow: 0 3px 8px rgba(169, 139, 118, 0.3);
`

export const CandidatInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const CandidatName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
`

export const CandidatEmail = styled.div`
  font-size: 13px;
  color: #A98B76;
  font-weight: 500;
  margin-bottom: 8px;
  word-break: break-word;
`

export const CandidatMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const CandidatMetaItem = styled.div`
  font-size: 12px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== Section centrale ===== */

export const CandidatMiddle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
`

export const OfferBadge = styled.div`
  display: inline-block;
  padding: 5px 12px;
  background: #f5f3eb;
  color: #7a5a3f;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
`

export const DateInfo = styled.div`
  font-size: 12px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const CandidatActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`

export const ActionLink = styled.a`
  padding: 6px 12px;
  background: #f5f3eb;
  color: #7a5a3f;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background: #ede5d7;
    color: #A98B76;
  }

  svg { flex-shrink: 0; }
`

/* ===== Section score ===== */

export const CandidatRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
`

export const ScoreCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: white;
  background: ${props => {
    switch (props.$color) {
      case 'green': return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
      case 'orange': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      case 'red': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      default: return 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
    }
  }};
  box-shadow: 0 4px 12px ${props => {
    switch (props.$color) {
      case 'green': return 'rgba(34, 197, 94, 0.3)'
      case 'orange': return 'rgba(245, 158, 11, 0.3)'
      case 'red': return 'rgba(239, 68, 68, 0.3)'
      default: return 'rgba(100, 116, 139, 0.3)'
    }
  }};
`

export const ScoreLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

/* ===== États ===== */

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
  color: #94a3b8;
  font-size: 15px;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 15px;
`

/* ===== STATUT ===== */

export const StatutBadge = styled.span`
  display: inline-block;
  width: fit-content;
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 6px 0;

  ${props => {
    if (props.$statut === 'Recruté')
      return `background: #d1fae5; color: #065f46;`  /* vert - signal fonctionnel */
    if (props.$statut === 'Refusé')
      return `background: #fee2e2; color: #991b1b;`  /* rouge - signal fonctionnel */
    return `background: #eef0d9; color: #4d5e2c;`    /* sauge - en attente */
  }}
`

/* ===== BOUTONS D'ACTION ===== */

export const ActionButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
`

export const MessageButton = styled.button`
  flex: 1;
  min-width: 140px;
  padding: 8px 14px;
  background: white;
  color: #A98B76;
  border: 1.5px solid #BFA28C;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #f5f3eb;
    border-color: #A98B76;
  }
`

export const RecruterButton = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const RecruteBadge = styled.div`
  flex: 1;
  min-width: 120px;
  padding: 8px 14px;
  background: #d1fae5;
  color: #065f46;
  border: 1.5px solid #6ee7b7;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`