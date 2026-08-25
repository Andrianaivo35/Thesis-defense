'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  max-width: 900px;
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
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    background: #f8fafc;

    svg { transform: translateX(-2px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

/* ===== HEADER ===== */

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
  max-width: 700px;
`

/* ===== SECTION (bloc du formulaire) ===== */

export const Section = styled.section`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 26px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  @media (max-width: 640px) { padding: 20px 18px; }
`

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #BABF94;
  gap: 12px;
  flex-wrap: wrap;
`

export const SectionTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;

  svg { color: #A98B76; flex-shrink: 0; }

  /* Quand elle est SEULE (sans SectionHeader), on rajoute la ligne sauge en bas */
  ${Section} > &:first-child {
    padding-bottom: 12px;
    border-bottom: 2px solid #BABF94;
    margin-bottom: 20px;
  }
`

/* ===== CHAMPS DE FORMULAIRE ===== */

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
`

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
`

export const Input = styled.input`
  padding: 11px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: all 0.15s ease;

  &::placeholder { color: #94a3b8; }

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }
`

export const Textarea = styled.textarea`
  padding: 11px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 14px;
  background: white;
  outline: none;
  font-family: inherit;
  resize: vertical;
  min-height: 90px;
  transition: all 0.15s ease;

  &::placeholder { color: #94a3b8; }

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }
`

export const Select = styled.select`
  padding: 11px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 14px;
  background: white;
  outline: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }
`

export const Grid2Cols = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`

/* ===== BOUTON AJOUTER ÉTUDIANT ===== */

export const AddEtudiantButton = styled.button`
  padding: 10px 18px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.4);
  }
`

/* ===== LISTE DES ÉTUDIANTS ===== */

export const EtudiantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const EtudiantCard = styled.div`
  position: relative;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-left: 3px solid #BABF94;
  border-radius: 12px;
  padding: 20px;
  padding-left: 60px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f3eb;
    border-left-color: #A98B76;
  }

  @media (max-width: 640px) {
    padding-left: 20px;
    padding-top: 50px;
  }
`

export const EtudiantNumber = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(169, 139, 118, 0.3);
`

export const EtudiantFields = styled.div`
  display: flex;
  flex-direction: column;
`

export const SupprimerEtudiantButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: white;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fef2f2;
    border-color: #dc2626;
    transform: scale(1.05);
  }
`

/* ===== SECTION DOCUMENT CV ===== */

export const DocSection = styled.div`
  margin-top: 4px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f5f3eb 0%, #ede5d7 100%);
  border: 1px solid #d4b89d;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const DocLabel = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: #7a5a3f;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const DocActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`

export const DocBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  background: #eef0d9;
  color: #4d5e2c;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 700;

  svg { flex-shrink: 0; }
`

export const DocButton = styled.button`
  padding: 6px 12px;
  background: white;
  color: #A98B76;
  border: 1.5px solid #d4b89d;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background: #f5f3eb;
    border-color: #A98B76;
  }
`

export const DocUploadLabel = styled.label`
  padding: 7px 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(169, 139, 118, 0.4);
  }
`

export const HiddenFileInput = styled.input`
  display: none;
`

/* ===== ÉTAT VIDE ===== */

export const EmptyEtudiants = styled.div`
  padding: 40px 20px;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;

  p { margin: 0 0 6px 0; }
  p:last-child { margin: 0; }
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
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
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
    box-shadow: 0 10px 24px rgba(169, 139, 118, 0.45);
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
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;

  ${p => p.$type === 'success' && `
    background: #eef0d9;
    color: #4d5e2c;
    border: 1px solid #d6dcb3;
  `}
  ${p => p.$type === 'error' && `
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  `}
`

export const AlertIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const InfoNote = styled.p`
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #94a3b8; flex-shrink: 0; }
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #64748b;
`