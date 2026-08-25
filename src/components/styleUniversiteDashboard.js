'use client'
import styled from 'styled-components'

/* ===== CONTAINER PRINCIPAL ===== */

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 30px 20px 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
`

/* ===== HEADER ===== */

export const HeaderSection = styled.div`
  margin-bottom: 32px;
  padding-bottom: 22px;
  border-bottom: 3px solid #BABF94;
`

export const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 10px 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.4px;

  svg { color: #A98B76; flex-shrink: 0; }

  @media (max-width: 480px) {
    font-size: 22px;
  }
`

export const PageSubtitle = styled.p`
  font-size: 14.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
`

/* ===== GRILLE D'ACCÈS RAPIDES ===== */

export const QuickAccessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const QuickCard = styled.div`
  padding: 28px 26px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #BABF94;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px rgba(169, 139, 118, 0.18);
    border-color: #BFA28C;
    border-left-color: #A98B76;
  }
`

export const QuickCardIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(169, 139, 118, 0.35);
  transition: transform 0.3s ease;

  ${QuickCard}:hover & {
    transform: scale(1.05) rotate(-3deg);
  }
`

export const QuickCardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.2px;
`

export const QuickCardText = styled.p`
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  flex-grow: 1;
`

export const QuickCardArrow = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: #A98B76;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  transition: all 0.2s ease;

  svg {
    transition: transform 0.2s ease;
  }

  ${QuickCard}:hover & {
    color: #8a6f5d;

    svg {
      transform: translateX(4px);
    }
  }
`

/* ===== CARD PLACEHOLDER (statistiques à venir) ===== */

export const PlaceholderCard = styled.div`
  padding: 40px 30px;
  background: linear-gradient(135deg, #f5f3eb 0%, #ede5d7 100%);
  border: 2px dashed #d4b89d;
  border-radius: 14px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: #A98B76;
    background: linear-gradient(135deg, #f0ebde 0%, #e6dcc9 100%);
  }
`

export const PlaceholderIcon = styled.div`
  color: #A98B76;
  margin-bottom: 14px;
  display: flex;
  justify-content: center;
  opacity: 0.75;
`

export const PlaceholderTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #7a5a3f;
  margin: 0 0 8px 0;
`

export const PlaceholderText = styled.p`
  font-size: 14px;
  color: #8a6f5d;
  line-height: 1.6;
  margin: 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  font-style: italic;
`