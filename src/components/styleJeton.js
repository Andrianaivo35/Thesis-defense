'use client'
import styled from 'styled-components'

/* Écrans du parcours par lien : mot de passe oublié, activation de
   compte, réinitialisation.

   Ces trois pages sont atteintes SANS être connecté, souvent depuis un
   client de messagerie, parfois sur téléphone. Elles doivent donc tenir
   seules : pas de barre de navigation, pas de menu, une seule action
   visible. Tout ce qui distrait ici fait abandonner. */

export const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%);
`

export const Carte = styled.div`
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
`

export const Marque = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
  font-weight: 700;
  font-size: 15px;
  color: #4f46e5;
`

export const Titre = styled.h1`
  margin: 0 0 8px;
  font-size: 21px;
  font-weight: 700;
  color: #1e293b;
`

export const Intro = styled.p`
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
`

export const Champ = styled.div`
  margin-bottom: 16px;
`

export const Etiquette = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
`

export const Saisie = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: border-color .15s;

  &:focus { border-color: #a5b4fc; }
  &:disabled { background: #f8fafc; color: #94a3b8; }
`

export const Bouton = styled.button`
  width: 100%;
  padding: 13px 18px;
  font-size: 14.5px;
  font-weight: 600;
  color: #ffffff;
  background: #4f46e5;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background .15s;

  &:hover:not(:disabled) { background: #4338ca; }
  &:disabled { background: #c7d2fe; cursor: not-allowed; }
`

/* Les messages portent une icône ET une couleur : la couleur seule
   n'est pas perçue par tout le monde. */
const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  margin-bottom: 18px;
`

export const Erreur = styled(Message)`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
`

export const Succes = styled(Message)`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
`

export const Info = styled(Message)`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
`

export const Regle = styled.p`
  margin: -8px 0 18px;
  font-size: 12.5px;
  line-height: 1.5;
  color: #94a3b8;
`

export const PiedDePage = styled.div`
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 13px;
  color: #64748b;
`

export const Lien = styled.a`
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;

  &:hover { text-decoration: underline; }
`

export const Chargement = styled.p`
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 28px 0;
`
