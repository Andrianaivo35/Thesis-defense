'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  CheckCircle2, AlertCircle, ClipboardList, HelpCircle, Clock,
  Paperclip, FileText, FileEdit, PartyPopper, Send, ArrowLeft, TriangleAlert,
  Files, X
} from 'lucide-react'
import {
  PageContainer, HeaderCard, CompanyLogo, HeaderInfo, CompanyName, OfferTitle,
  QcmInfoCard, QcmTitle, QcmDescription, QcmMeta, QcmMetaItem,
  QuestionCard, QuestionHeader, QuestionNumber, QuestionPoints, QuestionText,
  ChoicesList, ChoiceLabel, ChoiceRadio, ChoiceText,
  FooterCard, ProgressInfo, ButtonsRow, CancelButton, SubmitButton,
  LoadingState, ErrorCard, ErrorCardIcon,
  FileUploadSection, FileUploadTitle, FileUploadGrid, FileUploadCard,
  FileUploadIcon, FileUploadText, FileUploadHelper, FileInputHidden,
  FileSelectedName, RemoveFileButton, SuccessCard, SuccessIcon, ErrorBanner, ErrorBannerIcon,
  AvertissementCard, AvertissementTitre, AvertissementListe, CommencerButton,
  TimerBadge
} from '@/components/styleQCM'

function formaterTempsRestant(secondes) {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const MAX_AUTRES_DOCUMENTS = 5

export default function QcmPage() {
  const params = useParams()
  const router = useRouter()
  const idOffre = params.idOffre

  const [data, setData] = useState(null)
  const [responses, setResponses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  const [cv, setCv] = useState(null)
  const [lettreMotivation, setLettreMotivation] = useState(null)
  const [autresDocuments, setAutresDocuments] = useState([])
  const [documentsEchoues, setDocumentsEchoues] = useState(0)

  /* Bibliotheque de CV : l'etudiant choisit un CV deja enregistre plutot
     que de le redeposer a chaque candidature. Le televersement reste
     possible et alimente alors la bibliotheque. */
  const [cvsDisponibles, setCvsDisponibles] = useState([])
  const [idCVChoisi, setIdCVChoisi] = useState('')
  const [nouveauCv, setNouveauCv] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /* La candidature et le QCM sont indissociables : une fois envoye, la
     contrainte UNIQUE (idEtudiant, idOffre) interdit toute reprise. Un
     onglet ferme en cours de route coute donc definitivement l'offre.
     L'etudiant doit en etre averti avant de commencer. */
  const [aCommence, setACommence] = useState(false)
  const [success, setSuccess] = useState(null)
  const [tempsRestant, setTempsRestant] = useState(null)

  useEffect(() => {
    const chargerCvs = async () => {
      try {
        const res = await fetchAuth('/api/cv')
        const d = await res.json()
        if (res.ok) {
          const liste = d.cvs || []
          setCvsDisponibles(liste)
          const principal = liste.find(c => c.estPrincipal) || liste[0]
          if (principal) setIdCVChoisi(String(principal.idCV))
          else setNouveauCv(true)
        }
      } catch {
        setNouveauCv(true)
      }
    }
    chargerCvs()
  }, [])

  useEffect(() => {
    const fetchQcm = async () => {
      try {
        const res = await fetchAuth(`/api/qcm/${idOffre}`)
        const result = await res.json()

        if (!res.ok) {
          if (result.alreadyApplied) {
            setAlreadyApplied(true)
          } else {
            throw new Error(result.error || `Erreur ${res.status}`)
          }
          return
        }

        setData(result)
      } catch (err) {
        console.error('Erreur:', err)
        setError(err.message || 'Erreur lors du chargement du QCM')
      } finally {
        setIsLoading(false)
      }
    }
    fetchQcm()
  }, [idOffre])

  /* Chronomètre : purement informatif, la durée du QCM n'est pas imposée
     côté serveur. Démarre quand l'étudiant clique "Commencer" et s'arrête
     à 0 ou dès l'envoi de la candidature. */
  useEffect(() => {
    if (!aCommence || success || !data?.qcm?.duree) return
    setTempsRestant(data.qcm.duree * 60)
  }, [aCommence, success, data])

  useEffect(() => {
    if (tempsRestant === null || tempsRestant <= 0 || success) return
    const intervalId = setInterval(() => {
      setTempsRestant(prev => (prev !== null ? Math.max(0, prev - 1) : prev))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [tempsRestant, success])

  const handleSelectChoice = (idQuestion, idChoix) => {
    setResponses(prev => ({ ...prev, [idQuestion]: idChoix }))
  }

  const handleFileChange = (setter, file) => {
    setError('')
    if (!file) {
      setter(null)
      return
    }
    if (file.type !== 'application/pdf') {
      setError('Le fichier doit être au format PDF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 Mo')
      return
    }
    setter(file)
  }

  /* Documents facultatifs, en plus du CV et de la lettre : portfolio,
     certificat, recommandation... Envoyés séparément après la création de
     la candidature (voir handleSubmit), donc validés ici avec les mêmes
     règles que les autres pièces (PDF, 5 Mo max).

     Sélection ADDITIVE : rouvrir le sélecteur ajoute aux fichiers déjà
     choisis au lieu de les remplacer — sinon oublier un fichier lors d'une
     sélection multiple obligeait à tout reprendre depuis le début. */
  const handleAutresDocumentsChange = (fileList) => {
    setError('')
    const nouveaux = Array.from(fileList || [])
    if (nouveaux.length === 0) return

    for (const f of nouveaux) {
      if (f.type !== 'application/pdf') {
        setError('Chaque document doit être au format PDF')
        return
      }
      if (f.size > 5 * 1024 * 1024) {
        setError('Chaque document ne doit pas dépasser 5 Mo')
        return
      }
    }

    // Évite un doublon évident si le même fichier est resélectionné.
    const dejaPresents = new Set(autresDocuments.map(f => `${f.name}-${f.size}`))
    const ajouts = nouveaux.filter(f => !dejaPresents.has(`${f.name}-${f.size}`))

    if (autresDocuments.length + ajouts.length > MAX_AUTRES_DOCUMENTS) {
      setError(`Vous ne pouvez joindre que ${MAX_AUTRES_DOCUMENTS} documents supplémentaires au maximum`)
      return
    }
    setAutresDocuments(prev => [...prev, ...ajouts])
  }

  const handleRetirerAutreDocument = (index) => {
    setAutresDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!toutesRepondues || !cvFourni || !lettreMotivation) return

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('idOffre', idOffre)
      if (nouveauCv && cv) formData.append('cv', cv)
      else formData.append('idCV', idCVChoisi)
      formData.append('lettreMotivation', lettreMotivation)
      formData.append('reponses', JSON.stringify(responses))

      const res = await fetchAuth('/api/candidature', {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`)

      // La candidature est envoyée : les documents facultatifs ne doivent
      // plus jamais faire échouer l'ensemble, un simple avertissement suffit.
      let echecs = 0
      for (const document of autresDocuments) {
        try {
          const docFormData = new FormData()
          docFormData.append('document', document)
          const docRes = await fetchAuth(`/api/candidature/${result.idCandidature}/documents`, {
            method: 'POST',
            body: docFormData
          })
          if (!docRes.ok) echecs++
        } catch {
          echecs++
        }
      }
      setDocumentsEchoues(echecs)

      setSuccess(result)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || "Erreur lors de l'envoi de la candidature")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir abandonner ? Vos réponses seront perdues.')) {
      router.push('/pages/listeOffre')
    }
  }

  // === État : chargement ===
  if (isLoading) {
    return (
      <>
        <AppNavbar />
        <PageContainer>
          <LoadingState>Chargement du questionnaire...</LoadingState>
        </PageContainer>
      </>
    )
  }

  // === État : déjà postulé ===
  if (alreadyApplied) {
    return (
      <>
        <AppNavbar />
        <PageContainer>
          <ErrorCard>
            <ErrorCardIcon $type="success">
              <CheckCircle2 size={40} strokeWidth={2} />
            </ErrorCardIcon>
            <h2>Candidature déjà envoyée</h2>
            <p>Vous avez déjà postulé à cette offre. Vous ne pouvez pas repasser le QCM.</p>
            <CancelButton onClick={() => router.push('/pages/listeOffre')}>
              <ArrowLeft size={14} strokeWidth={2} />
              Retour à la liste
            </CancelButton>
          </ErrorCard>
        </PageContainer>
      </>
    )
  }

  // === État : erreur ===
  if (!data && error) {
    return (
      <>
        <AppNavbar />
        <PageContainer>
          <ErrorCard>
            <ErrorCardIcon $type="error">
              <AlertCircle size={40} strokeWidth={2} />
            </ErrorCardIcon>
            <h2>Erreur</h2>
            <p>{error}</p>
            <CancelButton onClick={() => router.push('/pages/listeOffre')}>
              <ArrowLeft size={14} strokeWidth={2} />
              Retour à la liste
            </CancelButton>
          </ErrorCard>
        </PageContainer>
      </>
    )
  }

  if (!data) return null

  const { offre, qcm, questions } = data
  const totalRepondues = Object.keys(responses).length
  const totalQuestions = questions.length
  const toutesRepondues = totalRepondues === totalQuestions
  /* Un CV « fourni » vient soit de la bibliothèque (idCVChoisi), soit d'un
     nouveau televersement (cv) : le bouton d'envoi ne doit dépendre que de
     ce résultat, jamais de cv seul — sinon choisir un CV existant ne
     débloque jamais l'envoi. */
  const cvFourni = nouveauCv ? !!cv : !!idCVChoisi

  return (
    <>
      <AppNavbar />
      <PageContainer>
        {/* === Header offre === */}
        <HeaderCard>
          <CompanyLogo>
            {offre.logoEntreprise ? (
              <img src={offre.logoEntreprise} alt={offre.nomEntreprise} />
            ) : (
              offre.nomEntreprise?.charAt(0).toUpperCase()
            )}
          </CompanyLogo>
          <HeaderInfo>
            <CompanyName>{offre.nomEntreprise}</CompanyName>
            <OfferTitle>{offre.titre}</OfferTitle>
          </HeaderInfo>
        </HeaderCard>

        {/* === Info QCM === */}
        <QcmInfoCard>
          <QcmTitle>
            <ClipboardList size={18} strokeWidth={2} />
            {qcm.titre || 'Questionnaire de pré-sélection'}
          </QcmTitle>
          {qcm.description && <QcmDescription>{qcm.description}</QcmDescription>}
          <QcmMeta>
            <QcmMetaItem>
              <HelpCircle size={14} strokeWidth={2} />
              {totalQuestions} questions
            </QcmMetaItem>
            {qcm.duree && (
              <QcmMetaItem>
                <Clock size={14} strokeWidth={2} />
                Durée : {qcm.duree} min
              </QcmMetaItem>
            )}
          </QcmMeta>
        </QcmInfoCard>

        {/* === Avertissement : tentative unique ===
            La candidature ne peut pas etre reprise une fois envoyee, et
            rien ne le signalait a l'etudiant avant qu'il ne commence. */}
        {!aCommence && !success && (
          <AvertissementCard>
            <AvertissementTitre>
              <TriangleAlert size={19} strokeWidth={2} />
              À lire avant de commencer
            </AvertissementTitre>
            <AvertissementListe>
              <li>
                Vous ne disposez que d&apos;<strong>une seule tentative</strong> :
                une fois le questionnaire envoyé, il ne pourra plus être repassé
                pour cette offre.
              </li>
              <li>
                Vos réponses <strong>ne sont pas enregistrées au fur et à mesure</strong> :
                ne fermez pas cette fenêtre et n&apos;actualisez pas la page avant
                d&apos;avoir envoyé votre candidature.
              </li>
              <li>
                Ce questionnaire comporte <strong>{totalQuestions} question{totalQuestions > 1 ? 's' : ''}</strong>
                {qcm.duree ? <> et sa durée indicative est de <strong>{qcm.duree} minutes</strong></> : null}.
              </li>
              <li>
                Préparez votre <strong>lettre de motivation au format PDF</strong> :
                elle vous sera demandée pour finaliser l&apos;envoi.
              </li>
            </AvertissementListe>
            <CommencerButton type="button" onClick={() => setACommence(true)}>
              <ClipboardList size={16} strokeWidth={2} />
              J&apos;ai compris, commencer le questionnaire
            </CommencerButton>
          </AvertissementCard>
        )}

        {/* === Bannière d'erreur en cours de soumission === */}
        {error && !success && (
          <ErrorBanner>
            <ErrorBannerIcon><AlertCircle size={16} strokeWidth={2} /></ErrorBannerIcon>
            {error}
          </ErrorBanner>
        )}

        {/* === Affichage du succès === */}
        {success ? (
          <SuccessCard>
            <SuccessIcon>
              <PartyPopper size={44} strokeWidth={1.8} />
            </SuccessIcon>
            <h2>Candidature envoyée !</h2>
            <p>Votre candidature a bien été enregistrée auprès de <strong>{offre.nomEntreprise}</strong>.</p>
            <p>
              <strong>Votre note : {success.noteQCM}%</strong>
              {' '}({success.earnedPoints}/{success.totalPoints} points)
            </p>
            {documentsEchoues > 0 && (
              <p>
                <AlertCircle size={14} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 5 }} />
                {documentsEchoues} document{documentsEchoues > 1 ? 's' : ''} n&apos;{documentsEchoues > 1 ? 'ont' : 'a'} pas
                pu être envoyé{documentsEchoues > 1 ? 's' : ''}. Vous pourrez réessayer depuis « Mes candidatures ».
              </p>
            )}
            <SubmitButton onClick={() => router.push('/pages/listeOffre')}>
              <ArrowLeft size={15} strokeWidth={2} />
              Retour à la liste des offres
            </SubmitButton>
          </SuccessCard>
        ) : !aCommence ? null : (
          <>
            {/* === Chronomètre === */}
            {tempsRestant !== null && (() => {
              const dureeTotale = qcm.duree * 60
              const niveau = tempsRestant === 0
                ? 'ecoule'
                : tempsRestant <= dureeTotale * 0.2 ? 'attention' : 'normal'
              return (
                <TimerBadge $niveau={niveau}>
                  <Clock size={16} strokeWidth={2.2} />
                  {tempsRestant === 0
                    ? 'Temps écoulé'
                    : `Temps restant : ${formaterTempsRestant(tempsRestant)}`}
                </TimerBadge>
              )
            })()}

            {/* === Questions === */}
            {questions.map((q, idx) => (
              <QuestionCard key={q.idQuestion}>
                <QuestionHeader>
                  <QuestionNumber>Question {idx + 1}/{totalQuestions}</QuestionNumber>
                  <QuestionPoints>{q.points} {q.points > 1 ? 'points' : 'point'}</QuestionPoints>
                </QuestionHeader>
                <QuestionText>{q.enonce}</QuestionText>

                <ChoicesList>
                  {q.choix.map((c) => (
                    <ChoiceLabel
                      key={c.idChoix}
                      $selected={responses[q.idQuestion] === c.idChoix}
                    >
                      <ChoiceRadio
                        type="radio"
                        name={`question-${q.idQuestion}`}
                        checked={responses[q.idQuestion] === c.idChoix}
                        onChange={() => handleSelectChoice(q.idQuestion, c.idChoix)}
                      />
                      <ChoiceText>{c.enonce}</ChoiceText>
                    </ChoiceLabel>
                  ))}
                </ChoicesList>
              </QuestionCard>
            ))}

            {/* === Upload fichiers === */}
            <FileUploadSection>
              <FileUploadTitle>
                <Paperclip size={16} strokeWidth={2} />
                Documents requis
              </FileUploadTitle>
              {/* Choix du CV dans la bibliotheque, ou televersement */}
              {cvsDisponibles.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
                                  color: '#475569', marginBottom: 6 }}>
                    Quel CV souhaitez-vous envoyer ?
                  </label>
                  <select
                    value={nouveauCv ? '__nouveau__' : idCVChoisi}
                    onChange={(e) => {
                      if (e.target.value === '__nouveau__') {
                        setNouveauCv(true)
                      } else {
                        setNouveauCv(false)
                        setIdCVChoisi(e.target.value)
                      }
                    }}
                    style={{ width: '100%', padding: '11px 14px', fontSize: 14,
                             border: '1.5px solid #e2e8f0', borderRadius: 9,
                             background: 'white', outline: 'none' }}
                  >
                    {cvsDisponibles.map(c => (
                      <option key={c.idCV} value={c.idCV}>
                        {c.libelle}{c.estPrincipal ? ' (principal)' : ''}
                      </option>
                    ))}
                    <option value="__nouveau__">Téléverser un nouveau CV...</option>
                  </select>
                </div>
              )}

              <FileUploadGrid>
                {(nouveauCv || cvsDisponibles.length === 0) && (
                <FileUploadCard $selected={!!cv}>
                  <FileInputHidden
                    type="file"
                    accept=".pdf,application/pdf"
                    id="upload-cv"
                    onChange={(e) => handleFileChange(setCv, e.target.files[0])}
                  />
                  <label htmlFor="upload-cv" style={{ cursor: 'pointer', display: 'block' }}>
                    <FileUploadIcon>
                      <FileText size={32} strokeWidth={1.5} />
                    </FileUploadIcon>
                    <FileUploadText>
                      {cv ? 'CV sélectionné' : 'Téléverser votre CV'}
                    </FileUploadText>
                    <FileUploadHelper>PDF, max 5 Mo</FileUploadHelper>
                    {cv && (
                      <FileSelectedName>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        {cv.name}
                      </FileSelectedName>
                    )}
                  </label>
                </FileUploadCard>
                )}

                <FileUploadCard $selected={!!lettreMotivation}>
                  <FileInputHidden
                    type="file"
                    accept=".pdf,application/pdf"
                    id="upload-lettre"
                    onChange={(e) => handleFileChange(setLettreMotivation, e.target.files[0])}
                  />
                  <label htmlFor="upload-lettre" style={{ cursor: 'pointer', display: 'block' }}>
                    <FileUploadIcon>
                      <FileEdit size={32} strokeWidth={1.5} />
                    </FileUploadIcon>
                    <FileUploadText>
                      {lettreMotivation ? 'Lettre sélectionnée' : 'Téléverser votre lettre de motivation'}
                    </FileUploadText>
                    <FileUploadHelper>PDF, max 5 Mo</FileUploadHelper>
                    {lettreMotivation && (
                      <FileSelectedName>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        {lettreMotivation.name}
                      </FileSelectedName>
                    )}
                  </label>
                </FileUploadCard>

                <FileUploadCard $selected={autresDocuments.length > 0}>
                  <FileInputHidden
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    id="upload-autres-documents"
                    onChange={(e) => {
                      handleAutresDocumentsChange(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  <label htmlFor="upload-autres-documents" style={{ cursor: 'pointer', display: 'block' }}>
                    <FileUploadIcon>
                      <Files size={32} strokeWidth={1.5} />
                    </FileUploadIcon>
                    <FileUploadText>
                      {autresDocuments.length > 0
                        ? `${autresDocuments.length} document${autresDocuments.length > 1 ? 's' : ''} sélectionné${autresDocuments.length > 1 ? 's' : ''}`
                        : 'Autres documents (facultatif)'}
                    </FileUploadText>
                    <FileUploadHelper>
                      {autresDocuments.length > 0
                        ? `Cliquez pour en ajouter d'autres — ${MAX_AUTRES_DOCUMENTS} maximum`
                        : `PDF, max 5 Mo chacun — ${MAX_AUTRES_DOCUMENTS} maximum`}
                    </FileUploadHelper>
                    {autresDocuments.map((f, i) => (
                      <FileSelectedName key={i}>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        {f.name}
                        <RemoveFileButton
                          type="button"
                          title="Retirer ce document"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRetirerAutreDocument(i)
                          }}
                        >
                          <X size={10} strokeWidth={3} />
                        </RemoveFileButton>
                      </FileSelectedName>
                    ))}
                  </label>
                </FileUploadCard>
              </FileUploadGrid>
            </FileUploadSection>

            {/* === Footer fixe === */}
            <FooterCard>
              <ProgressInfo>
                {totalRepondues}/{totalQuestions} questions répondues
                {!toutesRepondues && ' — Répondez à toutes les questions'}
                {toutesRepondues && (!cvFourni || !lettreMotivation) && ' — Ajoutez vos documents'}
              </ProgressInfo>
              <ButtonsRow>
                <CancelButton onClick={handleCancel} disabled={submitting}>
                  Annuler
                </CancelButton>
                <SubmitButton
                  onClick={handleSubmit}
                  disabled={!toutesRepondues || !cvFourni || !lettreMotivation || submitting}
                >
                  {submitting ? (
                    'Envoi en cours...'
                  ) : (
                    <>
                      <Send size={15} strokeWidth={2} />
                      Envoyer ma candidature
                    </>
                  )}
                </SubmitButton>
              </ButtonsRow>
            </FooterCard>
          </>
        )}
      </PageContainer>
    </>
  )
}