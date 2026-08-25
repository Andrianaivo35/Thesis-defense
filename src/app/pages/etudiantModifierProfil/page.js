'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import ChangerMotDePasseModal from '@/components/changerMotDePasseModal'
import {
  User, GraduationCap, Target, Briefcase, Heart, Wrench,
  Upload, Trash2, Info, Lock, Sparkles,
  AlertCircle, CheckCircle2, ArrowLeft, ArrowRight,
  Plus, Minus, Save
} from 'lucide-react'
import {
  PageContainer, BackButton,
  PageHeader, PageTitle, PageSubtitle,
  AccordionSection, AccordionHeader, AccordionTitle, AccordionToggle,
  AccordionBody,
  FormGrid, FormColumn,
  Label, Input, Select, Textarea, ContainerLabelInput,
  PhotoSection, PhotoPreview, PhotoEmpty, PhotoControls, PhotoActions,
  PhotoButton, PhotoUploadLabel, HiddenFileInput,
  ItemCard, ItemHeader, ItemBadge, ItemDeleteButton, AddItemButton,
  ActionBar, SaveButton, CancelButton,
  AlertMessage, AlertIcon, LoadingState, InfoNote,
  SecurityLink
} from '@/components/styleEtudiantModifierProfil'

const NIVEAUX_COMPETENCE = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert']

export default function EtudiantModifierProfilPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showPwdModal, setShowPwdModal] = useState(false)

  // référentiel : sert uniquement de suggestions dans le datalist
  const [referentiel, setReferentiel] = useState([])

  const [formData, setFormData] = useState({
    nomEtudiant: '', prenomEtudiant: '', telephoneEtudiant: '',
    genre: '', adresse: '',
    photoProfil: '', bio: '',
    matricule: '', filiere: '', specialisation: '', niveauAcademique: '',
    nomUniversite: '',
    preferenceStage: {
      villePreferee: '', accepteTeletravail: '', rayonDeplacement: '',
      mobiliteNational: '', typeStagePreferee: '', dureeSouhaitee: '',
      dateDebutDisponibilite: '', dateFinDisponibilite: '',
      typeEntreprisePreferee: '', disponibiliteImmediate: ''
    },
    parcours: [],
    centresInteret: [],
    competences: []
  })

  const [parcoursActions, setParcoursActions] = useState([])
  const [interetsActions, setInteretsActions] = useState([])
  const [competencesActions, setCompetencesActions] = useState([])

  const [openSections, setOpenSections] = useState({
    perso: true,
    academique: false,
    competences: false,
    preferences: false,
    parcours: false,
    interets: false
  })

  useEffect(() => {
    const fetchReferentiel = async () => {
      try {
        const res = await fetch('/api/competenceReference')
        const data = await res.json()
        if (res.ok) setReferentiel(data.competences || [])
      } catch (err) {
        console.warn('Référentiel non chargé :', err.message)
      }
    }
    fetchReferentiel()
  }, [])

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetchAuth('/api/etudiantModifierProfil')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

        const e = data.etudiant
        setFormData({
          nomEtudiant: e.nomEtudiant || '',
          prenomEtudiant: e.prenomEtudiant || '',
          telephoneEtudiant: e.telephoneEtudiant || '',
          genre: e.genre || '',
          adresse: e.adresse || '',
          photoProfil: e.photoProfil || '',
          bio: e.bio || '',
          matricule: e.matricule || '',
          filiere: e.filiere || '',
          specialisation: e.specialisation || '',
          niveauAcademique: e.niveauAcademique || '',
          nomUniversite: e.nomUniversite || e.nomUniversiteSaisi || '',
          preferenceStage: {
            villePreferee: data.preferenceStage?.villePreferee || '',
            accepteTeletravail: data.preferenceStage?.accepteTeletravail || '',
            rayonDeplacement: data.preferenceStage?.rayonDeplacement || '',
            mobiliteNational: String(data.preferenceStage?.mobiliteNational ?? ''),
            typeStagePreferee: data.preferenceStage?.typeStagePreferee || '',
            dureeSouhaitee: data.preferenceStage?.dureeSouhaitee || '',
            dateDebutDisponibilite: data.preferenceStage?.dateDebutDisponibilite?.split('T')[0] || '',
            dateFinDisponibilite: data.preferenceStage?.dateFinDisponibilite?.split('T')[0] || '',
            typeEntreprisePreferee: data.preferenceStage?.typeEntreprisePreferee || '',
            disponibiliteImmediate: String(data.preferenceStage?.disponibiliteImmediate ?? '')
          },
          parcours: (data.parcours || []).map(p => ({
            ...p,
            _isNew: false,
            _modified: false,
            dateDebut: p.dateDebut?.split('T')[0] || '',
            dateFin: p.dateFin?.split('T')[0] || ''
          })),
          centresInteret: (data.centresInteret || []).map(c => ({
            ...c,
            _isNew: false,
            _modified: false,
            domaine: c.domaineInteret || '',
            mission: c.missionPreferee || ''
          })),
          competences: (data.competences || []).map(c => ({
            ...c,
            _isNew: false,
            _modified: false,
            nomCompetence: c.nomCompetenceReference || '',
            categorie: c.categorieCompetenceReference || '',
            niveau: c.niveau || 'Débutant'
          }))
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

  const updatePreference = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferenceStage: { ...prev.preferenceStage, [field]: value }
    }))
  }

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePhotoUpload = (e) => {
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
      updateField('photoProfil', event.target.result)
    }
    reader.onerror = () => setError("Impossible de lire le fichier.")
    reader.readAsDataURL(file)
  }

  /* ---------- Parcours ---------- */
  const ajouterParcours = () => {
    const newId = `new-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      parcours: [...prev.parcours, {
        idParcoursRealisation: newId,
        _isNew: true,
        type: '', titre: '', description: '',
        entreprise: '', dateDebut: '', dateFin: '', lien: ''
      }]
    }))
  }

  const modifierParcours = (idx, champ, valeur) => {
    setFormData(prev => {
      const updated = [...prev.parcours]
      updated[idx] = { ...updated[idx], [champ]: valeur, _modified: !updated[idx]._isNew }
      return { ...prev, parcours: updated }
    })
  }

  const supprimerParcours = (idx) => {
    const item = formData.parcours[idx]
    if (!item._isNew) {
      setParcoursActions(prev => [...prev, { action: 'delete', id: item.idParcoursRealisation }])
    }
    setFormData(prev => ({
      ...prev,
      parcours: prev.parcours.filter((_, i) => i !== idx)
    }))
  }

  /* ---------- Centres d'intérêt ---------- */
  const ajouterInteret = () => {
    const newId = `new-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      centresInteret: [...prev.centresInteret, {
        idCentreInteret: newId,
        _isNew: true,
        domaine: '', mission: ''
      }]
    }))
  }

  const modifierInteret = (idx, champ, valeur) => {
    setFormData(prev => {
      const updated = [...prev.centresInteret]
      updated[idx] = { ...updated[idx], [champ]: valeur, _modified: !updated[idx]._isNew }
      return { ...prev, centresInteret: updated }
    })
  }

  const supprimerInteret = (idx) => {
    const item = formData.centresInteret[idx]
    if (!item._isNew) {
      setInteretsActions(prev => [...prev, { action: 'delete', id: item.idCentreInteret }])
    }
    setFormData(prev => ({
      ...prev,
      centresInteret: prev.centresInteret.filter((_, i) => i !== idx)
    }))
  }

  /* ---------- Compétences ---------- */
  const ajouterCompetence = () => {
    const newId = `new-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      competences: [...prev.competences, {
        idCompetenceEtudiant: newId,
        _isNew: true,
        nomCompetence: '',
        categorie: '',
        niveau: 'Débutant'
      }]
    }))
  }

  const modifierCompetence = (idx, champ, valeur) => {
    setFormData(prev => {
      const updated = [...prev.competences]
      updated[idx] = { ...updated[idx], [champ]: valeur, _modified: !updated[idx]._isNew }

      /* Si le nom saisi correspond à une compétence du référentiel,
         on remplit automatiquement sa catégorie. */
      if (champ === 'nomCompetence') {
        const trouvee = referentiel.find(
          r => r.nomCompetenceReference.toLowerCase() === valeur.trim().toLowerCase()
        )
        if (trouvee) {
          updated[idx].categorie = trouvee.categorieCompetenceReference || ''
        }
      }

      return { ...prev, competences: updated }
    })
  }

  const supprimerCompetence = (idx) => {
    const item = formData.competences[idx]
    if (!item._isNew) {
      setCompetencesActions(prev => [...prev, { action: 'delete', id: item.idCompetenceEtudiant }])
    }
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.filter((_, i) => i !== idx)
    }))
  }

  /* Catégories déjà connues, proposées en suggestion */
  const categoriesConnues = [...new Set(
    referentiel.map(r => r.categorieCompetenceReference).filter(Boolean)
  )].sort()

  /* ---------- Enregistrement ---------- */
  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const allParcoursActions = [
        ...parcoursActions,
        ...formData.parcours
          .filter(p => p._isNew && p.titre?.trim())
          .map(p => ({
            action: 'create',
            data: {
              type: p.type, titrePoste: p.titre, description: p.description,
              entreprise: p.entreprise, dateDebut: p.dateDebut,
              dateFin: p.dateFin, lien: p.lien
            }
          })),
        ...formData.parcours
          .filter(p => !p._isNew && p._modified && p.titre?.trim())
          .map(p => ({
            action: 'update',
            id: p.idParcoursRealisation,
            data: {
              type: p.type, titrePoste: p.titre, description: p.description,
              entreprise: p.entreprise, dateDebut: p.dateDebut,
              dateFin: p.dateFin, lien: p.lien
            }
          }))
      ]

      const allInteretsActions = [
        ...interetsActions,
        ...formData.centresInteret
          .filter(c => c._isNew && c.domaine?.trim())
          .map(c => ({
            action: 'create',
            data: { domaine: c.domaine, mission: c.mission }
          })),
        ...formData.centresInteret
          .filter(c => !c._isNew && c._modified && c.domaine?.trim())
          .map(c => ({
            action: 'update',
            id: c.idCentreInteret,
            data: { domaine: c.domaine, mission: c.mission }
          }))
      ]

      const allCompetencesActions = [
        ...competencesActions,
        ...formData.competences
          .filter(c => c._isNew && c.nomCompetence?.trim())
          .map(c => ({
            action: 'create',
            data: {
              nomCompetence: c.nomCompetence.trim(),
              categorie: c.categorie,
              niveau: c.niveau
            }
          })),
        ...formData.competences
          .filter(c => !c._isNew && c._modified && c.nomCompetence?.trim())
          .map(c => ({
            action: 'update',
            id: c.idCompetenceEtudiant,
            data: {
              nomCompetence: c.nomCompetence.trim(),
              categorie: c.categorie,
              niveau: c.niveau
            }
          }))
      ]

      const body = {
        nomEtudiant: formData.nomEtudiant,
        prenomEtudiant: formData.prenomEtudiant,
        telephoneEtudiant: formData.telephoneEtudiant,
        genre: formData.genre,
        adresse: formData.adresse,
        photoProfil: formData.photoProfil,
        bio: formData.bio,
        matricule: formData.matricule,
        filiere: formData.filiere,
        specialisation: formData.specialisation,
        niveauAcademique: formData.niveauAcademique,
        nomUniversite: formData.nomUniversite,
        preferenceStage: formData.preferenceStage,
        parcoursActions: allParcoursActions,
        interetsActions: allInteretsActions,
        competencesActions: allCompetencesActions
      }

      const res = await fetchAuth('/api/etudiantModifierProfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Erreur')

      setSuccess('Profil mis à jour avec succès !')
      setParcoursActions([])
      setInteretsActions([])
      setCompetencesActions([])

      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('utilisateur') || '{}')
        router.push(`/pages/etudiantProfil/${user.idEtudiant}`)
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
          <PageTitle>Modifier mon profil</PageTitle>
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

        {/* ========== 1. INFORMATIONS PERSONNELLES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('perso')}>
            <AccordionTitle>
              <User size={17} strokeWidth={2} />
              Informations personnelles
            </AccordionTitle>
            <AccordionToggle>
              {openSections.perso
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.perso && (
            <AccordionBody>
              <PhotoSection>
                {formData.photoProfil ? (
                  <PhotoPreview src={formData.photoProfil} alt="Profil" />
                ) : (
                  <PhotoEmpty>
                    {(formData.prenomEtudiant?.charAt(0) || '') + (formData.nomEtudiant?.charAt(0) || '')}
                  </PhotoEmpty>
                )}
                <PhotoControls>
                  <Label>Photo de profil</Label>

                  <PhotoActions>
                    <PhotoUploadLabel htmlFor="photo-upload-input">
                      <Upload size={15} strokeWidth={2} />
                      Choisir une image
                    </PhotoUploadLabel>
                    <HiddenFileInput
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />

                    {formData.photoProfil && (
                      <PhotoButton onClick={() => updateField('photoProfil', '')}>
                        <Trash2 size={13} strokeWidth={2} />
                        Retirer la photo
                      </PhotoButton>
                    )}
                  </PhotoActions>
                </PhotoControls>
              </PhotoSection>

              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Nom</Label>
                    <Input value={formData.nomEtudiant} onChange={(e) => updateField('nomEtudiant', e.target.value)} />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Prénom</Label>
                    <Input value={formData.prenomEtudiant} onChange={(e) => updateField('prenomEtudiant', e.target.value)} />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Téléphone</Label>
                    <Input value={formData.telephoneEtudiant} onChange={(e) => updateField('telephoneEtudiant', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>

                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Sexe</Label>
                    <Select value={formData.genre} onChange={(e) => updateField('genre', e.target.value)}>
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Adresse</Label>
                    <Input value={formData.adresse} onChange={(e) => updateField('adresse', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>

              <ContainerLabelInput>
                <Label>Bio</Label>
                <Textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Parlez de vous, de vos passions, de votre parcours..."
                />
              </ContainerLabelInput>

              <SecurityLink onClick={() => setShowPwdModal(true)}>
                <Lock size={14} strokeWidth={2} />
                Changer mon mot de passe
                <ArrowRight size={13} strokeWidth={2.5} />
              </SecurityLink>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 2. INFORMATIONS ACADÉMIQUES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('academique')}>
            <AccordionTitle>
              <GraduationCap size={17} strokeWidth={2} />
              Informations académiques
            </AccordionTitle>
            <AccordionToggle>
              {openSections.academique
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.academique && (
            <AccordionBody>
              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Université</Label>
                    <Input
                      value={formData.nomUniversite}
                      onChange={(e) => updateField('nomUniversite', e.target.value)}
                      placeholder="Tapez le nom complet de votre université"
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Niveau Académique</Label>
                    <Input value={formData.niveauAcademique} onChange={(e) => updateField('niveauAcademique', e.target.value)} />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Filière</Label>
                    <Input value={formData.filiere} onChange={(e) => updateField('filiere', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>

                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Spécialisation</Label>
                    <Input value={formData.specialisation} onChange={(e) => updateField('specialisation', e.target.value)} />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Matricule</Label>
                    <Input value={formData.matricule} onChange={(e) => updateField('matricule', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 3. COMPÉTENCES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('competences')}>
            <AccordionTitle>
              <Wrench size={17} strokeWidth={2} />
              Compétences ({formData.competences.length})
            </AccordionTitle>
            <AccordionToggle>
              {openSections.competences
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.competences && (
            <AccordionBody>
              <InfoNote>
                <Info size={13} strokeWidth={2} />
                Tapez librement votre compétence. Si elle existe déjà, elle vous sera
                suggérée ; sinon elle sera ajoutée automatiquement.
              </InfoNote>

              {/* Suggestions partagées par tous les champs */}
              <datalist id="liste-competences">
                {referentiel.map(r => (
                  <option key={r.idCompetenceReference} value={r.nomCompetenceReference} />
                ))}
              </datalist>
              <datalist id="liste-categories">
                {categoriesConnues.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              {formData.competences.length === 0 ? (
                <InfoNote>
                  <Info size={13} strokeWidth={2} />
                  Aucune compétence déclarée. Ajoutez-en pour recevoir des offres
                  qui vous correspondent vraiment.
                </InfoNote>
              ) : (
                formData.competences.map((c, idx) => (
                  <ItemCard key={c.idCompetenceEtudiant}>
                    <ItemHeader>
                      <ItemBadge $isNew={c._isNew}>
                        {c._isNew ? (
                          <>
                            <Sparkles size={12} strokeWidth={2.5} />
                            Nouvelle
                          </>
                        ) : (
                          c.nomCompetence || `Compétence ${idx + 1}`
                        )}
                      </ItemBadge>
                      <ItemDeleteButton onClick={() => supprimerCompetence(idx)}>
                        <Trash2 size={13} strokeWidth={2} />
                        Supprimer
                      </ItemDeleteButton>
                    </ItemHeader>

                    <FormGrid>
                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Compétence</Label>
                          <Input
                            list="liste-competences"
                            value={c.nomCompetence || ''}
                            onChange={(e) => modifierCompetence(idx, 'nomCompetence', e.target.value)}
                            placeholder="Ex : JavaScript, Comptabilité, Soudure..."
                          />
                        </ContainerLabelInput>

                        <ContainerLabelInput>
                          <Label>Catégorie</Label>
                          <Input
                            list="liste-categories"
                            value={c.categorie || ''}
                            onChange={(e) => modifierCompetence(idx, 'categorie', e.target.value)}
                            placeholder="Ex : Développement, Gestion, Langue..."
                          />
                        </ContainerLabelInput>
                      </FormColumn>

                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Niveau de maîtrise</Label>
                          <Select
                            value={c.niveau || 'Débutant'}
                            onChange={(e) => modifierCompetence(idx, 'niveau', e.target.value)}
                          >
                            {NIVEAUX_COMPETENCE.map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </Select>
                        </ContainerLabelInput>
                      </FormColumn>
                    </FormGrid>
                  </ItemCard>
                ))
              )}

              <AddItemButton onClick={ajouterCompetence}>
                <Plus size={15} strokeWidth={2.5} />
                Ajouter une compétence
              </AddItemButton>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 4. PRÉFÉRENCES DE STAGE ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('preferences')}>
            <AccordionTitle>
              <Target size={17} strokeWidth={2} />
              Préférences de stage
            </AccordionTitle>
            <AccordionToggle>
              {openSections.preferences
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.preferences && (
            <AccordionBody>
              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Ville préférée</Label>
                    <Input
                      value={formData.preferenceStage.villePreferee}
                      onChange={(e) => updatePreference('villePreferee', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Rayon de déplacement</Label>
                    <Input
                      value={formData.preferenceStage.rayonDeplacement}
                      onChange={(e) => updatePreference('rayonDeplacement', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Accepte télétravail</Label>
                    <Select
                      value={formData.preferenceStage.accepteTeletravail}
                      onChange={(e) => updatePreference('accepteTeletravail', e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      <option value="Oui">OUI</option>
                      <option value="Non">NON</option>
                      <option value="Hybride">HYBRIDE</option>
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Mobilité nationale</Label>
                    <Select
                      value={formData.preferenceStage.mobiliteNational}
                      onChange={(e) => updatePreference('mobiliteNational', e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      <option value="true">OUI</option>
                      <option value="false">NON</option>
                    </Select>
                  </ContainerLabelInput>
                </FormColumn>

                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Type de stage préféré</Label>
                    <Input
                      value={formData.preferenceStage.typeStagePreferee}
                      onChange={(e) => updatePreference('typeStagePreferee', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Type d&apos;entreprise préférée</Label>
                    <Input
                      value={formData.preferenceStage.typeEntreprisePreferee}
                      onChange={(e) => updatePreference('typeEntreprisePreferee', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Durée souhaitée</Label>
                    <Input
                      value={formData.preferenceStage.dureeSouhaitee}
                      onChange={(e) => updatePreference('dureeSouhaitee', e.target.value)}
                    />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Disponibilité immédiate</Label>
                    <Select
                      value={formData.preferenceStage.disponibiliteImmediate}
                      onChange={(e) => updatePreference('disponibiliteImmediate', e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      <option value="true">OUI</option>
                      <option value="false">NON</option>
                    </Select>
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>

              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Date début de disponibilité</Label>
                    <Input
                      type="date"
                      value={formData.preferenceStage.dateDebutDisponibilite}
                      onChange={(e) => updatePreference('dateDebutDisponibilite', e.target.value)}
                    />
                  </ContainerLabelInput>
                </FormColumn>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Date fin de disponibilité</Label>
                    <Input
                      type="date"
                      value={formData.preferenceStage.dateFinDisponibilite}
                      onChange={(e) => updatePreference('dateFinDisponibilite', e.target.value)}
                    />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 5. PARCOURS ET RÉALISATIONS ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('parcours')}>
            <AccordionTitle>
              <Briefcase size={17} strokeWidth={2} />
              Parcours et réalisations ({formData.parcours.length})
            </AccordionTitle>
            <AccordionToggle>
              {openSections.parcours
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.parcours && (
            <AccordionBody>
              {formData.parcours.length === 0 ? (
                <InfoNote>
                  <Info size={13} strokeWidth={2} />
                  Aucun parcours pour l&apos;instant. Cliquez sur le bouton ci-dessous pour en ajouter un.
                </InfoNote>
              ) : (
                formData.parcours.map((p, idx) => (
                  <ItemCard key={p.idParcoursRealisation}>
                    <ItemHeader>
                      <ItemBadge $isNew={p._isNew}>
                        {p._isNew ? (
                          <>
                            <Sparkles size={12} strokeWidth={2.5} />
                            Nouveau
                          </>
                        ) : (
                          `Parcours ${idx + 1}`
                        )}
                      </ItemBadge>
                      <ItemDeleteButton onClick={() => supprimerParcours(idx)}>
                        <Trash2 size={13} strokeWidth={2} />
                        Supprimer
                      </ItemDeleteButton>
                    </ItemHeader>

                    <FormGrid>
                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Titre du poste</Label>
                          <Input value={p.titre || ''} onChange={(e) => modifierParcours(idx, 'titre', e.target.value)} />
                        </ContainerLabelInput>

                        <ContainerLabelInput>
                          <Label>Entreprise</Label>
                          <Input value={p.entreprise || ''} onChange={(e) => modifierParcours(idx, 'entreprise', e.target.value)} />
                        </ContainerLabelInput>

                        <ContainerLabelInput>
                          <Label>Type</Label>
                          <Input value={p.type || ''} onChange={(e) => modifierParcours(idx, 'type', e.target.value)} placeholder="Ex: Stage, projet personnel" />
                        </ContainerLabelInput>

                        <ContainerLabelInput>
                          <Label>Lien</Label>
                          <Input value={p.lien || ''} onChange={(e) => modifierParcours(idx, 'lien', e.target.value)} />
                        </ContainerLabelInput>
                      </FormColumn>

                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Date de début</Label>
                          <Input type="date" value={p.dateDebut || ''} onChange={(e) => modifierParcours(idx, 'dateDebut', e.target.value)} />
                        </ContainerLabelInput>

                        <ContainerLabelInput>
                          <Label>Date de fin</Label>
                          <Input type="date" value={p.dateFin || ''} onChange={(e) => modifierParcours(idx, 'dateFin', e.target.value)} />
                        </ContainerLabelInput>

                        <ContainerLabelInput>
                          <Label>Description</Label>
                          <Textarea
                            rows={3}
                            value={p.description || ''}
                            onChange={(e) => modifierParcours(idx, 'description', e.target.value)}
                          />
                        </ContainerLabelInput>
                      </FormColumn>
                    </FormGrid>
                  </ItemCard>
                ))
              )}

              <AddItemButton onClick={ajouterParcours}>
                <Plus size={15} strokeWidth={2.5} />
                Ajouter un parcours
              </AddItemButton>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 6. CENTRES D'INTÉRÊT ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('interets')}>
            <AccordionTitle>
              <Heart size={17} strokeWidth={2} />
              Centres d&apos;intérêt ({formData.centresInteret.length})
            </AccordionTitle>
            <AccordionToggle>
              {openSections.interets
                ? <Minus size={16} strokeWidth={2.5} />
                : <Plus size={16} strokeWidth={2.5} />}
            </AccordionToggle>
          </AccordionHeader>
          {openSections.interets && (
            <AccordionBody>
              {formData.centresInteret.length === 0 ? (
                <InfoNote>
                  <Info size={13} strokeWidth={2} />
                  Aucun centre d&apos;intérêt pour l&apos;instant.
                </InfoNote>
              ) : (
                formData.centresInteret.map((c, idx) => (
                  <ItemCard key={c.idCentreInteret}>
                    <ItemHeader>
                      <ItemBadge $isNew={c._isNew}>
                        {c._isNew ? (
                          <>
                            <Sparkles size={12} strokeWidth={2.5} />
                            Nouveau
                          </>
                        ) : (
                          `Centre ${idx + 1}`
                        )}
                      </ItemBadge>
                      <ItemDeleteButton onClick={() => supprimerInteret(idx)}>
                        <Trash2 size={13} strokeWidth={2} />
                        Supprimer
                      </ItemDeleteButton>
                    </ItemHeader>

                    <FormGrid>
                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Domaine</Label>
                          <Input
                            value={c.domaine || ''}
                            onChange={(e) => modifierInteret(idx, 'domaine', e.target.value)}
                          />
                        </ContainerLabelInput>
                      </FormColumn>
                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Mission préférée</Label>
                          <Input
                            value={c.mission || ''}
                            onChange={(e) => modifierInteret(idx, 'mission', e.target.value)}
                          />
                        </ContainerLabelInput>
                      </FormColumn>
                    </FormGrid>
                  </ItemCard>
                ))
              )}

              <AddItemButton onClick={ajouterInteret}>
                <Plus size={15} strokeWidth={2.5} />
                Ajouter un centre d&apos;intérêt
              </AddItemButton>
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

        {/* ========== MODAL : CHANGER LE MOT DE PASSE ========== */}
        {showPwdModal && (
          <ChangerMotDePasseModal onClose={() => setShowPwdModal(false)} />
        )}
      </PageContainer>
    </>
  )
}