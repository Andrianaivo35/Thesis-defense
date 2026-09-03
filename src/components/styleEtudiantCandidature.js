'use client'
import styled from 'styled-components'

/* Palette reprise des autres écrans (sauge #BABF94, terre #A98B76) pour
   rester cohérent avec le reste de l'application. */

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 640px) {
    padding: 20px 12px;
  }
`

export const PageHeader = styled.div`
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 3px solid #BABF94;
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
  line-height: 1.5;
`

/* ===== Compteurs par statut ===== */

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  text-align: center;
`

export const StatValue = styled.div`
  font-size: 26px;
  font-weight: 800;
  color: #1e293b;
`

export const StatLabel = styled.div`
  font-size: 12.5px;
  color: #64748b;
  margin-top: 4px;
`

/* ===== Filtres ===== */

export const FiltersBar = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`

export const FilterButton = styled.button`
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid ${p => (p.$actif ? '#A98B76' : '#e2e8f0')};
  background: ${p => (p.$actif ? 'linear-gradient(135deg, #A98B76 0%, #BFA28C 100%)' : 'white')};
  color: ${p => (p.$actif ? 'white' : '#475569')};

  &:hover {
    border-color: #A98B76;
  }
`

/* ===== Liste des candidatures ===== */

export const CandidatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const CandidatureCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 4px solid ${p => {
    if (p.$statut === 'Recruté') return '#4d5e2c';
    if (p.$statut === 'Refusé') return '#dc2626';
    return '#BABF94';
  }};
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  }
`

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`

export const OffreTitre = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
`

export const EntrepriseNom = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`

export const StatutBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;

  ${p => {
    if (p.$statut === 'Recruté')
      return `background: #eef0d9; color: #4d5e2c; border: 1px solid #d6dcb3;`;
    if (p.$statut === 'Refusé')
      return `background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;`;
    return `background: #fef3c7; color: #92400e; border: 1px solid #fde68a;`;
  }}
`

/* Badge d'état d'une offre (Active/Inactive) : notion indépendante du statut
   d'une candidature, elle ne doit jamais emprunter son vocabulaire ni ses
   couleurs (voir EN2 — l'ancien code réutilisait StatutBadge $statut='Recruté'
   pour signaler « offre active », ce qui les rendait indiscernables). */
export const EtatOffreBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;

  ${p => p.$active
    ? `background: #eef0d9; color: #4d5e2c; border: 1px solid #d6dcb3;`
    : `background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;`}
`

/* Badge neutre pour les listes de suggestions/recommandations (score de
   correspondance) : ce ne sont pas de vraies candidatures, donc pas de
   vocabulaire de statut (Retenu/Refusé) ni de code couleur associé. */
export const ScoreBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  background: #eef0d9;
  color: #4d5e2c;
  border: 1px solid #d6dcb3;
`

export const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-bottom: 14px;
`

export const MetaItem = styled.span`
  font-size: 13px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #94a3b8; flex-shrink: 0; }
`

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
`

export const NoteQCM = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${p => (p.$reussi ? '#4d5e2c' : '#92400e')};
  display: inline-flex;
  align-items: center;
  gap: 6px;
`

export const ActionButton = styled.button`
  padding: 8px 16px;
  background: white;
  color: #A98B76;
  border: 1.5px solid #d4b89d;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #f5f3eb;
    border-color: #A98B76;
  }
`

export const DocumentsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`

export const DocumentChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  background: #f5f3eb;
  color: #6b5744;
  border: 1px solid #d4b89d;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  max-width: 220px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: #ede5d7;
  }

  svg { flex-shrink: 0; color: #A98B76; }
`

/* ===== États ===== */

export const EmptyState = styled.div`
  padding: 60px 20px;
  background: white;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  font-size: 15px;
  text-align: center;
  line-height: 1.6;

  p { margin: 0 0 8px 0; }
  p:last-child { margin: 0; }
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #64748b;
`
