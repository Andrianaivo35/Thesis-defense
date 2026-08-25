'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Phone, Info, Save,
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
  TextArea,
  HelperText,
  ContainerLabelInput,
  ContainerBoutton,
  Boutton,
  AlertMessage,
  FooterHint
} from '@/components/styleEntrepriseRegistreInfo'

export default function EntrepriseRegistreInfo() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [nomEntreprise, setNomEntreprise] = useState('')
  const [emailEntreprise, setEmailEntreprise] = useState('')
  const [numeroIdentificationFiscale, setNumeroIdentificationFiscale] = useState('')
  const [formJuridique, setFormeJuridique] = useState('')
  const [numeroStat, setNumeroStat] = useState('')
  const [secteurActivitePrincipal, setSecteurActivitePrincipal] = useState('')
  const [descriptionEntreprise, setDescriptionEntreprise] = useState('')
  const [adresseSiegeSocial, setAdresseSiegeSocial] = useState('')
  const [numeroTelephonePrincipal, setNumeroTelephonePrincipal] = useState('')
  const [numeroTelephoneSecondaire, setnumeroTelephoneSecondaire] = useState('')
  const [siteWeb, setSiteWeb] = useState('')
  const [reseauSociaux, setReseauSociaux] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/entrepriseRegistreInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomEntreprise,
          emailEntreprise,
          numeroIdentificationFiscale,
          formJuridique,
          numeroStat,
          secteurActivitePrincipal,
          descriptionEntreprise,
          adresseSiegeSocial,
          numeroTelephonePrincipal,
          numeroTelephoneSecondaire,
          siteWeb,
          reseauSociaux,
          motDePasse
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || `Erreur ${res.status}`)

      setSuccess(data.message || 'Inscription réussie ! Redirection en cours...')
      setTimeout(() => router.push('/pages/entrepriseLogin'), 2500)

    } catch (err) {
      console.error(err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <ContainerForm>
        <ContainerTexte>
          <FormBadge>Espace Entreprise</FormBadge>
          <h2>Inscrire mon entreprise</h2>
          <FormSubtitle>
            Renseignez vos informations pour publier vos offres et accéder aux profils étudiants.
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
            {/* ===== Colonne 1 : identité légale ===== */}
            <ColumnForm>
              <SectionTitle>
                <h3>
                  <Building2 size={17} strokeWidth={2} />
                  Identité de l&apos;entreprise
                </h3>
              </SectionTitle>

              <ContainerLabelInput>
                <Label>Nom de l&apos;entreprise <span>*</span></Label>
                <Input
                  type="text"
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  placeholder="Ex : ABC Technologies"
                  required
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Email <span>*</span></Label>
                <Input
                  type="email"
                  value={emailEntreprise}
                  onChange={(e) => setEmailEntreprise(e.target.value)}
                  placeholder="contact@entreprise.com"
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

              <ContainerLabelInput>
                <Label>Forme juridique</Label>
                <Input
                  type="text"
                  value={formJuridique}
                  onChange={(e) => setFormeJuridique(e.target.value)}
                  placeholder="SARL, SA, EURL..."
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Numéro d&apos;identification fiscale</Label>
                <Input
                  type="text"
                  value={numeroIdentificationFiscale}
                  onChange={(e) => setNumeroIdentificationFiscale(e.target.value)}
                  placeholder="NIF123456789"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Numéro STAT</Label>
                <Input
                  type="text"
                  value={numeroStat}
                  onChange={(e) => setNumeroStat(e.target.value)}
                  placeholder="12345678901234"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Secteur d&apos;activité principal</Label>
                <Input
                  type="text"
                  value={secteurActivitePrincipal}
                  onChange={(e) => setSecteurActivitePrincipal(e.target.value)}
                  placeholder="Technologie, commerce, BTP..."
                  disabled={loading}
                />
              </ContainerLabelInput>
            </ColumnForm>

            {/* ===== Colonne 2 : présentation et contact ===== */}
            <ColumnForm>
              <SectionTitle>
                <h3>
                  <Phone size={17} strokeWidth={2} />
                  Présentation et contact
                </h3>
              </SectionTitle>

              <ContainerLabelInput>
                <Label>Description de l&apos;entreprise</Label>
                <TextArea
                  rows={4}
                  value={descriptionEntreprise}
                  onChange={(e) => setDescriptionEntreprise(e.target.value)}
                  placeholder="Présentez votre activité, vos valeurs, votre équipe..."
                  disabled={loading}
                />
                <HelperText>
                  <Info size={12} strokeWidth={2} />
                  Ce texte apparaîtra sur votre profil public.
                </HelperText>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Adresse du siège social</Label>
                <Input
                  type="text"
                  value={adresseSiegeSocial}
                  onChange={(e) => setAdresseSiegeSocial(e.target.value)}
                  placeholder="Adresse complète"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Téléphone principal</Label>
                <Input
                  type="text"
                  value={numeroTelephonePrincipal}
                  onChange={(e) => setNumeroTelephonePrincipal(e.target.value)}
                  placeholder="+261 34 00 000 00"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Téléphone secondaire</Label>
                <Input
                  type="text"
                  value={numeroTelephoneSecondaire}
                  onChange={(e) => setnumeroTelephoneSecondaire(e.target.value)}
                  placeholder="+261 32 00 000 00"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Site web</Label>
                <Input
                  type="text"
                  value={siteWeb}
                  onChange={(e) => setSiteWeb(e.target.value)}
                  placeholder="https://www.entreprise.com"
                  disabled={loading}
                />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Réseaux sociaux</Label>
                <Input
                  type="text"
                  value={reseauSociaux}
                  onChange={(e) => setReseauSociaux(e.target.value)}
                  placeholder="Facebook, LinkedIn..."
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
                    Créer mon compte entreprise
                  </>
                )}
              </Boutton>
            </ContainerBoutton>
          </FormGrid>
        </form>

        <FooterHint>
          Vous avez déjà un compte ?{' '}
          <a href="/pages/entrepriseLogin">Se connecter</a>
        </FooterHint>
      </ContainerForm>
    </PageContainer>
  )
}