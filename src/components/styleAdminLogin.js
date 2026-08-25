'use client'
import styled from 'styled-components'

export const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%);
`

export const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 20px;
  padding: 40px 32px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);

  @media (max-width: 480px) {
    padding: 32px 22px;
  }
`

export const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 28px;
`

export const LogoIcon = styled.div`
  width: 70px;
  height: 70px;
  margin: 0 auto 16px auto;
  border-radius: 18px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.4);
`

export const LoginTitle = styled.h1`
  font-size: 23px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
`

export const LoginSubtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #334155;
`

export const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #1e293b;
    background: white;
    box-shadow: 0 0 0 4px rgba(30, 41, 59, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`

export const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
`

export const SubmitButton = styled.button`
  width: 100%;
  padding: 13px;
  margin-top: 4px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const FooterNote = styled.p`
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 24px 0 0 0;
`