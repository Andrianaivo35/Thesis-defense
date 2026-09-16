'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 24px 20px 60px 20px;
  max-width: 1100px;
  margin: 0 auto;
`

export const BackButton = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;

    svg { transform: translateX(-2px); }
  }

  svg { transition: transform 0.2s ease; }
`

/* ===== BANNIÈRE (fond blanc + contour terre) ===== */

export const BannerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: white;
  border: 2px solid #A98B76;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(169, 139, 118, 0.12);

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    padding: 24px;
    gap: 16px;
  }
`

/* le logo garde le degrade terre : c'est lui qui ancre le bloc */
export const BannerLogo = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 16px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(169, 139, 118, 0.28);

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const BannerInfo = styled.div`
  flex: 1;
`

export const BannerName = styled.h1`
  font-size: 27px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  letter-spacing: -0.4px;

  @media (max-width: 640px) {
    justify-content: center;
    font-size: 22px;
  }
`

export const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #eef0d9;
  border: 1px solid #d6dcb3;
  color: #4d5e2c;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;

  svg { flex-shrink: 0; }
`

/* ===== SOUS-TITRE DE BANNIÈRE : chaque valeur porte son libelle ===== */

export const BannerMetaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;

  @media (max-width: 640px) { justify-content: center; }
`

export const BannerMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 13px;
  background: #f8f6f1;
  border: 1px solid #e8e0d4;
  border-radius: 9px;

  @media (max-width: 640px) { align-items: center; }
`

export const BannerMetaLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
`

export const BannerMetaValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
`

export const BannerEditButton = styled.button`
  margin-top: 18px;
  padding: 11px 22px;
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
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.28);
  align-self: flex-start;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(169, 139, 118, 0.4);
  }

  &:active { transform: translateY(0); }
`

export const BannerMessageButton = styled.button`
  margin-top: 18px;
  padding: 11px 22px;
  background: linear-gradient(135deg, #6f8040 0%, #8a9a55 100%);
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
  box-shadow: 0 4px 12px rgba(111, 128, 64, 0.25);
  align-self: flex-start;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(111, 128, 64, 0.35);
  }

  &:active { transform: translateY(0); }
`

/* ===== SECTIONS À PROPOS / CONTACT ===== */

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  align-items: start;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 768px) { grid-template-columns: 1fr; }
`

export const Section = styled.section`
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #BABF94;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const SectionContent = styled.div`
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
`

export const MemberSince = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== CONTACT : libelle au-dessus de la valeur ===== */

export const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`

export const ContactIcon = styled.div`
  color: #A98B76;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
`

export const ContactBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`

export const ContactLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  color: #8a8175;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

export const ContactValue = styled.div`
  font-size: 13.5px;
  color: #334155;
  line-height: 1.45;
  word-break: break-word;
`

export const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.45;
  font-weight: 500;
  text-decoration: none;
  word-break: break-word;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: #A98B76;
    border-bottom-color: #d4b89d;
  }
`

/* ===== ÉTUDIANTS RATTACHÉS ===== */

export const EtudiantsSection = styled.section`
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const EtudiantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
  margin-top: 12px;

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

export const EtudiantCard = styled.div`
  background: #fdfcfa;
  border: 1px solid #e8e0d4;
  border-left: 3px solid #BABF94;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 13px;

  &:hover {
    background: #f9f6f1;
    border-color: #BFA28C;
    border-left-color: #A98B76;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(169, 139, 118, 0.15);
  }
`

export const EtudiantAvatar = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(169, 139, 118, 0.3);
  text-transform: uppercase;

  img { width: 100%; height: 100%; object-fit: cover; }
`

export const EtudiantBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
`

export const EtudiantName = styled.h3`
  font-size: 14.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
`

export const EtudiantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

export const EtudiantInfoItem = styled.div`
  font-size: 12px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* ===== ÉTATS ===== */

export const EmptyEtudiants = styled.div`
  padding: 34px 20px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 13.5px;
  text-align: center;
  line-height: 1.55;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 80px 20px;
  font-size: 15px;
  color: #64748b;
`

export const ErrorCard = styled.div`
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
  margin-top: 40px;

  h2 { color: #1e293b; margin: 0 0 12px 0; }
  p { color: #64748b; margin: 0 0 20px 0; }
`

export const ErrorIcon = styled.div`
  color: #dc2626;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
` 

/* ===== ZONE DE DANGER ===== =====================================
   Volontairement en rouge et non dans la palette terre du reste :
   c'est la seule action de la page qui detruit des donnees, elle
   doit se distinguer des sections ordinaires au premier coup d'oeil.
*/

export const DangerZone = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding: 22px 24px;
  margin-top: 24px;
  background: #fffaf9;
  border: 1px solid #fecaca;
  border-radius: 12px;
`

export const DangerZoneText = styled.div`
  flex: 1;
  min-width: 240px;

  h4 {
    font-size: 15px;
    font-weight: 700;
    color: #b1453a;
    margin: 0 0 5px 0;
  }

  p {
    font-size: 13px;
    color: #8a8175;
    line-height: 1.6;
    margin: 0;
    max-width: 560px;
  }
`

export const DangerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  color: #b1453a;
  border: 1.5px solid #d97a6d;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: #b1453a;
    border-color: #b1453a;
    color: white;
  }
`

/* ===== MODALE DE SUPPRESSION ===== */

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(30, 41, 59, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

export const ModalBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 460px;
  background: white;
  border-radius: 16px;
  padding: 30px 28px 24px 28px;
  box-shadow: 0 20px 50px rgba(30, 41, 59, 0.3);
  max-height: 90vh;
  overflow-y: auto;
`

export const ModalClose = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  padding: 2px;
  transition: color 0.2s ease;

  &:hover { color: #475569; }
`

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 18px;
`

export const ModalIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fdeeec;
  color: #b1453a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const ModalTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`

export const ModalWarning = styled.p`
  font-size: 13.5px;
  line-height: 1.65;
  color: #6b5744;
  background: #fffaf9;
  border-left: 3px solid #d97a6d;
  border-radius: 0 8px 8px 0;
  padding: 13px 15px;
  margin: 0 0 22px 0;

  strong { color: #b1453a; font-weight: 700; }
`

export const ModalField = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #8a8175;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }

  code {
    background: #fdeeec;
    color: #b1453a;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11.5px;
    letter-spacing: 0;
  }

  input {
    width: 100%;
    padding: 11px 13px;
    font-size: 14px;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;

    &:focus {
      border-color: #d97a6d;
      box-shadow: 0 0 0 3px rgba(217, 122, 109, 0.14);
    }

    &:disabled { background: #f8fafc; color: #94a3b8; }
  }
`

export const ModalError = styled.div`
  font-size: 13px;
  line-height: 1.55;
  color: #b1453a;
  background: #fdeeec;
  border-radius: 8px;
  padding: 10px 13px;
  margin-bottom: 16px;
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`

export const ModalCancelButton = styled.button`
  padding: 10px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const ModalDeleteButton = styled.button`
  padding: 10px 18px;
  background: #b1453a;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(177, 69, 58, 0.25);

  &:hover:not(:disabled) {
    background: #96382e;
    box-shadow: 0 8px 18px rgba(177, 69, 58, 0.35);
  }

  &:disabled {
    background: #e3b4ae;
    box-shadow: none;
    cursor: not-allowed;
  }
`