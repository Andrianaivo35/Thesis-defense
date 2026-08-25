import styled from "styled-components";

export const PageContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: #dbe4ed;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 10px;
  }
`

export const ContainerImageForm = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  overflow: hidden;
  max-width: 1200px;
  width: 100%;

  @media (max-width: 968px) {
    flex-direction: column;
  }
`

export const ContainerImage = styled.div`
  width: 50%;

  @media (max-width: 968px) {
    width: 100%;
    max-height: 300px;
    overflow: hidden;
  }
`

export const ContainerTextFormulaire = styled.div`
  width: 50%;
  padding: 40px;

  @media (max-width: 968px) {
    width: 100%;
    padding: 30px;
  }

  @media (max-width: 480px) {
    padding: 20px;
  }
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

export const ContainerTexte = styled.div`
  font-size: 20px;
  margin-bottom: 40px;
  letter-spacing: 2px;
  text-align: center;

  h2 {
    margin: 0;
    color: #2c3e50;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 30px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 20px;
    letter-spacing: 1px;
  }
`

export const ContainerFormulaire = styled.div`
  /* margin-top: 40px; - Retiré car déjà géré dans ContainerTexte */
`

export const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: block;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`

export const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  color: #2c3e50;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
    font-size: 14px;
  }

  &:hover {
    border-color: #c0c0c0;
    background-color: #fff;
  }

  &:focus {
    outline: none;
    border-color: #22c55e;
    background-color: #fff;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 14px;
  }
`

export const ContainerLabelInput = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;

  &:first-child {
    margin-top: 0;
  }

  @media (max-width: 480px) {
    margin-bottom: 20px;
  }
`

export const ContainerBoutton = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: center;

  @media (max-width: 480px) {
    margin-top: 28px;
  }
`

export const Boutton = styled.input`
  color: white;
  border: none;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  padding: 14px 24px;
  width: 100%;
  max-width: 320px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);

  &:hover {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(34, 197, 94, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 12px 20px;
    font-size: 15px;
  }
`