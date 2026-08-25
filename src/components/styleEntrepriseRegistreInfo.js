'use client'
import styled from "styled-components";

/* ============================================================
   PALETTE TERRE / SABLE / SAUGE
   Terre : #A98B76 -> #BFA28C | #f5f3eb | #d4b89d | #8a6a52
   Sauge : #BABF94  #d6dcb3  #eef0d9  #4d5e2c
   Neutres : #0f172a #475569 #64748b #94a3b8 #e2e8f0 #f8fafc
   ============================================================ */

export const PageContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(160deg, #f5f3eb 0%, #eef0d9 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;

  @media (max-width: 768px) { padding: 20px 12px; }
`

export const ContainerForm = styled.div`
  background: white;
  border: 1px solid #e8e0d4;
  box-shadow: 0 18px 45px rgba(169, 139, 118, 0.16);
  border-radius: 18px;
  padding: 40px;
  max-width: 1100px;
  width: 100%;

  @media (max-width: 968px) { padding: 30px; }
  @media (max-width: 480px) { padding: 22px 18px; }
`

/* ===== EN-TÊTE (sans trait de separation) ===== */

export const ContainerTexte = styled.div`
  text-align: center;
  margin-bottom: 32px;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  @media (max-width: 480px) {
    margin-bottom: 24px;
    h2 { font-size: 22px; }
  }
`

export const FormBadge = styled.span`
  display: inline-block;
  margin-bottom: 12px;
  padding: 6px 15px;
  background: #f5f3eb;
  color: #8a6a52;
  border: 1px solid #e8d9c9;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
`

export const FormSubtitle = styled.p`
  font-size: 15px;
  color: #64748b;
  margin: 10px 0 0 0;
  line-height: 1.6;
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

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  svg { color: #A98B76; flex-shrink: 0; }
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

/* ===== BOUTON ===== */

export const ContainerBoutton = styled.div`
  margin-top: 30px;
  padding-top: 22px;
  border-top: 1px solid #f0eae1;
  display: flex;
  justify-content: center;
  gap: 12px;
  grid-column: 1 / -1;

  @media (max-width: 480px) { flex-direction: column-reverse; }
`

export const Boutton = styled.button`
  color: white;
  border: none;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  padding: 14px 30px;
  width: 100%;
  max-width: 340px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 5px 14px rgba(169, 139, 118, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 9px 20px rgba(169, 139, 118, 0.42);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 13px 20px;
    font-size: 15px;
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

export const FooterHint = styled.p`
  margin: 20px 0 0 0;
  text-align: center;
  font-size: 14.5px;
  color: #64748b;

  a {
    color: #A98B76;
    font-weight: 700;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover { border-bottom-color: #d4b89d; }
  }
`