'use client'
import styled from "styled-components";

/* ============================================================
   PALETTE TERRE / SABLE / SAUGE
   Terre (primaire) : #A98B76 -> #BFA28C   ombre rgba(169,139,118,.x)
                      #f5f3eb (fond clair)  #d4b89d (bordure)
   Sauge (accent)   : #BABF94  #d6dcb3  #eef0d9  #f5f7e6  #4d5e2c
   Neutres          : #0f172a #334155 #475569 #64748b #94a3b8
                      #cbd5e1 #e2e8f0 #f1f5f9 #f8fafc #ffffff
   Danger           : #dc2626 #fecaca #fef2f2
   ============================================================ */

export const PageContainer = styled.div`
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(160deg, #f5f3eb 0%, #eef0d9 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 12px;
  }
`

export const FormTextContainer = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: white;
  box-shadow: 0 20px 50px rgba(169, 139, 118, 0.18);
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  max-width: 1100px;
  width: 100%;

  @media (max-width: 968px) {
    flex-direction: column;
  }
`

export const ImageContainer = styled.div`
  width: 50%;
  position: relative;

  /* leger voile terre pour harmoniser la photo avec la palette */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, rgba(169, 139, 118, 0.25) 0%, rgba(186, 191, 148, 0.2) 100%);
    pointer-events: none;
  }

  @media (max-width: 968px) {
    width: 100%;
    max-height: 240px;
    overflow: hidden;
  }
`

export const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: 560px;
  display: block;

  @media (max-width: 968px) {
    min-height: 240px;
  }
`

export const DescTextContainer = styled.div`
  width: 50%;
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 968px) {
    width: 100%;
    padding: 36px 30px;
  }

  @media (max-width: 480px) {
    padding: 28px 20px;
  }
`

export const TexteContainer = styled.div`
  text-align: center;
  margin-bottom: 8px;

  h2 {
    margin: 0 0 12px 0;
    color: #0f172a;
    font-weight: 800;
    font-size: 30px;
    letter-spacing: -0.6px;
  }

  /* sous-titre sous forme de pastille terre */
  h3 {
    display: inline-block;
    margin: 0 0 14px 0;
    padding: 5px 14px;
    background: #f5f3eb;
    color: #8a6a52;
    border-radius: 999px;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.3px;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 14.5px;
    line-height: 1.65;
  }

  @media (max-width: 480px) {
    h2 { font-size: 25px; }
    p { font-size: 13.5px; }
  }
`

export const FormulaireContainer = styled.div`
  margin-top: 26px;
`

export const LabelForm = styled.label`
  font-size: 13.5px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 7px;
  display: block;
  letter-spacing: 0.2px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`

export const InputForm = styled.input`
  width: 100%;
  padding: 13px 15px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  color: #0f172a;
  background-color: #f8fafc;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: #94a3b8;
    font-size: 14px;
  }

  &:hover {
    border-color: #d4b89d;
    background-color: white;
  }

  &:focus {
    outline: none;
    border-color: #A98B76;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }

  &:disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 14px;
  }
`

export const InputLabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;

  &:first-child {
    margin-top: 0;
  }

  @media (max-width: 480px) {
    margin-bottom: 18px;
  }
`

export const BouttonContainer = styled.div`
  margin-top: 28px;
  display: flex;
  justify-content: center;
`

export const ButtonLoginContainer = styled.input`
  color: white;
  border: none;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  padding: 14px 24px;
  width: 100%;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 6px 14px rgba(169, 139, 118, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(169, 139, 118, 0.42);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    padding: 13px 20px;
    font-size: 14.5px;
  }
`

/* ===== MESSAGE D'ERREUR ===== */

export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;

  svg { flex-shrink: 0; color: #dc2626; }
`

/* ===== LIENS SOUS LE FORMULAIRE ===== */

export const FormFooter = styled.div`
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
`

export const FooterHint = styled.p`
  margin: 0 0 8px 0;
  font-size: 13.5px;
  color: #64748b;
`

export const FooterLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #A98B76;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #8d7160;
  }
`

export const ForgotLink = styled.a`
  display: inline-block;
  margin-top: 14px;
  color: #94a3b8;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #A98B76;
  }
`