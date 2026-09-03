'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 30px 20px 120px 20px;
  max-width: 850px;
  margin: 0 auto;
`

export const HeaderCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f5f3eb 0%, #ede5d7 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #d4b89d;
`

export const CompanyLogo = styled.div`
  width: 60px;
  height: 60px;
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
  box-shadow: 0 4px 12px rgba(169, 139, 118, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const HeaderInfo = styled.div`
  flex: 1;
`

export const CompanyName = styled.div`
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 4px;
`

export const OfferTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`

export const QcmInfoCard = styled.div`
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #BABF94;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const QcmTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const QcmDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 12px 0;
`

export const QcmMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #475569;
`

export const QcmMetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg { color: #A98B76; flex-shrink: 0; }
`

/* Chronomètre de temps restant, purement informatif (la durée du QCM n'est
   pas imposée côté serveur — voir l'avertissement affiché avant de commencer). */
export const TimerBadge = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;

  ${p => {
    if (p.$niveau === 'ecoule')
      return `background: #fee2e2; color: #991b1b; border: 1.5px solid #fca5a5;`
    if (p.$niveau === 'attention')
      return `background: #fffbeb; color: #92400e; border: 1.5px solid #fde68a;`
    return `background: #f5f3eb; color: #6b5744; border: 1.5px solid #d4b89d;`
  }}

  svg { flex-shrink: 0; }
`

export const QuestionCard = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(169, 139, 118, 0.12);
  }
`

export const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

export const QuestionNumber = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #A98B76;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f5f3eb;
  padding: 4px 10px;
  border-radius: 6px;
`

export const QuestionPoints = styled.span`
  font-size: 12px;
  color: #4d5e2c;
  background: #eef0d9;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
`

export const QuestionText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.5;
  margin-bottom: 16px;
`

export const ChoicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const ChoiceLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid ${props => props.$selected ? '#A98B76' : '#e2e8f0'};
  background: ${props => props.$selected ? '#f5f3eb' : 'white'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #BFA28C;
    background: ${props => props.$selected ? '#f5f3eb' : '#f8fafc'};
  }
`

export const ChoiceRadio = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #A98B76;
  flex-shrink: 0;
`

export const ChoiceText = styled.span`
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
`

/* ===========================
   UPLOAD DE FICHIERS
   =========================== */

export const FileUploadSection = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const FileUploadTitle = styled.h3`
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

export const FileUploadGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const FileUploadCard = styled.div`
  padding: 20px;
  border: 2px dashed ${props => props.$selected ? '#A98B76' : '#cbd5e1'};
  background: ${props => props.$selected ? '#f5f3eb' : '#f8fafc'};
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: #A98B76;
    background: #f5f3eb;

    ${'' /* Animation de l'icône au hover */}
    div:first-of-type svg {
      transform: scale(1.08);
    }
  }
 }
`

export const FileInputHidden = styled.input`
  display: none;
`

export const FileUploadIcon = styled.div`
  margin-bottom: 8px;
  color: #A98B76;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
`

export const FileUploadText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
`

export const FileUploadHelper = styled.div`
  font-size: 12px;
  color: #64748b;
`

export const FileSelectedName = styled.div`
  margin-top: 12px;
  font-size: 12px;
  color: #A98B76;
  font-weight: 700;
  word-break: break-all;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg { flex-shrink: 0; color: #4d5e2c; }
`

/* Retrait d'un document déjà ajouté à la sélection multiple (Autres
   documents) : le fichier reste dans le <label> qui ouvre le sélecteur
   au clic, donc ce bouton doit stopper la propagation pour ne pas
   rouvrir le sélecteur en même temps. */
export const RemoveFileButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #fee2e2;
  color: #991b1b;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &:hover { background: #fca5a5; }
`

/* ===========================
   FOOTER + BOUTONS
   =========================== */

export const FooterCard = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: 100;
`

export const ProgressInfo = styled.div`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`

export const ButtonsRow = styled.div`
  display: flex;
  gap: 12px;
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
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover:not(:disabled) {
    background: #f1f5f9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const SubmitButton = styled.button`
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

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(169, 139, 118, 0.45);

    svg { transform: translateX(2px); }
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

/* ===========================
   ÉTATS (loading, erreur, succès)
   =========================== */

export const LoadingState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 15px;
`

export const ErrorCard = styled.div`
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  margin: 40px auto 0 auto;

  h2 {
    color: #1e293b;
    margin: 0 0 12px 0;
  }

  p {
    color: #64748b;
    margin: 0 0 20px 0;
  }
`

export const ErrorCardIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: ${p => p.$type === 'success' ? '#4d5e2c' : '#dc2626'};
`

export const ErrorBanner = styled.div`
  padding: 14px 18px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
`

export const ErrorBannerIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const SuccessCard = styled.div`
  padding: 40px 30px;
  background: white;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #BABF94;
  box-shadow: 0 4px 12px rgba(186, 191, 148, 0.25);
  margin-top: 20px;

  h2 {
    color: #4d5e2c;
    margin: 0 0 16px 0;
  }

  p {
    color: #334155;
    margin: 0 0 12px 0;
    font-size: 15px;
  }
`

export const SuccessIcon = styled.div`
  color: #b45309;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
  animation: bounce 0.6s ease;

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
`
/* ===== Avertissement avant demarrage du QCM ===== */

export const AvertissementCard = styled.div`
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-left: 4px solid #d97706;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
`

export const AvertissementTitre = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg { flex-shrink: 0; }
`

export const AvertissementListe = styled.ul`
  margin: 0 0 18px 0;
  padding-left: 20px;
  color: #78350f;
  font-size: 14.5px;
  line-height: 1.7;

  li { margin-bottom: 6px; }
  li:last-child { margin-bottom: 0; }
  strong { font-weight: 700; }
`

export const CommencerButton = styled.button`
  padding: 12px 26px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
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
