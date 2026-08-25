'use client'
import styled from "styled-components";

/* ============================================================
   LOGIN — CARTE BLANCHE + PANNEAU ILLUSTRE

   L'illustration a un fond blanc opaque : au lieu de le subir,
   on l'assume. Elle est posee dans une petite carte blanche
   arrondie, elle-meme posee sur un panneau sable/sauge. Le
   rectangle blanc devient un element du design.

   Terre (primaire) : #A98B76 -> #BFA28C
   Sauge (accent)   : #BABF94  #eef0d9  #4d5e2c
   Sable            : #f5e6d1  #8a5a20
   Neutres          : #0f172a #475569 #64748b #94a3b8 #e2e8f0 #f1f5f9
   Danger           : #dc2626 #fecaca #fef2f2
   ============================================================ */

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 24px 14px;
  }
`

/* la carte principale : blanche sur blanc, detachee par l'ombre */
export const FormTextContainer = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #efe8dd;
  border-radius: 22px;
  overflow: hidden;
  max-width: 1000px;
  width: 100%;
  box-shadow:
    0 2px 6px rgba(169, 139, 118, 0.06),
    0 20px 50px rgba(169, 139, 118, 0.18);
  animation: cardIn 0.45s cubic-bezier(0.2, 0.8, 0.3, 1);

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* bandeau colore en haut de la carte */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #A98B76 0%, #BFA28C 45%, #BABF94 100%);
    z-index: 3;
  }

  @media (max-width: 968px) {
    flex-direction: column;
  }
`

/* panneau teinte + formes decoratives floutees */
export const ImageContainer = styled.div`
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(155deg, #faf6ef 0%, #f3f1e4 55%, #eef0d9 100%);
  border-right: 1px solid #efe8dd;

  /* grosse bulle terre en haut a gauche */
  &::before {
    content: '';
    position: absolute;
    top: -70px;
    left: -60px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(169, 139, 118, 0.22) 0%, rgba(169, 139, 118, 0) 70%);
  }

  /* bulle sauge en bas a droite */
  &::after {
    content: '';
    position: absolute;
    bottom: -80px;
    right: -50px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(186, 191, 148, 0.3) 0%, rgba(186, 191, 148, 0) 70%);
  }

  @media (max-width: 968px) {
    padding: 30px 24px;
    border-right: none;
    border-bottom: 1px solid #efe8dd;
  }
`

/* l'illustration devient une petite carte blanche posee sur le panneau :
   son fond blanc n'est plus un defaut, c'est le cadre */
export const StyledImage = styled.img`
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  max-width: 340px;
  height: auto;
  object-fit: contain;
  background: #ffffff;
  border-radius: 18px;
  padding: 22px;
  box-sizing: border-box;
  box-shadow: 0 12px 30px rgba(169, 139, 118, 0.18);
  transition: transform 0.35s ease;

  &:hover {
    transform: translateY(-4px);
  }

  @media (max-width: 968px) {
    max-width: 220px;
    padding: 16px;
    margin: 0 auto;
  }
`

export const DescTextContainer = styled.div`
  flex: 0 0 430px;
  max-width: 430px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 44px;
  box-sizing: border-box;

  @media (max-width: 968px) {
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
    padding: 32px 28px;
  }

  @media (max-width: 480px) {
    padding: 26px 20px;
  }
`

export const TexteContainer = styled.div`
  text-align: center;

  h2 {
    position: relative;
    display: inline-block;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    color: #0f172a;
    font-weight: 800;
    font-size: 30px;
    letter-spacing: -0.7px;

    /* petit trait degrade sous le titre */
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 46px;
      height: 3px;
      border-radius: 2px;
      background: linear-gradient(90deg, #A98B76, #BFA28C);
    }
  }

  /* pastille qui identifie l'espace */
  h3 {
    display: block;
    width: fit-content;
    margin: 0 auto 14px auto;
    padding: 5px 14px;
    background: #f5e6d1;
    color: #8a5a20;
    border: 1px solid #ecd6b8;
    border-radius: 999px;
    font-weight: 700;
    font-size: 12.5px;
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
  margin-top: 28px;
`

export const LabelForm = styled.label`
  font-size: 12.5px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 7px;
  display: block;
  letter-spacing: 0.4px;
  text-transform: uppercase;
`

export const InputForm = styled.input`
  width: 100%;
  padding: 13px 15px;
  border: 1.5px solid #e8e0d4;
  border-radius: 10px;
  font-size: 15px;
  color: #0f172a;
  background-color: #fdfbf8;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: #a8a096;
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
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.14);
  }

  &:disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
    opacity: 0.6;
  }
`

export const InputLabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
`

export const BouttonContainer = styled.div`
  margin-top: 26px;
  display: flex;
  justify-content: center;
`

export const ButtonLoginContainer = styled.button`
  position: relative;
  overflow: hidden;
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
  box-shadow: 0 6px 14px rgba(169, 139, 118, 0.28);
  font-family: inherit;

  /* reflet qui traverse le bouton au survol */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%);
    transform: skewX(-20deg);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(169, 139, 118, 0.4);

    &::after { left: 120%; }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;

    &::after { display: none; }
  }
`

/* ===== MESSAGE D'ERREUR ===== */

export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  margin-bottom: 20px;
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-left: 3px solid #dc2626;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  animation: shake 0.3s ease;

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  svg { flex-shrink: 0; color: #dc2626; }
`

/* ===== LIENS SOUS LE FORMULAIRE ===== */

export const FormFooter = styled.div`
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #f2ece2;
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
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #8d7160;
    gap: 9px;
  }
`

export const ForgotLink = styled.a`
  display: inline-block;
  margin-top: 14px;
  color: #94a3b8;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #A98B76;
  }
`