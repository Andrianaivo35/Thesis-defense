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

export const SearchBar = styled.input`
  width: 100%;
  padding: 14px 20px;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
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
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
  color: #2563eb;
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
    background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
    border-color: #bfdbfe;

    &::before { transform: scaleX(1); }
  }
`

export const EtudiantAvatar = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  text-transform: uppercase;

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const EtudiantHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const EtudiantName = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`

export const EtudiantLevel = styled.span`
  display: inline-block;
  width: fit-content;
  font-size: 11px;
  font-weight: 700;
  color: #1e40af;
  background: #dbeafe;
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
  font-size: 13px;
  color: #475569;
  font-weight: 500;
`

/* ===== TAG STAGE ===== */

export const StageTag = styled.div`
  font-size: 12.5px;
  color: #065f46;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.4;

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
  justify-content: flex-end;
`

export const ViewProfileButton = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  transition: all 0.2s ease;

  ${EtudiantCard}:hover & {
    color: #1d4ed8;
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
  border: 1.5px solid ${p => (p.$actif ? '#a5b4fc' : '#e2e8f0')};
  background: ${p => (p.$actif ? '#eef2ff' : '#ffffff')};
  transition: border-color .15s, background .15s;

  &:hover { border-color: #c7d2fe; }

  strong {
    font-size: 14px;
    font-weight: 700;
    color: ${p => (p.$actif ? '#4338ca' : '#1e293b')};
  }
  span {
    font-size: 12px;
    color: #64748b;
  }
`
