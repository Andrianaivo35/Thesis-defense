'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react'
import {
  PageWrapper, LoginCard, LogoSection, LogoIcon, LoginTitle, LoginSubtitle,
  Form, FieldGroup, Label, Input,
  ErrorMessage, SubmitButton, FooterNote
} from '@/components/styleAdminLogin'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/adminLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)

      // Stockage du token et des infos
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))

      // Redirection vers le tableau de bord admin
      router.push('/pages/adminDashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageWrapper>
      <LoginCard>
        <LogoSection>
          <LogoIcon><ShieldCheck size={32} strokeWidth={2} color="white" /></LogoIcon>
          <LoginTitle>Espace Administrateur</LoginTitle>
          <LoginSubtitle>Accès réservé à l'administration de Stage Share</LoginSubtitle>
        </LogoSection>

        <Form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label>Adresse email</Label>
            <Input
              type="email"
              placeholder="admin@stage-share.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Mot de passe</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </FieldGroup>

          {error && (
            <ErrorMessage>
              <AlertCircle size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 6 }} />
              {error}
            </ErrorMessage>
          )}

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </SubmitButton>
        </Form>

        <FooterNote>
          <Lock size={11} strokeWidth={2} style={{ verticalAlign: -1, marginRight: 4 }} />
          Espace sécurisé — toute tentative d'accès est enregistrée.
        </FooterNote>
      </LoginCard>
    </PageWrapper>
  )
}