'use client'
import { useState, useEffect } from 'react'
import { fetchAuth, getToken } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  FileText, Upload, Star, Trash2, Eye, Info, AlertCircle, CheckCircle2,
  Sparkles, ScanLine, RefreshCw
} from 'lucide-react'
import RevueCompetencesCV from '@/components/revueCompetencesCV'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, ScoreBadge,
  CardMeta, MetaItem, CardFooter, ActionButton,
  EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

const TAILLE_MAX_MO = 5

function formaterTaille(octets) {
  if (!octets) return '—'
  const mo = octets / 1024 / 1024
  return mo >= 1 ? `${mo.toFixed(1)} Mo` : `${Math.round(octets / 1024)} Ko`
}

function formaterDate(valeur) {
  if (!valeur) return '—'
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default function EtudiantCV() {
  const [cvs, setCvs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  // Formulaire d'ajout
  const [libelle, setLibelle] = useState('')
  const [fichier, setFichier] = useState(null)

  // Revue des compétences détectées : { cv, detections } du CV ouvert
  const [revue, setRevue] = useState(null)
  const [analyseEnCours, setAnalyseEnCours] = useState(null)

  const charger = async () => {
    try {
      const res = await fetchAuth('/api/cv')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setCvs(data.cvs || [])
    } catch (err) {
      setErreur(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  const ajouter = async (e) => {
    e.preventDefault()
    setErreur(''); setMessage('')

    if (!fichier) { setErreur('Veuillez choisir un fichier PDF.'); return }
    if (fichier.type !== 'application/pdf') {
      setErreur('Le CV doit être au format PDF.'); return
    }
    if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) {
      setErreur(`Le CV est trop volumineux (maximum ${TAILLE_MAX_MO} Mo).`); return
    }

    setEnCours(true)
    try {
      const formData = new FormData()
      formData.append('fichier', fichier)
      formData.append('libelle', libelle.trim() || fichier.name.replace(/\.pdf$/i, ''))

      const res = await fetchAuth('/api/cv', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Envoi impossible')

      setMessage(data.message)
      setLibelle(''); setFichier(null)
      document.getElementById('champ-cv').value = ''
      await charger()
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnCours(false)
    }
  }

  const definirPrincipal = async (idCV) => {
    setErreur(''); setMessage('')
    try {
      const res = await fetchAuth(`/api/cv/${idCV}`, {
        method: 'PATCH',
        body: JSON.stringify({ estPrincipal: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('CV principal mis à jour')
      await charger()
    } catch (err) { setErreur(err.message) }
  }

  const supprimer = async (idCV, libelleCv) => {
    if (!window.confirm(`Supprimer le CV « ${libelleCv} » ?`)) return
    setErreur(''); setMessage('')
    try {
      const res = await fetchAuth(`/api/cv/${idCV}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(data.message)
      await charger()
    } catch (err) { setErreur(err.message) }
  }

  /* Lance la lecture du CV. L'appel est synchrone côté serveur : lire un
     CV de deux pages demande une à deux secondes, OCR compris. */
  const analyser = async (idCV) => {
    setErreur(''); setMessage(''); setAnalyseEnCours(idCV)
    try {
      const res = await fetchAuth(`/api/cv/${idCV}/analyse`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analyse impossible')
      await charger()
      await ouvrirRevue(idCV)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setAnalyseEnCours(null)
    }
  }

  const ouvrirRevue = async (idCV) => {
    setErreur('')
    try {
      const res = await fetchAuth(`/api/cv/${idCV}/analyse`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lecture impossible')
      setRevue({ cv: data.cv, detections: data.detections })
    } catch (err) { setErreur(err.message) }
  }

  const enregistrerCompetences = async (confirmees) => {
    setErreur(''); setMessage('')
    try {
      const res = await fetchAuth(`/api/cv/${revue.cv.idCV}/analyse`, {
        method: 'PUT',
        body: JSON.stringify({ confirmees })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible')
      setMessage(data.message)
      setRevue(null)
      await charger()
    } catch (err) { setErreur(err.message) }
  }

  /* Le document n'est plus accessible publiquement : il faut passer par la
     route authentifiée, donc récupérer le fichier avec le jeton puis
     l'ouvrir depuis un blob. */
  const consulter = async (idCV) => {
    setErreur('')
    try {
      const res = await fetch(`/api/fichier/cv/${idCV}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) throw new Error('Document indisponible')
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err) { setErreur(err.message) }
  }

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <FileText size={24} strokeWidth={2} />
            Mes CV
          </PageTitle>
          <PageSubtitle>
            Conservez plusieurs versions de votre CV et choisissez la plus adaptée
            au moment de postuler.
          </PageSubtitle>
        </PageHeader>

        {erreur && (
          <EmptyState style={{ marginBottom: 16, borderStyle: 'solid', borderColor: '#fca5a5' }}>
            <AlertCircle size={16} strokeWidth={2} /> {erreur}
          </EmptyState>
        )}
        {message && (
          <EmptyState style={{ marginBottom: 16, borderStyle: 'solid', borderColor: '#d6dcb3' }}>
            <CheckCircle2 size={16} strokeWidth={2} /> {message}
          </EmptyState>
        )}

        {/* Revue des compétences détectées dans le CV en cours d'examen */}
        {revue && (
          <RevueCompetencesCV
            cv={revue.cv}
            detections={revue.detections}
            onEnregistrer={enregistrerCompetences}
            onFermer={() => setRevue(null)}
          />
        )}

        {/* Formulaire d'ajout */}
        <form onSubmit={ajouter} style={{ marginBottom: 28 }}>
          <CandidatureCard>
            <OffreTitre>Ajouter un CV</OffreTitre>
            <CardMeta style={{ marginTop: 12, gap: 12, flexDirection: 'column', alignItems: 'stretch' }}>
              <input
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Nom de ce CV (ex. « CV Développement web »)"
                maxLength={150}
                style={{
                  padding: '11px 14px', border: '1.5px solid #e2e8f0',
                  borderRadius: 9, fontSize: 14, outline: 'none'
                }}
              />
              <input
                id="champ-cv"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFichier(e.target.files?.[0] || null)}
                style={{ fontSize: 14 }}
              />
              <MetaItem>
                <Info size={13} strokeWidth={2} />
                Format PDF uniquement, {TAILLE_MAX_MO} Mo maximum. 5 CV au maximum.
              </MetaItem>
            </CardMeta>
            <CardFooter>
              <span />
              <ActionButton type="submit" disabled={enCours}>
                <Upload size={13} strokeWidth={2} />
                {enCours ? 'Envoi en cours...' : 'Ajouter ce CV'}
              </ActionButton>
            </CardFooter>
          </CandidatureCard>
        </form>

        {isLoading ? (
          <LoadingState>Chargement de vos CV...</LoadingState>
        ) : cvs.length === 0 ? (
          <EmptyState>
            <p>Vous n&apos;avez encore aucun CV enregistré.</p>
            <p>Ajoutez-en un ci-dessus : il vous sera proposé automatiquement lors de vos candidatures.</p>
          </EmptyState>
        ) : (
          <CandidatureList>
            {cvs.map(cv => (
              <CandidatureCard key={cv.idCV}>
                <CardHeader>
                  <div>
                    <OffreTitre>{cv.libelle}</OffreTitre>
                    <EntrepriseNom>
                      <FileText size={14} strokeWidth={2} />
                      {cv.nomFichierOriginal || 'document.pdf'}
                    </EntrepriseNom>
                  </div>
                  {cv.estPrincipal && (
                    <ScoreBadge>
                      <Star size={13} strokeWidth={2.5} />
                      CV principal
                    </ScoreBadge>
                  )}
                </CardHeader>

                <CardMeta>
                  <MetaItem>Ajouté le {formaterDate(cv.dateAjout)}</MetaItem>
                  <MetaItem>{formaterTaille(cv.tailleOctets)}</MetaItem>
                  <MetaItem>
                    {Number(cv.nombreCandidatures) === 0
                      ? 'Jamais envoyé'
                      : `Envoyé à ${cv.nombreCandidatures} offre${Number(cv.nombreCandidatures) > 1 ? 's' : ''}`}
                  </MetaItem>
                  {cv.statutAnalyse === 'analyse' && (
                    <MetaItem>
                      {Number(cv.pagesOcr) > 0
                        ? <ScanLine size={13} strokeWidth={2} />
                        : <FileText size={13} strokeWidth={2} />}
                      {Number(cv.pagesOcr) > 0
                        ? `${cv.pagesOcr}/${cv.nombrePages} page${Number(cv.nombrePages) > 1 ? 's' : ''} déchiffrée${Number(cv.pagesOcr) > 1 ? 's' : ''} par OCR`
                        : 'Lu directement'}
                    </MetaItem>
                  )}
                  {Number(cv.competencesConfirmees) > 0 && (
                    <MetaItem>
                      <CheckCircle2 size={13} strokeWidth={2} />
                      {cv.competencesConfirmees} compétence{Number(cv.competencesConfirmees) > 1 ? 's' : ''} au profil
                    </MetaItem>
                  )}
                </CardMeta>

                {/* Le CV a été lu mais l'étudiant n'a pas encore tranché :
                    c'est le seul cas qui mérite d'attirer son attention. */}
                {cv.statutAnalyse === 'analyse' && Number(cv.detectionsEnAttente) > 0 && (
                  <CardMeta>
                    <MetaItem style={{ fontWeight: 600, color: '#92400e' }}>
                      <Sparkles size={13} strokeWidth={2.5} />
                      {cv.detectionsEnAttente} compétence{Number(cv.detectionsEnAttente) > 1 ? 's' : ''} détectée{Number(cv.detectionsEnAttente) > 1 ? 's' : ''} en attente de votre confirmation
                    </MetaItem>
                  </CardMeta>
                )}
                {cv.statutAnalyse === 'echec' && (
                  <CardMeta>
                    <MetaItem style={{ color: '#b91c1c' }}>
                      <AlertCircle size={13} strokeWidth={2} />
                      {cv.messageAnalyse || "Ce document n'a pas pu être lu."}
                    </MetaItem>
                  </CardMeta>
                )}

                <CardFooter>
                  <span />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <ActionButton onClick={() => consulter(cv.idCV)}>
                      <Eye size={13} strokeWidth={2} /> Consulter
                    </ActionButton>
                    {cv.statutAnalyse === 'analyse' ? (
                      <>
                        <ActionButton onClick={() => ouvrirRevue(cv.idCV)}>
                          <Sparkles size={13} strokeWidth={2} />
                          Voir les compétences trouvées
                        </ActionButton>
                        <ActionButton
                          onClick={() => analyser(cv.idCV)}
                          disabled={analyseEnCours === cv.idCV}
                        >
                          <RefreshCw size={13} strokeWidth={2} />
                          {analyseEnCours === cv.idCV ? 'Lecture...' : 'Relire'}
                        </ActionButton>
                      </>
                    ) : (
                      <ActionButton
                        onClick={() => analyser(cv.idCV)}
                        disabled={analyseEnCours === cv.idCV}
                      >
                        <Sparkles size={13} strokeWidth={2} />
                        {analyseEnCours === cv.idCV
                          ? 'Lecture du document...'
                          : 'Analyser ce CV'}
                      </ActionButton>
                    )}
                    {!cv.estPrincipal && (
                      <ActionButton onClick={() => definirPrincipal(cv.idCV)}>
                        <Star size={13} strokeWidth={2} /> Définir principal
                      </ActionButton>
                    )}
                    <ActionButton onClick={() => supprimer(cv.idCV, cv.libelle)}>
                      <Trash2 size={13} strokeWidth={2} /> Supprimer
                    </ActionButton>
                  </div>
                </CardFooter>
              </CandidatureCard>
            ))}
          </CandidatureList>
        )}
      </PageContainer>
    </>
  )
}
