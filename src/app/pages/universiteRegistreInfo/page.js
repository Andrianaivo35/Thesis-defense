'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Landmark, Phone, Info, Save,
  AlertCircle, CheckCircle2
} from 'lucide-react'
import {
  PageContainer,
  ContainerForm,
  ContainerTexte, FormBadge, FormSubtitle,
  FormGrid,
  ColumnForm,
  SectionTitle,
  Label,
  Input,
  HelperText,
  ContainerLabelInput,
  ContainerBoutton,
  Boutton,
  AlertMessage,
  FooterHint
} from '@/components/styleUniversiteRegistreInfo'

export default function UniversiteRegistreInfo() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [nomUniversite, setNomUniversite] = useState('')
  const [emailUniversite, setEmailUniversite] = useState('')
  const [sigleUniversitaire, setSigleUniversitaire] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('')
  const [siteWeb, setSiteWeb] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/universiteRegistreInfo', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          nomUniversite,
          emailUniversite,
          sigleUniversitaire,
          telephone,
          adresse,
          ville,
          siteWeb,
          motDePasse
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || `Erreur ${res.status}`)

      setSuccess(data.message || 'Inscription réussie ! Redirection en cours...')
      setTimeout(() => router.push('/pages/universiteLogin'), 2500)

    } catch (error) {
      console.error('Erreur: ', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <ContainerForm>
        <ContainerTexte>
          <FormBadge>Espace Université</FormBadge>
          <h2>Inscrire mon établissement</h2>
          <FormSubtitle>
            Rejoignez Stage Share pour suivre vos étudiants et publier vos annonces de cohorte.
          </FormSubtitle>
        </ContainerTexte>

        {error && (
          <AlertMessage $type="error">
            <AlertCircle size={17} strokeWidth={2} />
            {error}
          </AlertMessage>
        )}
        {success && (
          <AlertMessage $type="success">
            <CheckCircle2 size={17} strokeWidth={2} />
            {success}
          </AlertMessage>
        )}

        <form onSubmit={handleSubmit}>
          <FormGrid>
            {/* ===== Colonne 1 : identité ===== */}
            <ColumnForm>
              <SectionTitle>
                <h3>
                  <Landmark size={17} strokeWidth={2} />
                  Identité de l&apos;établissement
                </h3>
              </SectionTitle>

              <ContainerLabelInput>
                <Label>Nom de l&apos;université <span>*</span></Label>
                <Input
                  type="text"
                  value={nomUniversite}
                  onChange={(e) => setNomUniversite(e.target.value)}
                  placeholder="Ex : Université de Toamasina"
                  required
                  disabled={loading}
                />
                <HelperText>
                  <Info size={12} strokeWidth={2} />
                  Saisissez le nom complet et officiel : c&apos;est lui qui permet de rattacher
                  automatiquement les étudiants déjà inscrits.
                </HelperText>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Sigle universitaire</Label>
                <Input
                  type="text"
                  value={sigleUniversitaire}
                  onChange={(e) => setSigleUniversitaire(e.target.value)}
                  placeholder="Ex : ESPA, ENI, UT"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Email de l&apos;université <span>*</span></Label>
                <Input
                  type="email"
                  value={emailUniversite}
                  onChange={(e) => setEmailUniversite(e.target.value)}
                  placeholder="contact@universite.mg"
                  required
                  disabled={loading}
                />
                <HelperText>
                  <Info size={12} strokeWidth={2} />
                  Cet email servira d&apos;identifiant de connexion.
                </HelperText>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Mot de passe <span>*</span></Label>
                <Input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <HelperText>
                  <Info size={12} strokeWidth={2} />
                  Au moins 6 caractères.
                </HelperText>
              </ContainerLabelInput>
            </ColumnForm>

            {/* ===== Colonne 2 : coordonnées ===== */}
            <ColumnForm>
              <SectionTitle>
                <h3>
                  <Phone size={17} strokeWidth={2} />
                  Coordonnées
                </h3>
              </SectionTitle>

              <ContainerLabelInput>
                <Label>Téléphone</Label>
                <Input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+261 34 00 000 00"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Adresse universitaire</Label>
                <Input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Adresse complète du campus"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Ville</Label>
                <Input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ex : Toamasina"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Site web</Label>
                <Input
                  type="text"
                  value={siteWeb}
                  onChange={(e) => setSiteWeb(e.target.value)}
                  placeholder="https://www.universite.mg"
                  disabled={loading}
                />
              </ContainerLabelInput>
            </ColumnForm>

            {/* ===== Bouton ===== */}
            <ContainerBoutton>
              <Boutton type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : (
                  <>
                    <Save size={16} strokeWidth={2} />
                    Créer mon compte université
                  </>
                )}
              </Boutton>
            </ContainerBoutton>
          </FormGrid>
        </form>

        <FooterHint>
          Vous avez déjà un compte ?{' '}
          <a href="/pages/universiteLogin">Se connecter</a>
        </FooterHint>
      </ContainerForm>
    </PageContainer>
  )
}