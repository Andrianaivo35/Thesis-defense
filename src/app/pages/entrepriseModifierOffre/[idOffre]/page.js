'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import {
  NIVEAUX_ACADEMIQUES, VILLES, DUREES_STAGE, LIBELLES_DOMAINES
} from '@/lib/referentiels'
import AppNavbar from '@/components/appNavbar'
import {
  PageContainer, BackButton,
  PageHeader, PageTitle, PageSubtitle,
  AccordionSection, AccordionHeader, AccordionTitle, AccordionToggle,
  AccordionBody,
  FormGrid, FormColumn,
  Label, Input, Select, Textarea, ContainerLabelInput,
  ItemCard, ItemHeader, ItemBadge, ItemDeleteButton, AddItemButton,
  ActionBar, SaveButton, CancelButton,
  AlertMessage, LoadingState, InfoNote,
  DangerSection, DangerTitle, DangerText, DeleteButton,
  ChoiceRow, ChoiceCheckbox, ChoiceInput, RemoveChoiceButton, AddChoiceButton
} from '@/components/styleEntrepriseModifierOffre'

export default function EntrepriseModifierOffrePage() {
  const params = useParams()
  const router = useRouter()
  const idOffre = params.idOffre

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // === Données ===
  const [formData, setFormData] = useState({
    titre: '', description: '', domaine: '', ville: '', lieu: '',
    typeStage: '', niveauRequis: '', duree: '', accepteTeletravail: '',
    remuneration: '', dateDebut: '', dateFin: '', dateLimites: '',
    statut: 'Active',
    qcmInfo: { titre: '', description: '', duree: '' },
    competences: [],
    questions: []
  })

  // Compétences disponibles (pour le dropdown)
  const [competencesDisponibles, setCompetencesDisponibles] = useState([])

  // Suivi des actions
  const [competencesActions, setCompetencesActions] = useState([])
  const [questionsActions, setQuestionsActions] = useState([])

  // Sections ouvertes
  const [openSections, setOpenSections] = useState({
    general: true,
    dates: false,
    competences: false,
    qcm: false,
    danger: false
  })

  // === Chargement ===
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Charger les données de l'offre
        const res = await fetchAuth(`/api/entrepriseModifierOffre/${idOffre}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de chargement')

        const o = data.offre
        setFormData({
          titre: o.titre || '',
          description: o.description || '',
          domaine: o.domaine || '',
          ville: o.ville || '',
          lieu: o.lieu || '',
          typeStage: o.typeStage || '',
          niveauRequis: o.niveauRequis || '',
          duree: o.duree || '',
          accepteTeletravail: o.accepteTeletravail || '',
          remuneration: o.remuneration || '',
          dateDebut: o.dateDebut?.split('T')[0] || '',
          dateFin: o.dateFin?.split('T')[0] || '',
          dateLimites: o.dateLimites?.split('T')[0] || '',
          statut: o.statut || 'Active',
          qcmInfo: {
            titre: data.qcm?.titre || '',
            description: data.qcm?.description || '',
            duree: data.qcm?.duree || ''
          },
          competences: (data.competences || []).map(c => ({
            ...c,
            _isNew: false,
            _modified: false
          })),
          questions: (data.questions || []).map(q => ({
            ...q,
            _isNew: false,
            _modified: false,
            choix: (q.choix || []).map(c => ({
              ...c,
              enonce: c.enonce || '',
              estCorrect: c.estCorrect === true
            }))
          }))
        })

        // Charger les compétences disponibles (pour ajouter)
        const resComp = await fetchAuth('/api/competenceReference')
        const dataComp = await resComp.json()
        if (resComp.ok) {
          setCompetencesDisponibles(dataComp.competences || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [idOffre])

  // === Helpers ===
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateQcmInfo = (field, value) => {
    setFormData(prev => ({
      ...prev,
      qcmInfo: { ...prev.qcmInfo, [field]: value }
    }))
  }

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // === Compétences ===
  const ajouterCompetence = () => {
    const newId = `new-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      competences: [...prev.competences, {
        idCompetenceOffre: newId,
        _isNew: true,
        idCompetenceReference: '',
        nom: '',
        niveauSouhaitee: 'Débutant',
        estObligatoire: false
      }]
    }))
  }

  const modifierCompetence = (idx, champ, valeur) => {
    setFormData(prev => {
      const updated = [...prev.competences]
      updated[idx] = { ...updated[idx], [champ]: valeur, _modified: !updated[idx]._isNew }
      // Si on change la référence, mettre à jour le nom affiché
      if (champ === 'idCompetenceReference') {
        const ref = competencesDisponibles.find(
          c => String(c.idCompetenceReference) === String(valeur)
        )
        if (ref) updated[idx].nom = ref.nomCompetenceReference
      }
      return { ...prev, competences: updated }
    })
  }

  const supprimerCompetence = (idx) => {
    const item = formData.competences[idx]
    if (!item._isNew) {
      setCompetencesActions(prev => [...prev, { action: 'delete', id: item.idCompetenceOffre }])
    }
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.filter((_, i) => i !== idx)
    }))
  }

  // === Questions QCM ===
  const ajouterQuestion = () => {
    const newId = `new-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        idQuestion: newId,
        _isNew: true,
        enonce: '',
        points: 1,
        choix: [
          { enonce: '', estCorrect: true },
          { enonce: '', estCorrect: false }
        ]
      }]
    }))
  }

  const modifierQuestion = (idx, champ, valeur) => {
    setFormData(prev => {
      const updated = [...prev.questions]
      updated[idx] = { ...updated[idx], [champ]: valeur, _modified: !updated[idx]._isNew }
      return { ...prev, questions: updated }
    })
  }

  const supprimerQuestion = (idx) => {
    const item = formData.questions[idx]
    if (!item._isNew) {
      setQuestionsActions(prev => [...prev, { action: 'delete', id: item.idQuestion }])
    }
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }))
  }

  // === Choix d'une question ===
  const modifierChoix = (qIdx, cIdx, champ, valeur) => {
    setFormData(prev => {
      const questions = [...prev.questions]
      const choix = [...questions[qIdx].choix]
      choix[cIdx] = { ...choix[cIdx], [champ]: valeur }
      // Une seule bonne réponse possible : si on coche un choix, décocher les autres
      if (champ === 'estCorrect' && valeur === true) {
        choix.forEach((c, i) => { if (i !== cIdx) c.estCorrect = false })
      }
      questions[qIdx] = { ...questions[qIdx], choix, _modified: !questions[qIdx]._isNew }
      return { ...prev, questions }
    })
  }

  const ajouterChoix = (qIdx) => {
    setFormData(prev => {
      const questions = [...prev.questions]
      questions[qIdx] = {
        ...questions[qIdx],
        choix: [...questions[qIdx].choix, { enonce: '', estCorrect: false }],
        _modified: !questions[qIdx]._isNew
      }
      return { ...prev, questions }
    })
  }

  const supprimerChoix = (qIdx, cIdx) => {
    setFormData(prev => {
      const questions = [...prev.questions]
      if (questions[qIdx].choix.length <= 2) return prev  // min 2 choix
      questions[qIdx] = {
        ...questions[qIdx],
        choix: questions[qIdx].choix.filter((_, i) => i !== cIdx),
        _modified: !questions[qIdx]._isNew
      }
      return { ...prev, questions }
    })
  }

  // === Soumission ===
  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const allCompetencesActions = [
        ...competencesActions,
        ...formData.competences
          .filter(c => c._isNew && c.idCompetenceReference)
          .map(c => ({
            action: 'create',
            data: {
              idCompetenceReference: c.idCompetenceReference,
              niveauSouhaitee: c.niveauSouhaitee,
              estObligatoire: c.estObligatoire
            }
          })),
        ...formData.competences
          .filter(c => !c._isNew && c._modified)
          .map(c => ({
            action: 'update',
            id: c.idCompetenceOffre,
            data: {
              niveauSouhaitee: c.niveauSouhaitee,
              estObligatoire: c.estObligatoire
            }
          }))
      ]

      const allQuestionsActions = [
        ...questionsActions,
        ...formData.questions
          .filter(q => q._isNew && q.enonce?.trim())
          .map(q => ({
            action: 'create',
            data: { enonce: q.enonce, points: q.points, choix: q.choix }
          })),
        ...formData.questions
          .filter(q => !q._isNew && q._modified && q.enonce?.trim())
          .map(q => ({
            action: 'update',
            id: q.idQuestion,
            data: { enonce: q.enonce, points: q.points, choix: q.choix }
          }))
      ]

      const body = {
        titre: formData.titre,
        description: formData.description,
        domaine: formData.domaine,
        ville: formData.ville,
        lieu: formData.lieu,
        typeStage: formData.typeStage,
        niveauRequis: formData.niveauRequis,
        duree: formData.duree,
        accepteTeletravail: formData.accepteTeletravail,
        remuneration: formData.remuneration,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        dateLimites: formData.dateLimites,
        statut: formData.statut,
        qcmInfo: formData.qcmInfo,
        competencesActions: allCompetencesActions,
        questionsActions: allQuestionsActions
      }

      const res = await fetchAuth(`/api/entrepriseModifierOffre/${idOffre}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Erreur')

      setSuccess('✓ Offre mise à jour avec succès !')
      setCompetencesActions([])
      setQuestionsActions([])

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

  // === Suppression ===
  const handleDelete = async () => {
    const confirmation = confirm(
      "⚠️ Êtes-vous ABSOLUMENT sûr de vouloir supprimer cette offre ?\n\n" +
      "Cette action est IRRÉVERSIBLE et entraînera la suppression de :\n" +
      "• L'offre elle-même\n" +
      "• Le QCM et ses questions\n" +
      "• Toutes les candidatures reçues\n" +
      "• Les réponses des étudiants au QCM\n\n" +
      "Voulez-vous vraiment continuer ?"
    )
    if (!confirmation) return

    setIsDeleting(true)
    setError('')

    try {
      const res = await fetchAuth(`/api/entrepriseModifierOffre/${idOffre}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')

      setSuccess('✓ Offre supprimée. Redirection...')
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('utilisateur') || '{}')
        router.push(`/pages/entrepriseProfil/${user.idEntreprise}`)
      }, 1500)
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <AppNavbar />
        <PageContainer><LoadingState>Chargement de l'offre...</LoadingState></PageContainer>
      </>
    )
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <BackButton onClick={() => router.back()}>← Retour</BackButton>

        <PageHeader>
          <PageTitle>Modifier l'offre</PageTitle>
          <PageSubtitle>
            Cliquez sur une section pour la déplier et modifier ses informations.
          </PageSubtitle>
        </PageHeader>

        {error && <AlertMessage $type="error">❌ {error}</AlertMessage>}
        {success && <AlertMessage $type="success">{success}</AlertMessage>}

        {/* ========== 1. INFORMATIONS GÉNÉRALES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('general')}>
            <AccordionTitle>📋 Informations générales</AccordionTitle>
            <AccordionToggle>{openSections.general ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.general && (
            <AccordionBody>
              <ContainerLabelInput>
                <Label>Titre de l'offre *</Label>
                <Input value={formData.titre} onChange={(e) => updateField('titre', e.target.value)} />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </ContainerLabelInput>

              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Domaine</Label>
                    <Select value={formData.domaine} onChange={(e) => updateField('domaine', e.target.value)}>
                      <option value="">Sélectionner un domaine</option>
                      {LIBELLES_DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Ville</Label>
                    <Select value={formData.ville} onChange={(e) => updateField('ville', e.target.value)}>
                      <option value="">Sélectionner une ville</option>
                      {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Lieu (adresse complète)</Label>
                    <Input value={formData.lieu} onChange={(e) => updateField('lieu', e.target.value)} />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Type de stage</Label>
                    <Input value={formData.typeStage} onChange={(e) => updateField('typeStage', e.target.value)} placeholder="Ex: Stage de fin d'études" />
                  </ContainerLabelInput>
                </FormColumn>

                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Niveau requis</Label>
                    <Select value={formData.niveauRequis} onChange={(e) => updateField('niveauRequis', e.target.value)}>
                      <option value="">Sélectionner un niveau</option>
                      {NIVEAUX_ACADEMIQUES.map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Durée</Label>
                    <Select value={formData.duree} onChange={(e) => updateField('duree', e.target.value)}>
                      <option value="">Sélectionner une durée</option>
                      {DUREES_STAGE.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Télétravail</Label>
                    <Select value={formData.accepteTeletravail} onChange={(e) => updateField('accepteTeletravail', e.target.value)}>
                      <option value="">Sélectionner</option>
                      <option value="Oui">OUI</option>
                      <option value="Non">NON</option>
                      <option value="Hybride">HYBRIDE</option>
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Rémunération</Label>
                    <Input value={formData.remuneration} onChange={(e) => updateField('remuneration', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>

              <ContainerLabelInput>
                <Label>Statut</Label>
                <Select value={formData.statut} onChange={(e) => updateField('statut', e.target.value)}>
                  <option value="Active">Active (visible par les candidats)</option>
                  <option value="Inactive">Inactive (cachée)</option>
                  <option value="Cloturee">Clôturée</option>
                </Select>
              </ContainerLabelInput>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 2. DATES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('dates')}>
            <AccordionTitle>📅 Dates importantes</AccordionTitle>
            <AccordionToggle>{openSections.dates ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.dates && (
            <AccordionBody>
              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Date de début</Label>
                    <Input type="date" value={formData.dateDebut} onChange={(e) => updateField('dateDebut', e.target.value)} />
                  </ContainerLabelInput>
                  <ContainerLabelInput>
                    <Label>Date de fin</Label>
                    <Input type="date" value={formData.dateFin} onChange={(e) => updateField('dateFin', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Date limite de candidature</Label>
                    <Input type="date" value={formData.dateLimites} onChange={(e) => updateField('dateLimites', e.target.value)} />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 3. COMPÉTENCES REQUISES ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('competences')}>
            <AccordionTitle>🛠 Compétences requises ({formData.competences.length})</AccordionTitle>
            <AccordionToggle>{openSections.competences ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.competences && (
            <AccordionBody>
              {formData.competences.length === 0 ? (
                <InfoNote>Aucune compétence pour l'instant. Cliquez sur le bouton ci-dessous pour en ajouter.</InfoNote>
              ) : (
                formData.competences.map((c, idx) => (
                  <ItemCard key={c.idCompetenceOffre}>
                    <ItemHeader>
                      <ItemBadge>{c._isNew ? '✨ Nouvelle' : c.nom || `Compétence ${idx + 1}`}</ItemBadge>
                      <ItemDeleteButton onClick={() => supprimerCompetence(idx)}>
                        ✕ Supprimer
                      </ItemDeleteButton>
                    </ItemHeader>
                    <FormGrid>
                      <FormColumn>
                        {c._isNew ? (
                          <ContainerLabelInput>
                            <Label>Compétence</Label>
                            <Select
                              value={c.idCompetenceReference || ''}
                              onChange={(e) => modifierCompetence(idx, 'idCompetenceReference', e.target.value)}
                            >
                              <option value="">Sélectionner une compétence</option>
                              {competencesDisponibles.map(ref => (
                                <option key={ref.idCompetenceReference} value={ref.idCompetenceReference}>
                                  {ref.categorieCompetenceReference
                                    ? `${ref.categorieCompetenceReference} — ${ref.nomCompetenceReference}`
                                    : ref.nomCompetenceReference}
                                </option>
                              ))}
                            </Select>
                          </ContainerLabelInput>
                        ) : (
                          <ContainerLabelInput>
                            <Label>Compétence</Label>
                            <Input value={c.nom} disabled />
                          </ContainerLabelInput>
                        )}
                        <ContainerLabelInput>
                          <Label>Niveau souhaité</Label>
                          <Select
                            value={c.niveauSouhaitee || 'Débutant'}
                            onChange={(e) => modifierCompetence(idx, 'niveauSouhaitee', e.target.value)}
                          >
                            <option value="Débutant">Débutant</option>
                            <option value="Intermédiaire">Intermédiaire</option>
                            <option value="Avancé">Avancé</option>
                            <option value="Expert">Expert</option>
                          </Select>
                        </ContainerLabelInput>
                      </FormColumn>
                      <FormColumn>
                        <ContainerLabelInput>
                          <Label>Obligatoire ?</Label>
                          <Select
                            value={String(c.estObligatoire)}
                            onChange={(e) => modifierCompetence(idx, 'estObligatoire', e.target.value === 'true')}
                          >
                            <option value="false">Non — souhaité</option>
                            <option value="true">Oui — obligatoire</option>
                          </Select>
                        </ContainerLabelInput>
                      </FormColumn>
                    </FormGrid>
                  </ItemCard>
                ))
              )}
              <AddItemButton onClick={ajouterCompetence}>+ Ajouter une compétence</AddItemButton>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 4. QCM ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('qcm')}>
            <AccordionTitle>📝 Questionnaire de pré-sélection ({formData.questions.length} question{formData.questions.length > 1 ? 's' : ''})</AccordionTitle>
            <AccordionToggle>{openSections.qcm ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.qcm && (
            <AccordionBody>
              <FormGrid>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Titre du QCM</Label>
                    <Input
                      value={formData.qcmInfo.titre}
                      onChange={(e) => updateQcmInfo('titre', e.target.value)}
                      placeholder="Ex: QCM de pré-sélection"
                    />
                  </ContainerLabelInput>
                </FormColumn>
                <FormColumn>
                  <ContainerLabelInput>
                    <Label>Durée (en minutes)</Label>
                    <Input
                      type="number"
                      value={formData.qcmInfo.duree}
                      onChange={(e) => updateQcmInfo('duree', e.target.value)}
                    />
                  </ContainerLabelInput>
                </FormColumn>
              </FormGrid>

              <ContainerLabelInput>
                <Label>Description du QCM</Label>
                <Textarea
                  rows={3}
                  value={formData.qcmInfo.description}
                  onChange={(e) => updateQcmInfo('description', e.target.value)}
                />
              </ContainerLabelInput>

              <h3 style={{ marginTop: '24px', marginBottom: '16px', color: '#0f172a' }}>
                Questions
              </h3>

              {formData.questions.length === 0 ? (
                <InfoNote>Aucune question. Ajoutez-en avec le bouton ci-dessous.</InfoNote>
              ) : (
                formData.questions.map((q, qIdx) => (
                  <ItemCard key={q.idQuestion}>
                    <ItemHeader>
                      <ItemBadge>{q._isNew ? '✨ Nouvelle' : `Question ${qIdx + 1}`}</ItemBadge>
                      <ItemDeleteButton onClick={() => supprimerQuestion(qIdx)}>
                        ✕ Supprimer
                      </ItemDeleteButton>
                    </ItemHeader>

                    <ContainerLabelInput>
                      <Label>Énoncé</Label>
                      <Textarea
                        rows={2}
                        value={q.enonce || ''}
                        onChange={(e) => modifierQuestion(qIdx, 'enonce', e.target.value)}
                      />
                    </ContainerLabelInput>

                    <ContainerLabelInput>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        value={q.points || 1}
                        onChange={(e) => modifierQuestion(qIdx, 'points', parseInt(e.target.value) || 1)}
                        style={{ maxWidth: '120px' }}
                      />
                    </ContainerLabelInput>

                    <Label>Choix de réponse (cochez la bonne réponse) :</Label>
                    {q.choix?.map((c, cIdx) => (
                      <ChoiceRow key={cIdx}>
                        <ChoiceCheckbox
                          type="radio"
                          name={`bonne-reponse-${q.idQuestion}`}
                          checked={c.estCorrect === true}
                          onChange={() => modifierChoix(qIdx, cIdx, 'estCorrect', true)}
                        />
                        <ChoiceInput
                          value={c.enonce || ''}
                          onChange={(e) => modifierChoix(qIdx, cIdx, 'enonce', e.target.value)}
                          placeholder={`Choix ${cIdx + 1}`}
                        />
                        {q.choix.length > 2 && (
                          <RemoveChoiceButton onClick={() => supprimerChoix(qIdx, cIdx)}>
                            ✕
                          </RemoveChoiceButton>
                        )}
                      </ChoiceRow>
                    ))}

                    <AddChoiceButton onClick={() => ajouterChoix(qIdx)}>
                      + Ajouter un choix
                    </AddChoiceButton>
                  </ItemCard>
                ))
              )}

              <AddItemButton onClick={ajouterQuestion}>+ Ajouter une question</AddItemButton>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== 5. ZONE DE DANGER ========== */}
        <AccordionSection>
          <AccordionHeader onClick={() => toggleSection('danger')}>
            <AccordionTitle>⚠️ Zone de danger</AccordionTitle>
            <AccordionToggle>{openSections.danger ? '−' : '+'}</AccordionToggle>
          </AccordionHeader>
          {openSections.danger && (
            <AccordionBody>
              <DangerSection>
                <DangerTitle>Supprimer définitivement cette offre</DangerTitle>
                <DangerText>
                  Cette action supprimera l'offre, son QCM, ses questions, ses compétences,
                  ainsi que <strong>toutes les candidatures déjà reçues</strong>. Cette opération est irréversible.
                </DangerText>
                <DeleteButton onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Suppression...' : '🗑️ Supprimer définitivement cette offre'}
                </DeleteButton>
              </DangerSection>
            </AccordionBody>
          )}
        </AccordionSection>

        {/* ========== BARRE D'ACTIONS ========== */}
        <ActionBar>
          <CancelButton onClick={() => router.back()} disabled={isSaving}>
            Annuler
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
          </SaveButton>
        </ActionBar>
      </PageContainer>
    </>
  )
}