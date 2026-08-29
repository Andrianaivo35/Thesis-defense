'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import { VILLES, LIBELLES_DOMAINES } from '@/lib/referentiels'
import AppNavbar from '@/components/appNavbar'
import {
  ArrowLeft, Pencil, Sparkles, ClipboardList, Users, Plus,
  FileText, CheckCircle2, Download, RefreshCw, Upload, Info,
  AlertCircle, Save, Send
} from 'lucide-react'
import {
  PageContainer, BackButton, PageHeader, PageTitle, PageSubtitle,
  Section, SectionHeader, SectionTitle,
  FieldGroup, Label, Input, Textarea, Select, Grid2Cols,
  DocSection, DocLabel, DocBadge, DocButton, DocUploadLabel, DocActions, HiddenFileInput,
  ActionBar, CancelButton, SaveButton, Hint,
  AlertMessage, AlertIcon, LoadingState, InfoNote
} from '@/components/styleFormulaireAnnonceCohorte'

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
    villePreferee: '', accepteTeletravail: '', dateLimite: '', statut: 'Active',
    idPromotion: null
  })

  const [promotions, setPromotions] = useState([])

  /* Chargées dans les deux modes : sans elles, le sélecteur est vide et
     l'annonce ne peut désigner personne. */
  useEffect(() => {
    fetchAuth('/api/universitePromotions')
      .then(r => r.json())
      .then(d => setPromotions(d.promotions || []))
      .catch(() => {})
  }, [])

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
          statut: a.statut || 'Active',
          idPromotion: a.idPromotion || null
        })

      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [idAnnonce, isEditMode])

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!formData.titre.trim()) {
      setError("Le titre de l'annonce est requis")
      return
    }
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = isEditMode
        ? await fetchAuth(`/api/universiteCohortes/${idAnnonce}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })
        : await fetchAuth('/api/universiteCohortes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })
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

        {/* ===== SECTION 2 : La promotion concernée =====

            On ne saisit plus de noms. L'annonce DÉSIGNE une promotion
            déjà importée, dont les membres sont de vrais comptes avec
            profil, compétences et CV.

            La saisie manuelle produisait des étudiants fantômes : une
            entreprise intéressée n'avait aucun moyen d'agir, pas même
            d'envoyer un message. */}
        <Section>
          <SectionHeader>
            <SectionTitle>
              <Users size={17} strokeWidth={2} />
              Promotion concernée
            </SectionTitle>
          </SectionHeader>

          <FieldGroup>
            <Label>Quelle promotion cherche un stage ?</Label>
            <Select
              value={formData.idPromotion || ''}
              onChange={(e) => updateField('idPromotion',
                e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Aucune promotion précisée</option>
              {promotions.map(p => (
                <option key={p.idPromotion} value={p.idPromotion}>
                  {p.libelle} — {p.annee} ({p.effectif} étudiant{p.effectif > 1 ? 's' : ''})
                </option>
              ))}
            </Select>
            <Hint>
              {promotions.length === 0
                ? "Vous n'avez pas encore de promotion. Importez-en une depuis « Importer une promotion » : les entreprises verront alors de vrais profils."
                : "Les entreprises verront les profils réels de cette promotion — compétences, CV, parcours — et pourront contacter les étudiants directement."}
            </Hint>
          </FieldGroup>
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