'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import { VILLES, DUREES_STAGE, LIBELLES_DOMAINES } from '@/lib/referentiels'
import {
  PageContainer, ContainerForm, ContainerTexte, FormGrid, ColumnForm,
  SectionTitle, Label, Input, Select, ContainerLabelInput,
  ContainerButtons, Button,
  Alert, ItemCard, ItemHeader, ItemLabel, ChoixRow
} from '@/components/styleEntrepriseRegistreOffre'

export default function EntrepriseCreerOffre() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // === Offre ===
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [domaine, setDomaine] = useState('')
  const [niveauRequis, setNiveauRequis] = useState('')
  const [duree, setDuree] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [dateLimites, setDateLimites] = useState('')
  const [remuneration, setRemuneration] = useState('')
  const [lieu, setLieu] = useState('')
  const [ville, setVille] = useState('')
  const [accepteTeletravail, setAccepteTeletravail] = useState('')
  const [typeStage, setTypeStage] = useState('')

  // === Compétences requises ===
  // On ne stocke que l'identifiant du référentiel : plus aucune compétence
  // n'est créée à la volée à partir d'une saisie libre.
  const [competences, setCompetences] = useState([
    { idCompetenceReference: '', niveauSouhaitee: 'Débutant', estObligatoire: false }
  ])
  const [referentiel, setReferentiel] = useState([])
  const [erreurReferentiel, setErreurReferentiel] = useState('')

  // Chargement du référentiel de compétences
  useEffect(() => {
    const chargerReferentiel = async () => {
      try {
        const res = await fetch('/api/competenceReference')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Chargement impossible')
        setReferentiel(data.competences || [])
      } catch (err) {
        console.error('Erreur chargement référentiel:', err)
        setErreurReferentiel(
          "Le référentiel de compétences n'a pas pu être chargé. Rechargez la page."
        )
      }
    }
    chargerReferentiel()
  }, [])

  // Compétences encore sélectionnables (on masque celles déjà choisies)
  const competencesDisponibles = (indexCourant) => {
    const dejaChoisies = competences
      .filter((_, i) => i !== indexCourant)
      .map(c => String(c.idCompetenceReference))
      .filter(Boolean)
    return referentiel.filter(
      r => !dejaChoisies.includes(String(r.idCompetenceReference))
    )
  }

  // === QCM ===
  const [qcmTitre, setQcmTitre] = useState('')
  const [qcmDescription, setQcmDescription] = useState('')
  const [qcmDuree, setQcmDuree] = useState('')
  const [qcmNoteMinimal, setQcmNoteMinimal] = useState(0)

  const [questions, setQuestions] = useState([
    {
      enonce: '',
      points: 1,
      explication: '',
      choix: [
        { enonce: '', estCorrect: true },
        { enonce: '', estCorrect: false }
      ]
    }
  ])

  // === Helpers COMPÉTENCES ===
  const ajouterCompetence = () => {
    setCompetences([...competences, { idCompetenceReference: '', niveauSouhaitee: 'Débutant', estObligatoire: false }])
  }
  const supprimerCompetence = (idx) => {
    if (competences.length > 1) setCompetences(competences.filter((_, i) => i !== idx))
  }
  const modifierCompetence = (idx, champ, valeur) => {
    const nouvelles = [...competences]
    nouvelles[idx][champ] = valeur
    setCompetences(nouvelles)
  }

  // === Helpers QUESTIONS ===
  const ajouterQuestion = () => {
    setQuestions([...questions, {
      enonce: '', points: 1, explication: '',
      choix: [{ enonce: '', estCorrect: true }, { enonce: '', estCorrect: false }]
    }])
  }
  const supprimerQuestion = (qIdx) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== qIdx))
  }
  const modifierQuestion = (qIdx, champ, valeur) => {
    const nouvelles = [...questions]
    nouvelles[qIdx][champ] = valeur
    setQuestions(nouvelles)
  }

  // === Helpers CHOIX ===
  const ajouterChoix = (qIdx) => {
    const nouvelles = [...questions]
    nouvelles[qIdx].choix.push({ enonce: '', estCorrect: false })
    setQuestions(nouvelles)
  }
  const supprimerChoix = (qIdx, cIdx) => {
    const nouvelles = [...questions]
    if (nouvelles[qIdx].choix.length > 2) {
      if (nouvelles[qIdx].choix[cIdx].estCorrect) {
        const restants = nouvelles[qIdx].choix.filter((_, i) => i !== cIdx)
        restants[0].estCorrect = true
        nouvelles[qIdx].choix = restants
      } else {
        nouvelles[qIdx].choix = nouvelles[qIdx].choix.filter((_, i) => i !== cIdx)
      }
      setQuestions(nouvelles)
    }
  }
  const modifierChoixEnonce = (qIdx, cIdx, valeur) => {
    const nouvelles = [...questions]
    nouvelles[qIdx].choix[cIdx].enonce = valeur
    setQuestions(nouvelles)
  }
  const marquerCommeCorrect = (qIdx, cIdx) => {
    const nouvelles = [...questions]
    nouvelles[qIdx].choix = nouvelles[qIdx].choix.map((c, i) => ({ ...c, estCorrect: i === cIdx }))
    setQuestions(nouvelles)
  }

  // === Soumission ===
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const competencesValides = competences.filter(c => c.idCompetenceReference)

      const res = await fetchAuth('/api/entrepriseRegistreOffre', {
        method: 'POST',
        body: JSON.stringify({
          titre, description, domaine, niveauRequis, duree,
          dateDebut, dateFin, dateLimites, remuneration,
          lieu, ville, accepteTeletravail, typeStage,
          competences: competencesValides,
          qcm: {
            titre: qcmTitre,
            description: qcmDescription,
            duree: qcmDuree ? parseInt(qcmDuree, 10) : null,
            noteMinimal: parseInt(qcmNoteMinimal, 10) || 0,
            questions
          }
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || `Erreur ${res.status}`)

      setSuccess('Offre publiée avec succès !')
      setTimeout(() => router.push('/pages/entrepriseDashboard'), 2000)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <ContainerForm>
        <ContainerTexte><h2>Publier une offre de stage</h2></ContainerTexte>

        {error && <Alert $type="error">{error}</Alert>}
        {success && <Alert $type="success">{success}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* === SECTION 1 : DÉTAILS DE L'OFFRE === */}
          <SectionTitle><h2>1. Détails de l'offre</h2></SectionTitle>
          <FormGrid>
            <ColumnForm>
              <ContainerLabelInput>
                <Label>Titre *</Label>
                <Input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Stage Développeur Full-Stack" required />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Description *</Label>
                <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description détaillée" required />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Domaine</Label>
                <Select value={domaine} onChange={(e) => setDomaine(e.target.value)}>
                  <option value="">Sélectionner un domaine</option>
                  {LIBELLES_DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Niveau requis</Label>
                <Select value={niveauRequis} onChange={(e) => setNiveauRequis(e.target.value)}>
                  <option value="">Sélectionner</option>
                  <option value="Licence 1">Licence 1</option>
                  <option value="Licence 2">Licence 2</option>
                  <option value="Licence 3">Licence 3</option>
                  <option value="Master 1">Master 1</option>
                  <option value="Master 2">Master 2</option>
                </Select>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Type de stage</Label>
                <Select value={typeStage} onChange={(e) => setTypeStage(e.target.value)}>
                  <option value="">Sélectionner</option>
                  <option value="Stage de fin d'études">Stage de fin d'études</option>
                  <option value="Stage ouvrier">Stage ouvrier</option>
                  <option value="Alternance">Alternance</option>
                  <option value="Stage d'observation">Stage d'observation</option>
                </Select>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Durée</Label>
                <Select value={duree} onChange={(e) => setDuree(e.target.value)}>
                  <option value="">Sélectionner une durée</option>
                  {DUREES_STAGE.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Rémunération</Label>
                <Input type="text" value={remuneration} onChange={(e) => setRemuneration(e.target.value)} placeholder="Ex: 300 000 Ar / mois" />
              </ContainerLabelInput>
            </ColumnForm>

            <ColumnForm>
              <ContainerLabelInput>
                <Label>Date de début</Label>
                <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Date de fin</Label>
                <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Date limite candidature</Label>
                <Input type="date" value={dateLimites} onChange={(e) => setDateLimites(e.target.value)} />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Lieu (adresse)</Label>
                <Input type="text" value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Ex: 12 Rue de l'Indépendance" />
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Ville</Label>
                <Select value={ville} onChange={(e) => setVille(e.target.value)}>
                  <option value="">Sélectionner une ville</option>
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
              </ContainerLabelInput>

              <ContainerLabelInput>
                <Label>Accepte télétravail</Label>
                <Select value={accepteTeletravail} onChange={(e) => setAccepteTeletravail(e.target.value)}>
                  <option value="">Sélectionner</option>
                  <option value="Oui">OUI</option>
                  <option value="Non">NON</option>
                  <option value="Hybride">HYBRIDE</option>
                </Select>
              </ContainerLabelInput>
            </ColumnForm>
          </FormGrid>

          {/* === SECTION 2 : COMPÉTENCES REQUISES === */}
          <SectionTitle><h2>2. Compétences requises</h2></SectionTitle>
          {erreurReferentiel && <Alert $type="error">{erreurReferentiel}</Alert>}
          {competences.map((comp, idx) => (
            <ItemCard key={idx} $tone="sauge">
              <ItemHeader $tone="sauge">
                <ItemLabel $tone="sauge">Compétence {idx + 1}</ItemLabel>
                {competences.length > 1 && (
                  <Button type="button" onClick={() => supprimerCompetence(idx)} $variant="secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>✕ Supprimer</Button>
                )}
              </ItemHeader>

              <FormGrid>
                <ColumnForm>
                  <ContainerLabelInput>
                    <Label>Compétence</Label>
                    <Select
                      value={comp.idCompetenceReference}
                      onChange={(e) => modifierCompetence(idx, 'idCompetenceReference', e.target.value)}
                    >
                      <option value="">
                        {referentiel.length === 0
                          ? 'Chargement du référentiel...'
                          : 'Sélectionner une compétence'}
                      </option>
                      {competencesDisponibles(idx).map(r => (
                        <option key={r.idCompetenceReference} value={r.idCompetenceReference}>
                          {r.categorieCompetenceReference
                            ? `${r.categorieCompetenceReference} — ${r.nomCompetenceReference}`
                            : r.nomCompetenceReference}
                        </option>
                      ))}
                    </Select>
                  </ContainerLabelInput>
                </ColumnForm>
                <ColumnForm>
                  <ContainerLabelInput>
                    <Label>Niveau souhaité</Label>
                    <Select value={comp.niveauSouhaitee} onChange={(e) => modifierCompetence(idx, 'niveauSouhaitee', e.target.value)}>
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Expert">Expert</option>
                    </Select>
                  </ContainerLabelInput>
                  <ContainerLabelInput>
                    <Label>
                      <input
                        type="checkbox"
                        checked={comp.estObligatoire}
                        onChange={(e) => modifierCompetence(idx, 'estObligatoire', e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      Compétence obligatoire
                    </Label>
                  </ContainerLabelInput>
                </ColumnForm>
              </FormGrid>
            </ItemCard>
          ))}
          <Button type="button" onClick={ajouterCompetence} style={{ width: '100%', marginBottom: '30px' }}>+ Ajouter une compétence</Button>

          {/* === SECTION 3 : QCM === */}
          <SectionTitle><h2>3. Questionnaire de pré-sélection (QCM)</h2></SectionTitle>
          <FormGrid>
            <ColumnForm>
              <ContainerLabelInput>
                <Label>Titre du QCM</Label>
                <Input type="text" value={qcmTitre} onChange={(e) => setQcmTitre(e.target.value)} placeholder="Ex: Test technique React" />
              </ContainerLabelInput>
              <ContainerLabelInput>
                <Label>Description / Instructions</Label>
                <Input type="text" value={qcmDescription} onChange={(e) => setQcmDescription(e.target.value)} placeholder="Ex: Vous avez 10 min pour répondre" />
              </ContainerLabelInput>
            </ColumnForm>
            <ColumnForm>
              <ContainerLabelInput>
                <Label>Durée (en minutes)</Label>
                <Input type="number" min="1" value={qcmDuree} onChange={(e) => setQcmDuree(e.target.value)} placeholder="Ex: 15" />
              </ContainerLabelInput>
              <ContainerLabelInput>
                <Label>Note minimale (sur 100, informatif)</Label>
                <Input type="number" min="0" max="100" value={qcmNoteMinimal} onChange={(e) => setQcmNoteMinimal(e.target.value)} placeholder="Ex: 60" />
              </ContainerLabelInput>
            </ColumnForm>
          </FormGrid>

          {questions.map((q, qIdx) => (
            <ItemCard key={qIdx} $tone="argile">
              <ItemHeader $tone="argile">
                <ItemLabel $tone="argile">Question {qIdx + 1}</ItemLabel>
                {questions.length > 1 && (
                  <Button type="button" onClick={() => supprimerQuestion(qIdx)} $variant="secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>✕ Supprimer</Button>
                )}
              </ItemHeader>

              <ContainerLabelInput>
                <Label>Énoncé</Label>
                <Input type="text" value={q.enonce} onChange={(e) => modifierQuestion(qIdx, 'enonce', e.target.value)} placeholder="Ex: Quel hook React utilise-t-on pour gérer l'état ?" />
              </ContainerLabelInput>

              <FormGrid>
                <ColumnForm>
                  <ContainerLabelInput>
                    <Label>Points</Label>
                    <Input type="number" min="1" value={q.points} onChange={(e) => modifierQuestion(qIdx, 'points', parseInt(e.target.value) || 1)} />
                  </ContainerLabelInput>
                </ColumnForm>
                <ColumnForm>
                  <ContainerLabelInput>
                    <Label>Explication (optionnel)</Label>
                    <Input type="text" value={q.explication} onChange={(e) => modifierQuestion(qIdx, 'explication', e.target.value)} placeholder="Affichée après la réponse" />
                  </ContainerLabelInput>
                </ColumnForm>
              </FormGrid>

              <Label style={{ marginTop: '15px', marginBottom: '10px' }}>Choix de réponse (cochez la bonne)</Label>
              {q.choix.map((c, cIdx) => (
                <ChoixRow key={cIdx}>
                  <input type="radio" name={`correct-${qIdx}`} checked={c.estCorrect} onChange={() => marquerCommeCorrect(qIdx, cIdx)} />
                  <Input type="text" value={c.enonce} onChange={(e) => modifierChoixEnonce(qIdx, cIdx, e.target.value)} placeholder={`Choix ${cIdx + 1}`} style={{ flex: 1 }} />
                  {q.choix.length > 2 && (
                    <Button type="button" onClick={() => supprimerChoix(qIdx, cIdx)} $variant="secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>✕</Button>
                  )}
                </ChoixRow>
              ))}
              <Button type="button" onClick={() => ajouterChoix(qIdx)} style={{ marginTop: '10px', fontSize: '13px' }}>+ Ajouter un choix</Button>
            </ItemCard>
          ))}

          <Button type="button" onClick={ajouterQuestion} style={{ width: '100%', marginBottom: '30px' }}>+ Ajouter une question</Button>

          <ContainerButtons>
            <Button type="submit" disabled={loading}>
              {loading ? 'Publication...' : 'Publier l\'offre'}
            </Button>
          </ContainerButtons>
        </form>
      </ContainerForm>
    </PageContainer>
  )
}