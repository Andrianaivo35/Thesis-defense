'use client'
import styled from 'styled-components'

/* ===========================================
   PALETTE (identique a styleListeOffre)
   Argile      #A98B76  /  #BFA28C
   Sauge       #BABF94  (texte fonce #5C6136)
   Ardoise     #1E293B  #475569  #64748B  #94A3B8
   Bordures    #E2E8F0
   Fond        #F8FAFC
   =========================================== */

// ===========================================
// LAYOUT
// ===========================================

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`

export const ContainerForm = styled.div`
  width: 100%;
  max-width: 1100px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  padding: 40px 50px;

  @media (max-width: 768px) {
    padding: 25px 20px;
    border-radius: 12px;
  }
`

export const ContainerTexte = styled.div`
  text-align: center;
  margin-bottom: 35px;
  padding-bottom: 20px;
  border-bottom: 3px solid #BABF94;

  h2 {
    color: #1e293b;
    font-size: 28px;
    font-weight: 700;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 22px;
    }
  }
`

export const SectionTitle = styled.div`
  margin: 30px 0 20px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(169, 139, 118, 0.25);

  h2 {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
`

// ===========================================
// GRID
// ===========================================

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`

export const ColumnForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`

// ===========================================
// INPUTS
// ===========================================

export const ContainerLabelInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
`

export const Label = styled.label`
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;

  input[type='checkbox'] {
    accent-color: #A98B76;
  }
`

export const Input = styled.input`
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: #ffffff;
  transition: all 0.2s ease;
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 4px rgba(169, 139, 118, 0.15);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`

export const Select = styled.select`
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 4px rgba(169, 139, 118, 0.15);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`

// ===========================================
// MESSAGES (remplacent les styles inline)
// ===========================================

export const Alert = styled.div`
  padding: 14px 18px;
  margin-bottom: 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  border: 1px solid
    ${props => (props.$type === 'error' ? '#fecaca' : 'rgba(186, 191, 148, 0.6)')};
  background: ${props => (props.$type === 'error' ? '#fef2f2' : 'rgba(186, 191, 148, 0.18)')};
  color: ${props => (props.$type === 'error' ? '#b91c1c' : '#5c6136')};
`

// ===========================================
// CARTES REPETABLES (competences / questions)
// ===========================================

/* $tone = 'sauge' pour les competences, 'argile' pour les questions */
export const ItemCard = styled.div`
  padding: ${props => (props.$tone === 'sauge' ? '15px' : '20px')};
  margin-bottom: ${props => (props.$tone === 'sauge' ? '15px' : '20px')};
  border-radius: 10px;
  border: 1.5px solid ${props => (props.$tone === 'sauge' ? '#BABF94' : '#BFA28C')};
  background: ${props =>
    props.$tone === 'sauge' ? 'rgba(186, 191, 148, 0.12)' : 'rgba(169, 139, 118, 0.08)'};
`

export const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => (props.$tone === 'sauge' ? '10px' : '15px')};
  gap: 12px;
`

export const ItemLabel = styled.strong`
  color: ${props => (props.$tone === 'sauge' ? '#5c6136' : '#8a6d58')};
  font-size: ${props => (props.$tone === 'sauge' ? '14px' : '16px')};
  font-weight: 700;
`

export const ChoixRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  input[type='radio'] {
    accent-color: #A98B76;
    cursor: pointer;
    flex-shrink: 0;
  }
`

// ===========================================
// BOUTONS
// ===========================================

export const ContainerButtons = styled.div`
  display: flex;
  justify-content: ${props => (props.$spaceBetween ? 'space-between' : 'center')};
  align-items: center;
  margin-top: 30px;
  gap: 15px;

  @media (max-width: 768px) {
    flex-direction: ${props => (props.$spaceBetween ? 'row' : 'column')};
  }
`

export const Button = styled.button`
  padding: 11px 28px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props =>
    props.$variant === 'secondary'
      ? '#f1f5f9'
      : 'linear-gradient(135deg, #A98B76 0%, #BFA28C 100%)'};
  color: ${props => (props.$variant === 'secondary' ? '#475569' : '#ffffff')};
  box-shadow: ${props =>
    props.$variant === 'secondary' ? 'none' : '0 2px 8px rgba(169, 139, 118, 0.25)'};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props =>
      props.$variant === 'secondary'
        ? '0 2px 8px rgba(0, 0, 0, 0.08)'
        : '0 6px 16px rgba(169, 139, 118, 0.4)'};
    background: ${props =>
      props.$variant === 'secondary'
        ? '#e2e8f0'
        : 'linear-gradient(135deg, #9A7C67 0%, #B0937D 100%)'};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid rgba(169, 139, 118, 0.45);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`