'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  AlertCircle, CheckCircle2, Building2, Phone, ImageIcon, FolderOpen,
  Trash2, Lightbulb, Lock, Save
} from 'lucide-react'
import {
  PageContainer, BackButton,
  PageHeader, PageTitle, PageSubtitle,
  AccordionSection, AccordionHeader, AccordionTitle, AccordionToggle,
  AccordionBody,
  FormGrid, FormColumn,
  Label, Input, Textarea, ContainerLabelInput,
  LogoSection, LogoPreview, LogoEmpty, LogoControls,
  LogoUploadLabel, HiddenFileInput, LogoRemoveButton,
  ActionBar, SaveButton, CancelButton,
  AlertMessage, LoadingState, InfoNote,
  SecurityLink
} from '@/components/styleEntrepriseModifierProfil'

export default function EntrepriseModifierProfilPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    nomEntreprise: '',
    description: '',
    secteurActivitePrincipal: '',
    formeJuridique: '',
    adresseSiegeSocial: '',
    telephonePrincipal: '',
    telephoneSecondaire: '',
    siteWeb: '',
    reseauSociaux: '',
    logo: ''
  })

  const [openSections, setOpenSections] = useState({
    general: true,
    contact: false,
    logo: false
  })

  // === Chargement initial ===
  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetchAuth('/api/entrepriseModifierProfil')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

        const e = data.entreprise
        setFormData({
          nomEntreprise: e.nomEntreprise || '',
          description: e.description || '',
          secteurActivitePrincipal: e.secteurActivitePrincipal || '',
          formeJuridique: e.formeJuridique || '',
          adresseSiegeSocial: e.adresseSiegeSocial || '',
          telephonePrincipal: e.telephonePrincipal || '',
          telephoneSecondaire: e.telephoneSecondaire || '',
          siteWeb: e.siteWeb || '',
          reseauSociaux: e.reseauSociaux || '',
          logo: e.logo || ''
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfil()
  }, [])

  // === Handlers ===
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // === Upload de logo depuis l'ordinateur ===
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (JPG, PNG, WebP...)')
      return
    }

    const tailleMaxMo = 2
    if (file.size > tailleMaxMo * 1024 * 1024) {
      setError(`L'image est trop grande (${(file.size / 1024 / 1024).toFixed(2)} Mo). Maximum ${tailleMaxMo} Mo.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setError('')
      updateField('logo', event.target.result)
    }
    reader.onerror = () => {
      setError("Impossible de lire le fichier.")
    }
    reader.readAsDataURL(file)
  }

  // === Soumission ===
  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetchAuth('/api/entrepriseModifierProfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Erreur')

      setSuccess('Profil mis à jour avec succès !')

      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('utilisateur') || '{}')
        router.push(`/pages/entrepriseProfil/${user.idEntreprise}`)
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <AppNavbar />
        <PageContainer><LoadingState>Chargement de votre profil...</LoadingState></PageContainer>
      </>
    )
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <BackButton onClick={() => router.back()}>← Profil</BackButton>

        <PageHeader>
          <PageTitle>Modifier mon profil entreprise</PageTitle>
          <PageSubtitle>
            Cliquez sur une section pour la déplier et modifier ses informations.
          </PageSubtitle>
        </PageHeader>

        {error && (
          <AlertMessage $type="error">
            <AlertCircle size={16} strokeWidth={2} style={{ verticalAlign: -3, marginRight: 6 }} />
            {error}
          </AlertMessage>
        )}
        {success && (
          <AlertMessage $type="success">
            <CheckCircle2 size={16} strokeWidth={2} style={{ verticalAlign: -3, marginRight: 6 }} />
            {success}
          </AlertMessage>
        )}

        {/* ========== 1. INFORMATIONS GÉNÉRALES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('general')}>
            <AccordionTitle><Building2 size={16} strokeWidth={2} />Informations générales</AccordionTitle>
            <AccordionToggle>{openSections.general ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.general && (
            <AccordionBody>
              <ContainerLabelInput>
                <Label>Nom de l'entreprise *</Label>
                <Input
                  value={formData.nomEntreprise}
                  onChange={(e) => updateField('nomEntreprise', e.target.value)}
                />
              </ContainerLabelInput>

              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Secteur d'activité</Label>
                    <Input
                      value={formData.secteurActivitePrincipal}
                      onChange={(e) => updateField('secteurActivitePrincipal', e.target.value)}
                      placeholder="Ex: Informatique, BTP, Finance..."
                    />
                  </ContainerLabelInput>
                </FormColumn>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Forme juridique</Label>
                    <Input
                      value={formData.formeJuridique}
                      onChange={(e) => updateField('formeJuridique', e.target.value)}
                      placeholder="Ex: SARL, SAS, EURL..."
                    />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>

              <ContainerLabelInput>
                <Label>Description de l'entreprise</Label>
                <Textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Présentez votre entreprise, ses valeurs, ses missions..."
                />
              </ContainerLabelInput>

              <SecurityLink onClick={() => router.push('/pages/entrepriseChangerMotDePasse')}>
                <Lock size={14} strokeWidth={2} /> Changer mon mot de passe →
              </SecurityLink>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 2. CONTACT ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('contact')}>
            <AccordionTitle><Phone size={16} strokeWidth={2} />Contact et coordonnées</AccordionTitle>
            <AccordionToggle>{openSections.contact ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.contact && (
            <AccordionBody>
              <ContainerLabelInput>
                <Label>Adresse du siège social</Label>
                <Input
                  value={formData.adresseSiegeSocial}
                  onChange={(e) => updateField('adresseSiegeSocial', e.target.value)}
                />
              </ContainerLabelInput>

              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Téléphone principal</Label>
                    <Input
                      value={formData.telephonePrincipal}
                      onChange={(e) => updateField('telephonePrincipal', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Téléphone secondaire</Label>
                    <Input
                      value={formData.telephoneSecondaire}
                      onChange={(e) => updateField('telephoneSecondaire', e.target.value)}
                    />
                  </ContainerLabelInput>
                </FormColumn>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Site web</Label>
                    <Input
                      type="url"
                      value={formData.siteWeb}
                      onChange={(e) => updateField('siteWeb', e.target.value)}
                      placeholder="https://www.exemple.com"
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Réseaux sociaux</Label>
                    <Input
                      value={formData.reseauSociaux}
                      onChange={(e) => updateField('reseauSociaux', e.target.value)}
                      placeholder="LinkedIn, Facebook..."
                    />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 3. LOGO ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('logo')}>
            <AccordionTitle><ImageIcon size={16} strokeWidth={2} />Logo de l'entreprise</AccordionTitle>
            <AccordionToggle>{openSections.logo ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.logo && (
            <AccordionBody>
              <LogoSection>
                {formData.logo ? (
                  <LogoPreview src={formData.logo} alt="Logo" />
                ) : (
                  <LogoEmpty>
                    {formData.nomEntreprise?.charAt(0).toUpperCase() || '?'}
                  </LogoEmpty>
                )}
                <LogoControls>
                  <Label>Logo de l'entreprise</Label>

                  <LogoUploadLabel htmlFor="logo-upload-input">
                    <FolderOpen size={14} strokeWidth={2} /> Choisir une image depuis mon ordinateur
                  </LogoUploadLabel>
                  <HiddenFileInput
                    id="logo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />

                  {formData.logo && (
                    <LogoRemoveButton onClick={() => updateField('logo', '')}>
                      <Trash2 size={13} strokeWidth={2} /> Retirer le logo
                    </LogoRemoveButton>
                  )}

                  <InfoNote>
                    <Lightbulb size={12} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 4 }} />
                    Formats acceptés : JPG, PNG, WebP. Taille maximum : 2 Mo.
                    Un format carré est recommandé pour un meilleur affichage.
                  </InfoNote>
                </LogoControls>
              </LogoSection>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== BARRE D'ACTIONS ========== */}
        <ActionBar>
          <CancelButton onClick={() => router.back()} disabled={isSaving}>
            Annuler
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : (
              <><Save size={15} strokeWidth={2} /> Enregistrer les modifications</>
            )}
          </SaveButton>
        </ActionBar>
      </PageContainer>
    </>
  )
}