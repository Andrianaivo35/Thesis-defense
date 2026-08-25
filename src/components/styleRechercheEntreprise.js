'use client'
import styled from 'styled-components'

export const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 640px) {
    padding: 20px 12px;
  }
`

export const HeaderSection = styled.div`
  margin-bottom: 32px;
`
export const SearchBarWrapper = styled.div`
  position: relative;
  width: 100%;
`

export const SearchIcon = styled.div`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 1;
`

export const SearchBar = styled.input`
  width: 100%;
  padding: 14px 20px 14px 50px;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #A98B76;
    box-shadow: 0 0 0 4px rgba(169, 139, 118, 0.15);
  }

  &::placeholder {
    color: #94a3b8;
  }

  ${SearchBarWrapper}:focus-within ${SearchIcon} {
    color: #A98B76;
  }
`

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid #BABF94;
`

export const EntreprisesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const EntrepriseCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #A98B76 0%, #BFA28C 100%);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(169, 139, 118, 0.2);
    border-color: #BFA28C;

    &::before {
      transform: scaleX(1);
    }
  }
`

export const EntrepriseLogo = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
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

export const EntrepriseHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const EntrepriseName = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`

export const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
  flex-shrink: 0;

  svg {
    fill: #dcfce7;
  }
`

export const EntrepriseSector = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #4d5e2c;
  background: #eef0d9;
  padding: 3px 10px;
  border-radius: 6px;
  width: fit-content;
`

export const EntrepriseDescription = styled.p`
  font-size: 13px;
  color: #475569;
  line-height: 1.55;
  margin: 0;
  flex: 1;
`

export const EntrepriseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 8px;
`

export const OffresCount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg {
    color: #A98B76;
    flex-shrink: 0;
  }
`

export const ViewProfileButton = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #A98B76;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg {
    transition: transform 0.2s ease;
  }

  ${EntrepriseCard}:hover & {
    color: #8a6f5d;

    svg {
      transform: translateX(4px);
    }
  }
}
`

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
  background: white;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 15px;
`

/* ===== SECTION HERO ===== */

export const HeroSection = styled.section`
  text-align: center;
  padding: 50px 24px 30px 24px;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 640px) {
    padding: 30px 16px 20px 16px;
  }
`

export const HeroTitle = styled.h1`
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 18px 0;
  letter-spacing: -0.8px;
  line-height: 1.2;

  background: linear-gradient(135deg, #A98B76 0%, #BFA28C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 640px) {
    font-size: 26px;
    margin-bottom: 14px;
  }
`

export const HeroDescription = styled.p`
  font-size: 15.5px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 32px 0;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 640px) {
    font-size: 14px;
    margin-bottom: 24px;
  }
`