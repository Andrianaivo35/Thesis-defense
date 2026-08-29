'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight } from 'lucide-react'
import {
  ButtonLoginContainer,
  BouttonContainer,
  LabelForm,
  InputForm,
  PageContainer,
  FormTextContainer,
  DescTextContainer,
  ImageContainer,
  StyledImage,
  FormulaireContainer,
  InputLabelContainer,
  TexteContainer,
  ErrorMessage,
  FormFooter,
  FooterHint,
  FooterLink,
  ForgotLink
} from '@/components/styleUniversiteLogin'

export default function UniversiteLogin() {
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
      const res = await fetch('/api/universiteLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)

      // Stockage du token et des infos utilisateur
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))

      router.push('/pages/universiteDashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer>
      <FormTextContainer>
        <ImageContainer>
          <StyledImage
            src="/images/16.png"
            alt="Espace Université"
          />
        </ImageContainer>

        <DescTextContainer>
          <TexteContainer>
            <h2>Stage Share</h2>
            <h3>Espace Université</h3>
            <p>Connectez-vous pour suivre vos étudiants et leur insertion professionnelle</p>
          </TexteContainer>

          <FormulaireContainer>
            {error && (
              <ErrorMessage>
                <AlertCircle size={17} strokeWidth={2} />
                {error}
              </ErrorMessage>
            )}

            <form onSubmit={handleSubmit}>
              <InputLabelContainer>
                <LabelForm>Adresse email</LabelForm>
                <InputForm
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="universite@exemple.com"
                  required
                  disabled={isLoading}
                />
              </InputLabelContainer>

              <InputLabelContainer>
                <LabelForm>Mot de passe</LabelForm>
                <InputForm
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </InputLabelContainer>

              <BouttonContainer>
                <ButtonLoginContainer type="submit" disabled={isLoading}>
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </ButtonLoginContainer>
              </BouttonContainer>
            </form>

            <FormFooter>
              <FooterHint>Pas encore de compte ?</FooterHint>
              <FooterLink onClick={() => router.push('/pages/universiteRegistreInfo')}>
                Inscrire votre université
                <ArrowRight size={15} strokeWidth={2.5} />
              </FooterLink>

              <div>
                <ForgotLink onClick={() => router.push("/pages/motDePasseOublie")}>
                  Mot de passe oublié ?
                </ForgotLink>
              </div>
            </FormFooter>
          </FormulaireContainer>
        </DescTextContainer>
      </FormTextContainer>
    </PageContainer>
  )
}