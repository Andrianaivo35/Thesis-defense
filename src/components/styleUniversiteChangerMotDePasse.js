'use client'
import styled from 'styled-components'

export const PwdContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7e6 0%, #f5f3eb 100%);
  padding: 40px 20px;
`

export const PwdBack = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  margin-bottom: 22px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;

    svg { transform: translateX(-2px); }
  }

  svg {
    transition: transform 0.2s ease;
  }
`

export const PwdCard = styled.div`
  max-width: 480px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 20px 50px rgba(169, 139, 118, 0.18);
  border: 1px solid #d4b89d;

  @media (max-width: 480px) { padding: 26px 20px; }
`

export const PwdHeader = styled.div`
  text-align: center;
  margin-bottom: 26px;
  padding-bottom: 18px;
  border-bottom: 2px solid #BABF94;
`

export const PwdTitle = styled.h1`
  font-size: 22px;
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