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
} from '@/components/styleEtudiantLogin'

export default function LoginEtudiant() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handelSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/etudiantLogin', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Erreur: ${res.status}`)
      }

      // Sauvegarde du token et des infos utilisateur
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))

      router.push('/pages/listeOffre')

    } catch (error) {
      console.error(error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <FormTextContainer>
        <ImageContainer>
          <StyledImage
            src="/images/15.png"
            alt="Espace Étudiant"
          />
        </ImageContainer>

        <DescTextContainer>
          <TexteContainer>
            <h2>Stage Share</h2>
            <h3>Espace Étudiant</h3>
            <p>Connectez-vous pour accéder à votre profil et trouver le stage idéal</p>
          </TexteContainer>

          <FormulaireContainer>
            {error && (
              <ErrorMessage>
                <AlertCircle size={17} strokeWidth={2} />
                {error}
              </ErrorMessage>
            )}

            <form onSubmit={handelSubmit}>
              <InputLabelContainer>
                <LabelForm>Email étudiant</LabelForm>
                <InputForm
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="etudiant@exemple.com"
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </InputLabelContainer>

              <BouttonContainer>
                <ButtonLoginContainer
                  type="submit"
                  value={loading ? 'Connexion...' : 'Se connecter'}
                  disabled={loading}
                />
              </BouttonContainer>
            </form>

            <FormFooter>
              <FooterHint>Pas encore de compte étudiant ?</FooterHint>
              <FooterLink href="/pages/etudiantRegistreInfo">
                Créer un compte étudiant
                <ArrowRight size={15} strokeWidth={2.5} />
              </FooterLink>

              <div>
                <ForgotLink href="/pages/motDePasseOublie">
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