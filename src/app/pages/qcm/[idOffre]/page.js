'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  CheckCircle2, AlertCircle, ClipboardList, HelpCircle, Clock,
  Paperclip, FileText, FileEdit, PartyPopper, Send, ArrowLeft
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
  FileSelectedName, SuccessCard, SuccessIcon, ErrorBanner, ErrorBannerIcon
} from '@/components/styleQCM'

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
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

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

  const handleSubmit = async () => {
    if (!toutesRepondues || !cv || !lettreMotivation) return

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('idOffre', idOffre)
      formData.append('cv', cv)
      formData.append('lettreMotivation', lettreMotivation)
      formData.append('reponses', JSON.stringify(responses))

      const res = await fetchAuth('/api/candidature', {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`)

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
              <strong>Votre score : {success.scoreMatching}%</strong>
              {' '}({success.earnedPoints}/{success.totalPoints} points)
            </p>
            <SubmitButton onClick={() => router.push('/pages/listeOffre')}>
              <ArrowLeft size={15} strokeWidth={2} />
              Retour à la liste des offres
            </SubmitButton>
          </SuccessCard>
        ) : (
          <>
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
              <FileUploadGrid>
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
              </FileUploadGrid>
            </FileUploadSection>

            {/* === Footer fixe === */}
            <FooterCard>
              <ProgressInfo>
                {totalRepondues}/{totalQuestions} questions répondues
                {!toutesRepondues && ' — Répondez à toutes les questions'}
                {toutesRepondues && (!cv || !lettreMotivation) && ' — Ajoutez vos documents'}
              </ProgressInfo>
              <ButtonsRow>
                <CancelButton onClick={handleCancel} disabled={submitting}>
                  Annuler
                </CancelButton>
                <SubmitButton
                  onClick={handleSubmit}
                  disabled={!toutesRepondues || !cv || !lettreMotivation || submitting}
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