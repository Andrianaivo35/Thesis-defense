'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import { VILLES, LIBELLES_DOMAINES } from '@/lib/referentiels'
import AppNavbar from '@/components/appNavbar'
import {
  ArrowLeft, Pencil, Sparkles, ClipboardList, Users, Plus,
  FileText, CheckCircle2, Download, RefreshCw, Upload, Info,
  Trash2, AlertCircle, Save, Send
} from 'lucide-react'
import {
  PageContainer, BackButton, PageHeader, PageTitle, PageSubtitle,
  Section, SectionHeader, SectionTitle,
  FieldGroup, Label, Input, Textarea, Select, Grid2Cols,
  AddEtudiantButton, EtudiantsList, EtudiantCard, EtudiantNumber, EtudiantFields,
  SupprimerEtudiantButton,
  DocSection, DocLabel, DocBadge, DocButton, DocUploadLabel, DocActions, HiddenFileInput,
  EmptyEtudiants, ActionBar, CancelButton, SaveButton,
  AlertMessage, AlertIcon, LoadingState, InfoNote
} from '@/components/styleFormulaireAnnonceCohorte'

let localIdCounter = 1
const genId = () => `local-${localIdCounter++}`

export default function FormulaireAnnonceCohorte({ idAnnonce = null }) {
  const router = useRouter()
  const isEditMode = !!idAnnonce

  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    titre: '', description: '', filiereConcernee: '', niveauAcademique: '',
    domainesRecherche: '', periodeDebut: '', periodeFin: '', dureeStage: '',
    villePreferee: '', accepteTeletravail: '', dateLimite: '', statut: 'Active'
  })

  const [etudiants, setEtudiants] = useState([])
  const [etudiantsInitiaux, setEtudiantsInitiaux] = useState([])

  useEffect(() => {
    if (!isEditMode) return
    const fetchData = async () => {
      try {
        const res = await fetchAuth(`/api/universiteCohortes/${idAnnonce}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

        const a = data.annonce
        setFormData({
          titre: a.titre || '',
          description: a.description || '',
          filiereConcernee: a.filiereConcernee || '',
          niveauAcademique: a.niveauAcademique || '',
          domainesRecherche: a.domainesRecherche || '',
          periodeDebut: a.periodeDebut ? a.periodeDebut.split('T')[0] : '',
          periodeFin: a.periodeFin ? a.periodeFin.split('T')[0] : '',
          dureeStage: a.dureeStage || '',
          villePreferee: a.villePreferee || '',
          accepteTeletravail: a.accepteTeletravail || '',
          dateLimite: a.dateLimite ? a.dateLimite.split('T')[0] : '',
          statut: a.statut || 'Active'
        })

        const charges = data.etudiants.map(e => ({
          _localId: genId(),
          idEtudiantExterne: e.idEtudiantExterne,
          nom: e.nom,
          prenom: e.prenom,
          email: e.email || '',
          cvPdf: e.cvPdf || ''
        }))
        setEtudiants(charges)
        setEtudiantsInitiaux(JSON.parse(JSON.stringify(charges)))
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [idAnnonce, isEditMode])

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const ajouterEtudiant = () => {
    setEtudiants(prev => [...prev, {
      _localId: genId(),
      idEtudiantExterne: null,
      nom: '', prenom: '', email: '', cvPdf: ''
    }])
  }

  const updateEtudiant = (localId, field, value) => {
    setEtudiants(prev => prev.map(e =>
      e._localId === localId ? { ...e, [field]: value } : e
    ))
  }

  const supprimerEtudiant = (localId) => {
    setEtudiants(prev => prev.filter(e => e._localId !== localId))
  }

  const handlePdfUpload = (localId, file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Le fichier doit être un PDF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`Le PDF est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} Mo). Max 5 Mo.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setError('')
      updateEtudiant(localId, 'cvPdf', e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const telechargerCv = (etudiant) => {
    if (!etudiant.cvPdf) return
    const link = document.createElement('a')
    link.href = etudiant.cvPdf
    link.download = `CV_${etudiant.prenom}_${etudiant.nom}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const calculerEtudiantsActions = () => {
    const actions = []
    for (const e of etudiants) {
      if (!e.idEtudiantExterne) {
        if (e.nom?.trim() && e.prenom?.trim()) {
          actions.push({
            action: 'create',
            data: {
              nom: e.nom,
              prenom: e.prenom,
              email: e.email || '',
              cvPdf: e.cvPdf || ''
            }
          })
        }
      } else {
        const initial = etudiantsInitiaux.find(i => i.idEtudiantExterne === e.idEtudiantExterne)
        if (!initial) continue
        const modifie =
          initial.nom !== e.nom ||
          initial.prenom !== e.prenom ||
          initial.email !== e.email ||
          initial.cvPdf !== e.cvPdf
        if (modifie) {
          actions.push({
            action: 'update',
            id: e.idEtudiantExterne,
            data: {
              nom: e.nom,
              prenom: e.prenom,
              email: e.email || '',
              cvPdf: e.cvPdf || ''
            }
          })
        }
      }
    }
    for (const ei of etudiantsInitiaux) {
      const encore = etudiants.find(e => e.idEtudiantExterne === ei.idEtudiantExterne)
      if (!encore) actions.push({ action: 'delete', id: ei.idEtudiantExterne })
    }
    return actions
  }

  const handleSave = async () => {
    if (!formData.titre.trim()) {
      setError("Le titre de l'annonce est requis")
      return
    }
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      let res
      if (isEditMode) {
        const etudiantsActions = calculerEtudiantsActions()
        res = await fetchAuth(`/api/universiteCohortes/${idAnnonce}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, etudiantsActions })
        })
      } else {
        const etudiantsACreer = etudiants
          .filter(e => e.nom?.trim() && e.prenom?.trim())
          .map(({ _localId, idEtudiantExterne, ...rest }) => rest)
        res = await fetchAuth('/api/universiteCohortes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, etudiants: etudiantsACreer })
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Erreur')

      setSuccess(isEditMode ? 'Annonce mise à jour !' : 'Annonce créée !')
      setTimeout(() => router.push('/pages/universiteCohortes'), 1500)
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
        <PageContainer><LoadingState>Chargement...</LoadingState></PageContainer>
      </>
    )
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <BackButton onClick={() => router.push('/pages/universiteCohortes')}>
          <ArrowLeft size={14} strokeWidth={2} />
          Mes annonces
        </BackButton>

        <PageHeader>
          <PageTitle>
            {isEditMode ? (
              <>
                <Pencil size={24} strokeWidth={2} />
                Modifier l'annonce
              </>
            ) : (
              <>
                <Sparkles size={24} strokeWidth={2} />
                Nouvelle annonce de cohorte
              </>
            )}
          </PageTitle>
          <PageSubtitle>
            {isEditMode
              ? 'Mettez à jour les informations et la liste de vos étudiants.'
              : "Créez une annonce pour un groupe d'étudiants en recherche de stage."}
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

        {/* ===== SECTION 1 : Informations ===== */}
        <Section>
          <SectionTitle>
            <ClipboardList size={17} strokeWidth={2} />
            Informations de l'annonce
          </SectionTitle>

          <FieldGroup>
            <Label>Titre de l'annonce *</Label>
            <Input
              value={formData.titre}
              onChange={(e) => updateField('titre', e.target.value)}
              placeholder="Ex: 15 étudiants en Master 2 Informatique cherchent un stage"
              maxLength={255}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Décrivez le contexte, les compétences acquises..."
              rows={4}
            />
          </FieldGroup>

          <Grid2Cols>
            <FieldGroup>
              <Label>Filière concernée</Label>
              <Select
                value={formData.filiereConcernee}
                onChange={(e) => updateField('filiereConcernee', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {LIBELLES_DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Niveau académique</Label>
              <Select
                value={formData.niveauAcademique}
                onChange={(e) => updateField('niveauAcademique', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                <option value="Licence 1">Licence 1</option>
                <option value="Licence 2">Licence 2</option>
                <option value="Licence 3">Licence 3</option>
                <option value="Master 1">Master 1</option>
                <option value="Master 2">Master 2</option>
                <option value="Doctorat">Doctorat</option>
              </Select>
            </FieldGroup>
          </Grid2Cols>

          <FieldGroup>
            <Label>Domaines de recherche</Label>
            <Input
              value={formData.domainesRecherche}
              onChange={(e) => updateField('domainesRecherche', e.target.value)}
              placeholder="Précisions libres : technologies, missions recherchées..."
            />
          </FieldGroup>

          <Grid2Cols>
            <FieldGroup>
              <Label>Début du stage</Label>
              <Input
                type="date"
                value={formData.periodeDebut}
                onChange={(e) => updateField('periodeDebut', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Fin du stage</Label>
              <Input
                type="date"
                value={formData.periodeFin}
                onChange={(e) => updateField('periodeFin', e.target.value)}
              />
            </FieldGroup>
          </Grid2Cols>

          <Grid2Cols>
            <FieldGroup>
              <Label>Durée du stage</Label>
              <Select
                value={formData.dureeStage}
                onChange={(e) => updateField('dureeStage', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                <option value="1 mois">1 mois</option>
                <option value="2 mois">2 mois</option>
                <option value="3 mois">3 mois</option>
                <option value="4 mois">4 mois</option>
                <option value="6 mois">6 mois</option>
                <option value="12 mois">12 mois</option>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Date limite de candidature</Label>
              <Input
                type="date"
                value={formData.dateLimite}
                onChange={(e) => updateField('dateLimite', e.target.value)}
              />
            </FieldGroup>
          </Grid2Cols>

          <Grid2Cols>
            <FieldGroup>
              <Label>Ville préférée</Label>
              <Select
                value={formData.villePreferee}
                onChange={(e) => updateField('villePreferee', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Accepte le télétravail ?</Label>
              <Select
                value={formData.accepteTeletravail}
                onChange={(e) => updateField('accepteTeletravail', e.target.value)}
              >
                <option value="">— Indifférent —</option>
                <option value="Oui">Oui, totalement</option>
                <option value="Partiel">Partiel (hybride)</option>
                <option value="Non">Non, présentiel uniquement</option>
              </Select>
            </FieldGroup>
          </Grid2Cols>

          {isEditMode && (
            <FieldGroup>
              <Label>Statut de l'annonce</Label>
              <Select
                value={formData.statut}
                onChange={(e) => updateField('statut', e.target.value)}
              >
                <option value="Active">Active — visible par les entreprises</option>
                <option value="Cloturee">Clôturée — plus visible</option>
                <option value="Archivée">Archivée</option>
              </Select>
            </FieldGroup>
          )}
        </Section>

        {/* ===== SECTION 2 : Étudiants ===== */}
        <Section>
          <SectionHeader>
            <SectionTitle>
              <Users size={17} strokeWidth={2} />
              Étudiants concernés ({etudiants.length})
            </SectionTitle>
            <AddEtudiantButton onClick={ajouterEtudiant}>
              <Plus size={15} strokeWidth={2.5} />
              Ajouter un étudiant
            </AddEtudiantButton>
          </SectionHeader>

          {etudiants.length === 0 ? (
            <EmptyEtudiants>
              <p>Aucun étudiant ajouté pour l'instant.</p>
              <p>Cliquez sur « <strong>Ajouter un étudiant</strong> » pour saisir leurs informations.</p>
            </EmptyEtudiants>
          ) : (
            <EtudiantsList>
              {etudiants.map((e, idx) => (
                <EtudiantCard key={e._localId}>
                  <EtudiantNumber>#{idx + 1}</EtudiantNumber>
                  <EtudiantFields>
                    <Grid2Cols>
                      <FieldGroup>
                        <Label>Nom *</Label>
                        <Input
                          value={e.nom}
                          onChange={(ev) => updateEtudiant(e._localId, 'nom', ev.target.value)}
                          placeholder="RAKOTO"
                        />
                      </FieldGroup>
                      <FieldGroup>
                        <Label>Prénom *</Label>
                        <Input
                          value={e.prenom}
                          onChange={(ev) => updateEtudiant(e._localId, 'prenom', ev.target.value)}
                          placeholder="Jean"
                        />
                      </FieldGroup>
                    </Grid2Cols>

                    <FieldGroup>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={e.email}
                        onChange={(ev) => updateEtudiant(e._localId, 'email', ev.target.value)}
                        placeholder="jean.rakoto@exemple.com"
                      />
                    </FieldGroup>

                    {/* === Document CV === */}
                    <DocSection>
                      <DocLabel>
                        <FileText size={14} strokeWidth={2} />
                        CV (PDF)
                      </DocLabel>
                      {e.cvPdf ? (
                        <DocActions>
                          <DocBadge>
                            <CheckCircle2 size={12} strokeWidth={2.5} />
                            CV ajouté
                          </DocBadge>
                          <DocButton type="button" onClick={() => telechargerCv(e)}>
                            <Download size={13} strokeWidth={2} />
                            Voir
                          </DocButton>
                          <DocUploadLabel htmlFor={`cv-${e._localId}`}>
                            <RefreshCw size={13} strokeWidth={2} />
                            Remplacer
                          </DocUploadLabel>
                        </DocActions>
                      ) : (
                        <DocUploadLabel htmlFor={`cv-${e._localId}`}>
                          <Upload size={13} strokeWidth={2} />
                          Choisir un fichier PDF
                        </DocUploadLabel>
                      )}
                      <HiddenFileInput
                        id={`cv-${e._localId}`}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(ev) => handlePdfUpload(e._localId, ev.target.files?.[0])}
                      />
                      <InfoNote>
                        <Info size={13} strokeWidth={2} />
                        PDF uniquement, 5 Mo maximum.
                      </InfoNote>
                    </DocSection>
                  </EtudiantFields>

                  <SupprimerEtudiantButton
                    onClick={() => supprimerEtudiant(e._localId)}
                    title="Retirer cet étudiant"
                    aria-label="Supprimer cet étudiant"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </SupprimerEtudiantButton>
                </EtudiantCard>
              ))}
            </EtudiantsList>
          )}
        </Section>

        <ActionBar>
          <CancelButton
            onClick={() => router.push('/pages/universiteCohortes')}
            disabled={isSaving}
          >
            Annuler
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              'Enregistrement...'
            ) : isEditMode ? (
              <>
                <Save size={15} strokeWidth={2} />
                Mettre à jour
              </>
            ) : (
              <>
                <Send size={15} strokeWidth={2} />
                Publier l'annonce
              </>
            )}
          </SaveButton>
        </ActionBar>
      </PageContainer>
    </>
  )
}