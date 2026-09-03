'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import { LIBELLES_DOMAINES } from '@/lib/referentiels'
import AppNavbar from '@/components/appNavbar'
import {
  GraduationCap, Phone, Image as ImageIcon, Upload, Trash2, Info, Lock,
  AlertCircle, CheckCircle2, ArrowLeft, ArrowRight,
  Plus, Minus, Save, BookOpen
} from 'lucide-react'
import {
  PageContainer, BackButton,
  PageHeader, PageTitle, PageSubtitle,
  AccordionSection, AccordionHeader, AccordionTitle, AccordionToggle,
  AccordionBody,
  FormGrid, FormColumn,
  Label, Input, ContainerLabelInput,
  LogoSection, LogoPreview, LogoEmpty, LogoControls,
  LogoUploadLabel, HiddenFileInput, LogoRemoveButton,
  ActionBar, SaveButton, CancelButton,
  AlertMessage, AlertIcon, LoadingState, InfoNote,
  SecurityLink
} from '@/components/styleUniversiteModifierProfil'

export default function UniversiteModifierProfilPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    nomUniversite: '',
    sigleUniversitaire: '',
    adresseUniversite: '',
    ville: '',
    telephoneUniversite: '',
    siteWeb: '',
    logo: ''
  })

  const [openSections, setOpenSections] = useState({
    general: true,
    filieres: false,
    contact: false,
    logo: false
  })

  const [domaines, setDomaines] = useState([])
  const [observes, setObserves] = useState([])

  useEffect(() => {
    fetchAuth('/api/universiteDomaines')
      .then(r => r.json())
      .then(d => { setDomaines(d.domaines || []); setObserves(d.observes || []) })
      .catch(() => {})
  }, [])

  const basculerDomaine = (domaine) => {
    setDomaines(prev => prev.includes(domaine)
      ? prev.filter(d => d !== domaine)
      : [...prev, domaine])
  }

  const enregistrerDomaines = async () => {
    setError(''); setSuccess('')
    try {
      const res = await fetchAuth('/api/universiteDomaines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domaines })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message)
    } catch (err) { setError(err.message) }
  }

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetchAuth('/api/universiteModifierProfil')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

        const u = data.universite
        setFormData({
          nomUniversite: u.nomUniversite || '',
          sigleUniversitaire: u.sigleUniversitaire || '',
          adresseUniversite: u.adresseUniversite || '',
          ville: u.ville || '',
          telephoneUniversite: u.telephoneUniversite || '',
          siteWeb: u.siteWeb || '',
          logo: u.logo || ''
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfil()
  }, [])

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

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

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetchAuth('/api/universiteModifierProfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Erreur')

      setSuccess('Profil mis à jour avec succès !')

      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('utilisateur') || '{}')
        router.push(`/pages/universiteProfil/${user.idUniversite}`)
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
        <BackButton onClick={() => router.back()}>
          <ArrowLeft size={14} strokeWidth={2} />
          Profil
        </BackButton>

        <PageHeader>
          <PageTitle>Modifier mon profil université</PageTitle>
          <PageSubtitle>
            Cliquez sur une section pour la déplier et modifier ses informations.
          </PageSubtitle>
        </PageHeader>

        {error && (
          <AlertMessage $type="error">
            <AlertIcon><AlertCircle size={18} strokeWidth={2} /></AlertIcon>
            {error}
          </AlertMessage>
        )}
        {success && (
          <AlertMessage $type="success">
            <AlertIcon><CheckCircle2 size={18} strokeWidth={2} /></AlertIcon>
            {success}
          </AlertMessage>
        )}

        {/* ========== 1. INFORMATIONS GÉNÉRALES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('general')}>
            <AccordionTitle>
              <GraduationCap size={17} strokeWidth={2} />
              Informations générales
            </AccordionTitle>
            <AccordionToggle>
              {openSections.general
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.general && (
            <AccordionBody>
              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Nom de l'université *</Label>
                    <Input
                      value={formData.nomUniversite}
                      onChange={(e) => updateField('nomUniversite', e.target.value)}
                    />
                  </ContainerLabelInput>
                </FormColumn>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Sigle universitaire</Label>
                    <Input
                      value={formData.sigleUniversitaire}
                      onChange={(e) => updateField('sigleUniversitaire', e.target.value)}
                      placeholder="Ex: ESPA, ENI..."
                    />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>

              <SecurityLink onClick={() => router.push('/pages/universiteChangerMotDePasse')}>
                <Lock size={14} strokeWidth={2} />
                Changer mon mot de passe
                <ArrowRight size={13} strokeWidth={2.5} />
              </SecurityLink>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 2. CONTACT ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('filieres')}>
            <AccordionTitle>
              <BookOpen size={17} strokeWidth={2} />
              Filières enseignées
            </AccordionTitle>
            <AccordionToggle>
              {openSections.filieres
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.filieres && (
            <AccordionBody>
              <InfoNote>
                <Info size={13} strokeWidth={2} />
                Un étudiant qui vous choisit à l&apos;inscription ne pourra déclarer
                que ces filières. Cela évite les profils incohérents — et donc les
                recommandations calculées sur une spécialité que vous n&apos;enseignez pas.
                <br /><br />
                <strong>Ne rien cocher laisse le choix libre.</strong> C&apos;est le
                réglage à conserver tant que vous n&apos;êtes pas sûr de la liste :
                mieux vaut ne rien contraindre que bloquer un étudiant légitime.
              </InfoNote>

              {/* Ce que les étudiants déjà rattachés révèlent. Une filière
                  observée mais non cochée signale une déclaration en retard
                  sur la réalité — et de futures inscriptions refusées sans
                  que l'université comprenne pourquoi. */}
              {observes.filter(o => !domaines.includes(o)).length > 0 && (
                <InfoNote style={{ borderColor: '#fcd34d', background: '#fffbeb' }}>
                  <AlertCircle size={13} strokeWidth={2} />
                  Des étudiants déjà rattachés déclarent des filières que vous
                  n&apos;avez pas cochées :{' '}
                  <strong>{observes.filter(o => !domaines.includes(o)).join(', ')}</strong>.
                  Si vous les enseignez, cochez-les — sinon les prochaines inscriptions
                  seront refusées.
                </InfoNote>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
                {LIBELLES_DOMAINES.map(d => {
                  const coche = domaines.includes(d)
                  return (
                    <label key={d} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '9px 13px', fontSize: 13, cursor: 'pointer',
                      borderRadius: 9, border: `1.5px solid ${coche ? '#d4b89d' : '#e2e8f0'}`,
                      background: coche ? '#f5f3eb' : '#fff',
                      color: coche ? '#6b5744' : '#334155',
                      fontWeight: coche ? 600 : 400
                    }}>
                      <input type="checkbox" checked={coche}
                        onChange={() => basculerDomaine(d)}
                        style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      {d}
                    </label>
                  )
                })}
              </div>

              <ActionBar style={{ marginTop: 18 }}>
                <span />
                <SaveButton type="button" onClick={enregistrerDomaines}>
                  <Save size={15} strokeWidth={2} />
                  {domaines.length === 0
                    ? 'Enregistrer (choix libre)'
                    : `Enregistrer ${domaines.length} filière${domaines.length > 1 ? 's' : ''}`}
                </SaveButton>
              </ActionBar>
            </AccordionBody>
          )}
        </AccordionSection>

        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('contact')}>
            <AccordionTitle>
              <Phone size={17} strokeWidth={2} />
              Contact et coordonnées
            </AccordionTitle>
            <AccordionToggle>
              {openSections.contact
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.contact && (
            <AccordionBody>
              <ContainerLabelInput>
                <Label>Adresse</Label>
                <Input
                  value={formData.adresseUniversite}
                  onChange={(e) => updateField('adresseUniversite', e.target.value)}
                />
              </ContainerLabelInput>

              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Ville</Label>
                    <Input
                      value={formData.ville}
                      onChange={(e) => updateField('ville', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.telephoneUniversite}
                      onChange={(e) => updateField('telephoneUniversite', e.target.value)}
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
                </FormColumn>
              </FormGrid>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 3. LOGO ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('logo')}>
            <AccordionTitle>
              <ImageIcon size={17} strokeWidth={2} />
              Logo de l'université
            </AccordionTitle>
            <AccordionToggle>
              {openSections.logo
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.logo && (
            <AccordionBody>
              <LogoSection>
                {formData.logo ? (
                  <LogoPreview src={formData.logo} alt="Logo" />
                ) : (
                  <LogoEmpty>
                    {formData.sigleUniversitaire?.charAt(0).toUpperCase() ||
                     formData.nomUniversite?.charAt(0).toUpperCase() || '?'}
                  </LogoEmpty>
                )}
                <LogoControls>
                  <Label>Logo de l'université</Label>

                  <LogoUploadLabel htmlFor="logo-upload-input">
                    <Upload size={15} strokeWidth={2} />
                    Choisir une image depuis mon ordinateur
                  </LogoUploadLabel>
                  <HiddenFileInput
                    id="logo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />

                  {formData.logo && (
                    <LogoRemoveButton onClick={() => updateField('logo', '')}>
                      <Trash2 size={13} strokeWidth={2} />
                      Retirer le logo
                    </LogoRemoveButton>
                  )}

                  <InfoNote>
                    <Info size={13} strokeWidth={2} />
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
            {isSaving ? (
              'Enregistrement...'
            ) : (
              <>
                <Save size={15} strokeWidth={2} />
                Enregistrer les modifications
              </>
            )}
          </SaveButton>
        </ActionBar>
      </PageContainer>
    </>
  )
}