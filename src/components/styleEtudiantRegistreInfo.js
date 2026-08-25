'use client'
import styled from "styled-components";

/* ============================================================
   PALETTE TERRE / SABLE / SAUGE
   Terre : #A98B76 -> #BFA28C | #f5f3eb | #d4b89d | #8a6a52
   Sauge : #BABF94  #d6dcb3  #eef0d9  #4d5e2c
   Sable : #f5e6d1  #8a5a20
   Neutres : #0f172a #334155 #475569 #64748b #94a3b8 #e2e8f0 #f8fafc
   ============================================================ */

export const PageContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(160deg, #f5f3eb 0%, #eef0d9 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 20px 12px;
  }
`

export const ContainerForm = styled.div`
  background: white;
  border: 1px solid #e8e0d4;
  box-shadow: 0 18px 45px rgba(169, 139, 118, 0.16);
  border-radius: 18px;
  padding: 40px;
  max-width: 1150px;
  width: 100%;

  @media (max-width: 968px) { padding: 30px; }
  @media (max-width: 480px) { padding: 22px 18px; }
`

/* ===== EN-TÊTE ===== */

export const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`

export const FormTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;

  @media (max-width: 480px) { font-size: 22px; }
`

export const FormBadge = styled.span`
  display: inline-block;
  margin-bottom: 12px;
  padding: 6px 15px;
  background: #eef0d9;
  color: #4d5e2c;
  border: 1px solid #d6dcb3;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
`

export const FormSubtitle = styled.p`
  font-size: 15px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
`

/* ===== INDICATEUR D'ÉTAPES ===== */

export const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 34px;
  gap: 6px;

  @media (max-width: 480px) { margin-bottom: 26px; }
`

export const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  width: 115px;

  @media (max-width: 480px) { width: 85px; }
`

export const StepNumber = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  transition: all 0.25s ease;
  flex-shrink: 0;

  background: ${p => p.$active
    ? 'linear-gradient(135deg, #A98B76 0%, #BFA28C 100%)'
    : '#f4f0e9'};
  color: ${p => p.$active ? 'white' : '#a8a096'};
  border: ${p => p.$active ? 'none' : '1.5px solid #e8e0d4'};
  box-shadow: ${p => p.$active
    ? '0 5px 14px rgba(169, 139, 118, 0.35)'
    : 'none'};

  @media (max-width: 480px) {
    width: 38px;
    height: 38px;
    font-size: 14.5px;
  }
`

export const StepLabel = styled.span`
  font-size: 13px;
  font-weight: ${p => p.$active ? 700 : 600};
  color: ${p => p.$active ? '#8a6a52' : '#a8a096'};
  text-align: center;
  line-height: 1.3;
  transition: color 0.25s ease;

  @media (max-width: 480px) { font-size: 11.5px; }
`

export const StepLine = styled.div`
  width: 56px;
  height: 2px;
  margin-top: 21px;
  border-radius: 2px;
  background: ${p => p.$active ? '#BFA28C' : '#e8e0d4'};
  transition: background 0.25s ease;

  @media (max-width: 480px) { width: 26px; margin-top: 18px; }
`

/* ===== GRILLE ===== */

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`

export const ColumnForm = styled.div`
  display: flex;
  flex-direction: column;
`

export const SectionTitle = styled.div`
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #BABF94;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  svg { color: #A98B76; flex-shrink: 0; }

  @media (max-width: 480px) {
    margin-bottom: 15px;
    h2 { font-size: 15.5px; }
  }
`

/* ===== CHAMPS ===== */

export const ContainerLabelInput = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`

export const Label = styled.label`
  font-size: 14.5px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 7px;
  display: block;

  span { color: #dc2626; }
`

export const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 15px;
  color: #0f172a;
  background-color: #fdfbf8;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder { color: #a8a096; font-size: 14.5px; }

  &:hover { border-color: #d4b89d; background-color: white; }

  &:focus {
    outline: none;
    border-color: #A98B76;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.14);
  }

  &:disabled { background-color: #f1f5f9; cursor: not-allowed; opacity: 0.6; }
`

export const Select = styled.select`
  width: 100%;
  padding: 12px 15px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 15px;
  color: #0f172a;
  background-color: #fdfbf8;
  transition: all 0.2s ease;
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;

  &:hover { border-color: #d4b89d; background-color: white; }

  &:focus {
    outline: none;
    border-color: #A98B76;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.14);
  }
`

export const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 15px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 15px;
  color: #0f172a;
  background-color: #fdfbf8;
  transition: all 0.2s ease;
  font-family: inherit;
  min-height: 100px;
  resize: vertical;
  box-sizing: border-box;

  &::placeholder { color: #a8a096; }

  &:hover { border-color: #d4b89d; background-color: white; }

  &:focus {
    outline: none;
    border-color: #A98B76;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.14);
  }
`

export const HelperText = styled.small`
  font-size: 13px;
  color: #8a8175;
  margin-top: 6px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  svg { color: #BFA28C; flex-shrink: 0; margin-top: 2px; }
`

/* ===== CARTES RÉPÉTABLES (expérience, centre d'intérêt) ===== */

export const ItemCard = styled.div`
  background: #fdfcfa;
  border: 1.5px solid #e8e0d4;
  border-left: 3px solid ${p => p.$variant === 'sauge' ? '#BABF94' : '#BFA28C'};
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 14px;
`

export const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 11px;
  border-bottom: 1px solid #f0eae1;
`

export const ItemBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13.5px;
  font-weight: 700;
  background: ${p => p.$variant === 'sauge' ? '#eef0d9' : '#f5e6d1'};
  color: ${p => p.$variant === 'sauge' ? '#4d5e2c' : '#8a5a20'};

  svg { flex-shrink: 0; }
`

export const DeleteItemButton = styled.button`
  background: white;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  padding: 7px 13px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:hover { background: #fef2f2; border-color: #dc2626; }
`

export const AddItemButton = styled.button`
  width: 100%;
  padding: 13px 16px;
  background: white;
  color: #8a6a52;
  border: 1.5px dashed #d4b89d;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;

  &:hover {
    background: #f5f3eb;
    border-color: #A98B76;
    border-style: solid;
  }
`

/* ===== BOUTONS DE NAVIGATION ===== */

export const ContainerButtons = styled.div`
  margin-top: 32px;
  padding-top: 22px;
  border-top: 1px solid #f0eae1;
  display: flex;
  justify-content: ${p => p.$spaceBetween ? 'space-between' : 'flex-end'};
  gap: 14px;
  grid-column: 1 / -1;

  @media (max-width: 480px) {
    margin-top: 24px;
    gap: 10px;
  }
`

export const Button = styled.button`
  border: none;
  padding: 13px 30px;
  border-radius: 10px;
  font-size: 15.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;

  ${p => p.$variant === 'secondary' ? `
    background: white;
    color: #475569;
    border: 1.5px solid #cbd5e1;

    &:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
  ` : `
    background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
    color: white;
    box-shadow: 0 5px 14px rgba(169, 139, 118, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 9px 20px rgba(169, 139, 118, 0.42);
    }
  `}

  &:active { transform: translateY(0); }

  &:disabled {
    background: #cbd5e1;
    color: white;
    border: none;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    flex: 1;
    min-width: unset;
    padding: 12px 18px;
    font-size: 14.5px;
  }
`

/* ===== MESSAGES ===== */

export const AlertMessage = styled.div`
  padding: 14px 18px;
  margin-bottom: 20px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;

  ${p => p.$type === 'success' && `
    background: #eef0d9; color: #4d5e2c; border: 1px solid #d6dcb3;
  `}
  ${p => p.$type === 'error' && `
    background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;
  `}

  svg { flex-shrink: 0; }
`