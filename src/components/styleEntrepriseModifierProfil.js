'use client'
import styled from 'styled-components'

/* ===== CONTENEUR PRINCIPAL ===== */

export const PageContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 28px 60px 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  min-height: 100vh;

  @media (max-width: 640px) {
    padding: 20px 16px 50px 16px;
  }
`

export const BackButton = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;

  &:hover {
    background: #f8fafc;
    transform: translateX(-2px);
  }
`

/* ===== EN-TÊTE DE PAGE ===== */

export const PageHeader = styled.div`
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 2px solid #e2e8f0;
`

export const PageTitle = styled.h1`
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;

  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 480px) { font-size: 24px; }
`

export const PageSubtitle = styled.p`
  font-size: 14.5px;
  color: #64748b;
  margin: 0;
`

/* ===== ACCORDÉON ===== */

export const AccordionSection = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;

  &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); }
`

export const AccordionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  cursor: pointer;
  user-select: none;
  background: #f8fafc;
  transition: background 0.2s ease;

  &:hover { background: #f1f5f9; }
`

export const AccordionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`

export const AccordionToggle = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: white;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #475569;
`

export const AccordionBody = styled.div`
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  animation: slideDown 0.2s ease;

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) { padding: 16px; }
`

/* ===== GRILLE DE FORMULAIRE ===== */

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`

export const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
`

export const ContainerLabelInput = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
`

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
`

export const Input = styled.input`
  padding: 10px 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: all 0.15s ease;

  &::placeholder { color: #94a3b8; }
  &:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12); }
`

export const Textarea = styled.textarea`
  padding: 10px 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 14px;
  background: white;
  outline: none;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.15s ease;

  &::placeholder { color: #94a3b8; }
  &:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12); }
`

/* ===== SECTION LOGO ===== */

export const LogoSection = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: 1px solid #c7d2fe;
  border-radius: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`

export const LogoPreview = styled.img`
  width: 110px;
  height: 110px;
  border-radius: 16px;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`

export const LogoEmpty = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 700;
  border: 3px solid white;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.3);
  flex-shrink: 0;
`

export const LogoControls = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 640px) { width: 100%; }
`

export const HiddenFileInput = styled.input`
  display: none;
`

export const LogoUploadLabel = styled.label`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  padding: 10px 18px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(79, 70, 229, 0.35);
  }
`

export const LogoRemoveButton = styled.button`
  align-self: flex-start;
  padding: 7px 14px;
  background: white;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fef2f2;
    border-color: #dc2626;
  }
`

/* ===== LIEN VERS LE CHANGEMENT DE MOT DE PASSE ===== */

export const SecurityLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 11px 18px;
  background: white;
  color: #4f46e5;
  border: 2px dashed #c7d2fe;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover {
    background: #eef2ff;
    border-color: #4f46e5;
    border-style: solid;
    transform: translateX(2px);
  }
`

/* ===== BARRE D'ACTIONS EN BAS ===== */

export const ActionBar = styled.div`
  position: sticky;
  bottom: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  margin-top: 26px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

  @media (max-width: 480px) {
    flex-direction: column-reverse;
  }
`

export const CancelButton = styled.button`
  padding: 11px 22px;
  background: white;
  color: #475569;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const SaveButton = styled.button`
  padding: 11px 28px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(79, 70, 229, 0.4);
  }

  &:disabled { opacity: 0.65; cursor: not-allowed; }
`

/* ===== MESSAGES ET ÉTATS ===== */

export const AlertMessage = styled.div`
  padding: 14px 18px;
  margin-bottom: 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;

  ${p => p.$type === 'success' && `
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  `}
  ${p => p.$type === 'error' && `
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  `}
`

export const InfoNote = styled.p`
  font-size: 12.5px;
  color: #64748b;
  margin: 8px 0 0 0;
  line-height: 1.5;
  font-style: italic;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #64748b;
`