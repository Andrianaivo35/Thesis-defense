'use client'
import styled from 'styled-components'

/* ===== HABILLAGE DU MODAL ===== */

export const PwdBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(51, 41, 30, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

export const PwdCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 25px 60px rgba(51, 41, 30, 0.3);
  border: 1px solid #d4b89d;
  animation: slideUp 0.25s ease;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) { padding: 26px 20px; }
`

export const PwdCloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f3eb;
  border: none;
  color: #8a6a52;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;

  &:hover {
    background: #fef2f2;
    color: #dc2626;
  }
`

/* ===== CONTENU ===== */

export const PwdHeader = styled.div`
  text-align: center;
  margin-bottom: 26px;
  padding-bottom: 18px;
  border-bottom: 2px solid #BABF94;
`

export const PwdTitle = styled.h2`
  font-size: 21px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: center;

  svg { color: #A98B76; flex-shrink: 0; }
`

export const PwdSubtitle = styled.p`
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.55;
`

export const PwdAlert = styled.div`
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;

  ${p => p.$type === 'success' && `
    background: #eef0d9; color: #4d5e2c; border: 1px solid #d6dcb3;
  `}
  ${p => p.$type === 'error' && `
    background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;
  `}
`

export const PwdAlertIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const PwdForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const PwdField = styled.div`
  display: flex;
  flex-direction: column;
`

export const PwdLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
`

/* ===== INPUT AVEC BOUTON EYE (voir/cacher) ===== */

export const PwdInputWrapper = styled.div`
  position: relative;
  width: 100%;
`

export const PwdInput = styled.input`
  width: 100%;
  padding: 11px 44px 11px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  font-size: 14px;
  outline: none;
  transition: all 0.15s ease;
  background: white;
  box-sizing: border-box;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 3px rgba(169, 139, 118, 0.15);
  }

  &:disabled { background: #f1f5f9; cursor: not-allowed; }
`

export const PwdToggleEye = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover {
    color: #A98B76;
    background: #f5f3eb;
  }

  &:focus {
    outline: none;
    color: #A98B76;
  }
`

export const PwdHelper = styled.small`
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 4px;
`

export const PwdButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;

  @media (max-width: 480px) { flex-direction: column-reverse; }
`

export const PwdCancelButton = styled.button`
  flex: 1;
  padding: 11px 18px;
  background: white;
  color: #475569;
  border: 1.5px solid #cbd5e1;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const PwdSubmitButton = styled.button`
  flex: 2;
  padding: 11px 18px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(169, 139, 118, 0.45);
  }

  &:disabled { opacity: 0.65; cursor: not-allowed; }
`