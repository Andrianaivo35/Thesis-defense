'use client'
import styled from 'styled-components'

export const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f1f5f9;
  padding-bottom: 60px;
`

/* ===== EN-TÊTE ===== */

export const AdminHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 32px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  flex-wrap: wrap;
  gap: 12px;
`

export const HeaderTitle = styled.h1`
  font-size: 19px;
  font-weight: 700;
  margin: 0;
`

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

export const AdminName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e1;
`

export const LogoutButton = styled.button`
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.8);
    border-color: transparent;
  }
`

/* ===== STATISTIQUES ===== */

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  padding: 24px 32px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 520px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const StatCard = styled.div`
  background: ${p => p.$alert ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'white'};
  border: 1px solid ${p => p.$alert ? '#facc15' : '#e2e8f0'};
  border-radius: 12px;
  padding: 18px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const StatValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
`

export const StatLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-top: 4px;
`

/* ===== ONGLETS ===== */

export const TabsBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 0 32px;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
`

export const TabButton = styled.button`
  padding: 12px 18px;
  background: none;
  border: none;
  border-bottom: 3px solid ${p => p.$active ? '#1e293b' : 'transparent'};
  color: ${p => p.$active ? '#0f172a' : '#64748b'};
  font-size: 14px;
  font-weight: ${p => p.$active ? 700 : 500};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #0f172a;
  }
`

/* ===== TOOLBAR ===== */

export const Toolbar = styled.div`
  padding: 20px 32px 12px 32px;
`

export const SearchInput = styled.input`
  width: 100%;
  max-width: 360px;
  padding: 10px 16px;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #1e293b;
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1);
  }
`

/* ===== TABLEAU ===== */

export const TableWrapper = styled.div`
  margin: 0 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
`

export const Th = styled.th`
  text-align: left;
  padding: 13px 16px;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`

export const Td = styled.td`
  padding: 12px 16px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;

  strong { color: #0f172a; }
`

export const EmptyRow = styled.td`
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
`

/* ===== BADGES & BOUTONS ===== */

export const StatutBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;

  ${p => {
    if (p.$variant === 'verifie') return `background: #d1fae5; color: #065f46;`
    if (p.$variant === 'inactif') return `background: #fee2e2; color: #991b1b;`
    return `background: #fef3c7; color: #92400e;` /* attente */
  }}
`

export const VerifyButton = styled.button`
  padding: 6px 14px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const UnverifyButton = styled.button`
  padding: 6px 14px;
  background: white;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #dc2626;
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

/* ===== ÉTATS ===== */

export const LoadingState = styled.div`
  text-align: center;
  padding: 100px 20px;
  color: #64748b;
  font-size: 15px;
`

export const ErrorState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #64748b;

  h2 { color: #0f172a; margin-bottom: 8px; }
`
/* ===== CELLULE D'ACTIONS ===== */

export const ActionCell = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

export const DetailsButton = styled.button`
  padding: 6px 12px;
  background: white;
  color: #1e293b;
  border: 1.5px solid #cbd5e1;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #f1f5f9;
    border-color: #1e293b;
  }
`

/* ===== MODAL DÉTAILS ===== */

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
`

export const ModalCard = styled.div`
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 540px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
`

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
`

export const ModalTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`

export const ModalClose = styled.button`
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { background: rgba(239, 68, 68, 0.8); }
`

export const ModalBody = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
`

export const ModalLogo = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
`

export const DetailRow = styled.div`
  display: flex;
  padding: 9px 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;

  &:last-child { border-bottom: none; }
`

export const DetailLabel = styled.div`
  flex: 0 0 180px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;

  @media (max-width: 480px) {
    flex: 0 0 130px;
  }
`

export const DetailValue = styled.div`
  flex: 1;
  font-size: 13.5px;
  color: #1e293b;
  word-break: break-word;
`

export const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
`
export const NotificationBanner = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 13px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  max-width: 92%;
  text-align: center;

  ${p => {
    if (p.$type === 'success')
      return `background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;`
    if (p.$type === 'warning')
      return `background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;`
    if (p.$type === 'error')
      return `background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;`
    return `background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;`
  }}
`
/* ===== GRAPHIQUES ===== */

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const ChartCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;

  ${p => p.$wide && `
    grid-column: 1 / -1;
  `}

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }
`

export const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`

export const ChartSubtitle = styled.p`
  font-size: 12.5px;
  color: #64748b;
  margin: 0 0 18px 0;
`