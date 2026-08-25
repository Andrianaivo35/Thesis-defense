'use client'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
  overflow-y: auto;
`

export const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: white;
    color: #dc2626;
    transform: rotate(90deg);
  }
`

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #f5f3eb 0%, #ede5d7 100%);
  border-bottom: 1px solid #e2e8f0;
`

export const ModalLogo = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(169, 139, 118, 0.35);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const ModalCompanyInfo = styled.div`
  flex: 1;
`

export const ModalCompanyName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`

export const ModalSubtitle = styled.div`
  font-size: 13px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const ModalBody = styled.div`
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
`

export const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
`

export const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.$variant) {
      case 'purple': return '#eef0d9'   /* sauge pastel */
      case 'green':  return '#dcecd1'   /* sauge plus clair */
      case 'orange': return '#f0dcc4'   /* ocre/sable chaud */
      default:       return '#f5f3eb'   /* sable doux */
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'purple': return '#4d5e2c'
      case 'green':  return '#3d5a23'
      case 'orange': return '#7a4d1f'
      default:       return '#7a5a3f'
    }
  }};

  svg { flex-shrink: 0; }
`

export const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin: 20px 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const SectionContent = styled.p`
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  margin: 0 0 8px 0;
`

export const DateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const DateItem = styled.div`
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #BABF94;
`

export const DateLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`

export const DateValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
`

export const CompetencesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const CompetenceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => props.$obligatoire ? '#fef2f2' : '#f1f5f9'};
  color: ${props => props.$obligatoire ? '#b91c1c' : '#334155'};
  border: 1px solid ${props => props.$obligatoire ? '#fecaca' : '#e2e8f0'};
`

export const ObligatoireDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  margin-right: 6px;
`

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 28px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
`

export const CancelButton = styled.button`
  padding: 10px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`

export const PostulerButton = styled.button`
  padding: 10px 24px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(169, 139, 118, 0.45);

    svg { transform: translateX(3px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

export const ModifierButton = styled.button`
  padding: 13px 28px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(169, 139, 118, 0.45);
  }
` 