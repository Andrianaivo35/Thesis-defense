'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  Megaphone, Pencil, ArrowLeft, FileText, Target, ClipboardList,
  Users, Plus, Trash2, Upload, Save, Info, Sparkles,
  AlertCircle, CheckCircle2, X
} from 'lucide-react'
import {
  PageContainer, BackButton,
  PageHeader, PageTitle, PageSubtitle,
  Section, SectionTitle,
  FormGrid, Field, Label, Input, Select, Textarea, HelperText,
  EtudiantCard, EtudiantCardHeader, EtudiantBadge, DeleteEtudiantButton,
  AddEtudiantButton,
  CvRow, HiddenFileInput, CvUploadLabel, CvFileName, CvRemoveButton,
  ActionBar, CancelButton, SubmitButton,
  AlertMessage, InfoNote, LoadingState
} from '@/components/styleFormulaireAnnonceCohorte'

/* Taille maximum d'un CV, en Mo. Les fichiers sont stockes en base64
   dans la colonne "cvPdf" : au-dela, la requete devient trop lourde. */
const TAILLE_MAX_CV_MO = 3

export default function FormulaireAnnonceCohorte({ idAnnonce }) {
  const router = useRouter()
  const estModification = Boolean(idAnnonce)

  const [isLoading, setIsLoading] = useState(estModification)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    titre: '',
    description: '',
    filiereConcernee: '',
    niveauAcademique: '',
    domainesRecherche: '',
    periodeDebut: '',
    periodeFin: '',
    dureeStage: '',
    villePreferee: '',
    accepteTeletravail: '',
    dateLimite: '',
    statut: 'Active'
  })

  const [etudiants, setEtudiants] = useState([])
  // ids des etudiants existants supprimes : envoyes en action 'delete'
  const [suppressions, setSuppressions] = useState([])

  /* ---------- Chargement (mode modification uniquement) ---------- */
  useEffect(() => {
    if (!estModification) return

    const charger = async () => {
      try {
        const res = await fetchAuth(`/api/universiteCohortes/${idAnnonce}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

        const a = data.annonce
        setForm({
          titre: a.titre || '',
          description: a.description || '',
          filiereConcernee: a.filiereConcernee || '',
          niveauAcademique: a.niveauAcademique || '',
          domainesRecherche: a.domainesRecherche || '',
          periodeDebut: a.periodeDebut?.split('T')[0] || '',
          periodeFin: a.periodeFin?.split('T')[0] || '',
          dureeStage: a.dureeStage || '',
          villePreferee: a.villePreferee || '',
          accepteTeletravail: a.accepteTeletravail || '',
          dateLimite: a.dateLimite?.split('T')[0] || '',
          statut: a.statut || 'Active'
        })

        setEtudiants(
          (data.etudiants || []).map(e => ({
            ...e,
            _isNew: false,
            _modified: false,
            _cvNom: e.cvPdf ? 'CV enregistré' : ''
          }))
        )
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    charger()
  }, [idAnnonce, estModification])

  /* ---------- Champs de l'annonce ---------- */
  const majChamp = (champ, valeur) => {
    setForm(prev => ({ ...prev, [champ]: valeur }))
  }

  /* ---------- Étudiants ---------- */
  const ajouterEtudiant = () => {
    setEtudiants(prev => [...prev, {
      idEtudiantExterne: `new-${Date.now()}`,
      _isNew: true,
      _modified: false,
      nom: '', prenom: '', email: '', cvPdf: null, _cvNom: ''
    }])
  }

  const majEtudiant = (idx, champ, valeur) => {
    setEtudiants(prev => {
      const copie = [...prev]
      copie[idx] = {
        ...copie[idx],
        [champ]: valeur,
        _modified: !copie[idx]._isNew
      }
      return copie
    })
  }

  const supprimerEtudiant = (idx) => {
    const e = etudiants[idx]
    if (!e._isNew) {
      setSuppressions(prev => [...prev, e.idEtudiantExterne])
    }
    setEtudiants(prev => prev.filter((_, i) => i !== idx))
  }

  const chargerCv = (idx, fichier) => {
    if (!fichier) return

    if (fichier.type !== 'application/pdf') {
      setError('Le CV doit être un fichier PDF.')
      return
    }
    if (fichier.size > TAILLE_MAX_CV_MO * 1024 * 1024) {
      setError(
        `Le CV est trop volumineux (${(fichier.size / 1024 / 1024).toFixed(2)} Mo). ` +
        `Maximum ${TAILLE_MAX_CV_MO} Mo.`
      )
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setError('')
      setEtudiants(prev => {
        const copie = [...prev]
        copie[idx] = {
          ...copie[idx],
          cvPdf: ev.target.result,
          _cvNom: fichier.name,
          _modified: !copie[idx]._isNew
        }
        return copie
      })
    }
    reader.onerror = () => setError("Impossible de lire le fichier PDF.")
    reader.readAsDataURL(fichier)
  }

  const retirerCv = (idx) => {
    setEtudiants(prev => {
      const copie = [...prev]
      copie[idx] = {
        ...copie[idx],
        cvPdf: null,
        _cvNom: '',
        _modified: !copie[idx]._isNew
      }
      return copie
    })
  }

  /* ---------- Enregistrement ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.titre.trim()) {
      setError('Le titre de l\'annonce est obligatoire.')
      return
    }
    if (form.periodeDebut && form.periodeFin && form.periodeFin < form.periodeDebut) {
      setError('La fin de période ne peut pas précéder son début.')
      return
    }

    const etudiantsValides = etudiants.filter(
      et => et.nom?.trim() && et.prenom?.trim()
    )

    setIsSaving(true)
    try {
      let res

      if (estModification) {
        /* PATCH : l'API attend un tableau d'actions */
        const etudiantsActions = [
          ...suppressions.map(id => ({ action: 'delete', id })),
          ...etudiantsValides
            .filter(et => et._isNew)
            .map(et => ({
              action: 'create',
              data: {
                nom: et.nom, prenom: et.prenom,
                email: et.email, cvPdf: et.cvPdf
              }
            })),
          ...etudiantsValides
            .filter(et => !et._isNew && et._modified)
            .map(et => ({
              action: 'update',
              id: et.idEtudiantExterne,
              data: {
                nom: et.nom, prenom: et.prenom,
                email: et.email, cvPdf: et.cvPdf
              }
            }))
        ]

        res = await fetchAuth(`/api/universiteCohortes/${idAnnonce}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, etudiantsActions })
        })
      } else {
        /* POST : l'API attend directement la liste des etudiants */
        res = await fetchAuth('/api/universiteCohortes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            etudiants: etudiantsValides.map(et => ({
              nom: et.nom, prenom: et.prenom,
              email: et.email, cvPdf: et.cvPdf
            }))
          })
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Erreur')

      setSuccess(
        estModification
          ? 'Annonce mise à jour avec succès.'
          : 'Annonce créée avec succès.'
      )
      setSuppressions([])

      setTimeout(() => router.push('/pages/universiteCohortes'), 1400)
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
        <PageContainer>
          <LoadingState>Chargement de l&apos;annonce...</LoadingState>
        </PageContainer>
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
            {estModification
              ? <Pencil size={24} strokeWidth={2} />
              : <Megaphone size={24} strokeWidth={2} />}
            {estModification ? 'Modifier l\'annonce' : 'Nouvelle annonce de cohorte'}
          </PageTitle>
          <PageSubtitle>
            {estModification
              ? 'Mettez à jour les informations et la liste des étudiants rattachés.'
              : 'Présentez un groupe d\'étudiants en recherche de stage aux entreprises de la plateforme.'}
          </PageSubtitle>
        </PageHeader>

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

          {/* ========== 1. INFORMATIONS GÉNÉRALES ========== */}
          <Section>
            <SectionTitle>
              <FileText size={15} strokeWidth={2} />
              Informations générales
            </SectionTitle>

            <FormGrid>
              <Field $full>
                <Label>Titre de l&apos;annonce <span>*</span></Label>
                <Input
                  value={form.titre}
                  onChange={(e) => majChamp('titre', e.target.value)}
                  placeholder="Ex : 12 étudiants en Licence 3 Informatique cherchent un stage"
                  required
                  disabled={isSaving}
                />
                <HelperText>
                  Un titre clair et précis attire davantage l&apos;attention des recruteurs.
                </HelperText>
              </Field>

              <Field $full>
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => majChamp('description', e.target.value)}
                  placeholder="Présentez la promotion, les compétences acquises, les projets réalisés..."
                  disabled={isSaving}
                />
              </Field>

              {estModification && (
                <Field>
                  <Label>Statut de l&apos;annonce</Label>
                  <Select
                    value={form.statut}
                    onChange={(e) => majChamp('statut', e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="Active">Active</option>
                    <option value="Cloturee">Clôturée</option>
                    <option value="Archivee">Archivée</option>
                  </Select>
                  <HelperText>
                    Seules les annonces actives sont visibles par les entreprises.
                  </HelperText>
                </Field>
              )}
            </FormGrid>
          </Section>

          {/* ========== 2. PROFIL RECHERCHÉ ========== */}
          <Section>
            <SectionTitle>
              <Target size={15} strokeWidth={2} />
              Profil des étudiants
            </SectionTitle>

            <FormGrid>
              <Field>
                <Label>Filière concernée</Label>
                <Input
                  value={form.filiereConcernee}
                  onChange={(e) => majChamp('filiereConcernee', e.target.value)}
                  placeholder="Ex : Informatique, Gestion, Génie civil"
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <Label>Niveau académique</Label>
                <Input
                  value={form.niveauAcademique}
                  onChange={(e) => majChamp('niveauAcademique', e.target.value)}
                  placeholder="Ex : Licence 3, Master 1"
                  disabled={isSaving}
                />
              </Field>

              <Field $full>
                <Label>Domaines de recherche</Label>
                <Input
                  value={form.domainesRecherche}
                  onChange={(e) => majChamp('domainesRecherche', e.target.value)}
                  placeholder="Ex : Développement web, Data, Réseaux, Marketing digital"
                  disabled={isSaving}
                />
                <HelperText>Séparez les domaines par des virgules.</HelperText>
              </Field>
            </FormGrid>
          </Section>

          {/* ========== 3. CONDITIONS DU STAGE ========== */}
          <Section>
            <SectionTitle>
              <ClipboardList size={15} strokeWidth={2} />
              Conditions du stage
            </SectionTitle>

            <FormGrid>
              <Field>
                <Label>Début de la période</Label>
                <Input
                  type="date"
                  value={form.periodeDebut}
                  onChange={(e) => majChamp('periodeDebut', e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <Label>Fin de la période</Label>
                <Input
                  type="date"
                  value={form.periodeFin}
                  onChange={(e) => majChamp('periodeFin', e.target.value)}
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <Label>Durée du stage</Label>
                <Input
                  value={form.dureeStage}
                  onChange={(e) => majChamp('dureeStage', e.target.value)}
                  placeholder="Ex : 3 mois"
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <Label>Ville préférée</Label>
                <Input
                  value={form.villePreferee}
                  onChange={(e) => majChamp('villePreferee', e.target.value)}
                  placeholder="Ex : Antananarivo"
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <Label>Télétravail</Label>
                <Select
                  value={form.accepteTeletravail}
                  onChange={(e) => majChamp('accepteTeletravail', e.target.value)}
                  disabled={isSaving}
                >
                  <option value="">Indifférent</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                  <option value="Hybride">Hybride</option>
                </Select>
              </Field>

              <Field>
                <Label>Date limite de candidature</Label>
                <Input
                  type="date"
                  value={form.dateLimite}
                  onChange={(e) => majChamp('dateLimite', e.target.value)}
                  disabled={isSaving}
                />
              </Field>
            </FormGrid>
          </Section>

          {/* ========== 4. ÉTUDIANTS ========== */}
          <Section>
            <SectionTitle>
              <Users size={15} strokeWidth={2} />
              Étudiants rattachés ({etudiants.length})
            </SectionTitle>

            <InfoNote>
              <Info size={14} strokeWidth={2} />
              Le nom et le prénom sont obligatoires. Les étudiants incomplets
              ne seront pas enregistrés.
            </InfoNote>

            {etudiants.map((et, idx) => (
              <EtudiantCard key={et.idEtudiantExterne}>
                <EtudiantCardHeader>
                  <EtudiantBadge $isNew={et._isNew}>
                    {et._isNew ? (
                      <>
                        <Sparkles size={12} strokeWidth={2.5} />
                        Nouveau
                      </>
                    ) : (
                      `Étudiant ${idx + 1}`
                    )}
                  </EtudiantBadge>
                  <DeleteEtudiantButton
                    type="button"
                    onClick={() => supprimerEtudiant(idx)}
                    disabled={isSaving}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                    Retirer
                  </DeleteEtudiantButton>
                </EtudiantCardHeader>

                <FormGrid>
                  <Field>
                    <Label>Prénom <span>*</span></Label>
                    <Input
                      value={et.prenom || ''}
                      onChange={(e) => majEtudiant(idx, 'prenom', e.target.value)}
                      disabled={isSaving}
                    />
                  </Field>

                  <Field>
                    <Label>Nom <span>*</span></Label>
                    <Input
                      value={et.nom || ''}
                      onChange={(e) => majEtudiant(idx, 'nom', e.target.value)}
                      disabled={isSaving}
                    />
                  </Field>

                  <Field $full>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={et.email || ''}
                      onChange={(e) => majEtudiant(idx, 'email', e.target.value)}
                      placeholder="etudiant@exemple.com"
                      disabled={isSaving}
                    />
                  </Field>

                  <Field $full>
                    <Label>CV (PDF)</Label>
                    <CvRow>
                      <CvUploadLabel htmlFor={`cv-${et.idEtudiantExterne}`}>
                        <Upload size={14} strokeWidth={2} />
                        {et.cvPdf ? 'Remplacer le CV' : 'Ajouter un CV'}
                      </CvUploadLabel>
                      <HiddenFileInput
                        id={`cv-${et.idEtudiantExterne}`}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => chargerCv(idx, e.target.files?.[0])}
                        disabled={isSaving}
                      />

                      {et.cvPdf && (
                        <CvFileName>
                          <FileText size={12} strokeWidth={2} />
                          {et._cvNom || 'CV enregistré'}
                          <CvRemoveButton
                            type="button"
                            onClick={() => retirerCv(idx)}
                            aria-label="Retirer le CV"
                          >
                            <X size={13} strokeWidth={2.5} />
                          </CvRemoveButton>
                        </CvFileName>
                      )}
                    </CvRow>
                    <HelperText>
                      Format PDF uniquement, {TAILLE_MAX_CV_MO} Mo maximum.
                    </HelperText>
                  </Field>
                </FormGrid>
              </EtudiantCard>
            ))}

            <AddEtudiantButton type="button" onClick={ajouterEtudiant} disabled={isSaving}>
              <Plus size={15} strokeWidth={2.5} />
              Ajouter un étudiant
            </AddEtudiantButton>
          </Section>

          {/* ========== BARRE D'ACTIONS ========== */}
          <ActionBar>
            <CancelButton
              type="button"
              onClick={() => router.push('/pages/universiteCohortes')}
              disabled={isSaving}
            >
              Annuler
            </CancelButton>
            <SubmitButton type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : (
                <>
                  <Save size={15} strokeWidth={2} />
                  {estModification ? 'Enregistrer les modifications' : 'Publier l\'annonce'}
                </>
              )}
            </SubmitButton>
          </ActionBar>
        </form>
      </PageContainer>
    </>
  )
}