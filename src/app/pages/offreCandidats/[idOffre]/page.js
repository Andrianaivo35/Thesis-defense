'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import {
  UserSearch, GraduationCap, Landmark, MessageSquare, ArrowLeft,
  ArrowRight, Sparkles, Info
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  StatsRow, StatCard, StatValue, StatLabel,
  FiltersBar, FilterButton,
  CandidatureList, CandidatureCard, CardHeader,
  OffreTitre, EntrepriseNom, ScoreBadge,
  CardMeta, MetaItem, CardFooter, ActionButton,
  EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

const TRIS = [
  { cle: 'score', libelle: 'Meilleur score' },
  { cle: 'nom', libelle: 'Nom (A → Z)' }
]

/* Sens inverse des recommandations : l'entreprise voit les profils
   correspondant à son offre, avec l'explication du rapprochement. */
export default function OffreCandidats() {
  const { idOffre } = useParams()
  const router = useRouter()
  const [donnees, setDonnees] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [tri, setTri] = useState('score')

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetchAuth(`/api/offreCandidats/${idOffre}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Chargement impossible')
        setDonnees(data)
      } catch (err) {
        setErreur(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    charger()
  }, [idOffre])

  const candidats = useMemo(() => {
    const liste = donnees?.candidats || []
    if (tri === 'nom') {
      return [...liste].sort((a, b) =>
        `${a.nomEtudiant} ${a.prenomEtudiant}`.localeCompare(`${b.nomEtudiant} ${b.prenomEtudiant}`)
      )
    }
    return liste  // déjà trié par score décroissant côté API
  }, [donnees, tri])

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <UserSearch size={24} strokeWidth={2} />
            Candidats suggérés
          </PageTitle>
          <PageSubtitle>
            {donnees?.offre
              ? `Profils correspondant à votre offre « ${donnees.offre.titre} ».`
              : 'Profils correspondant à votre offre.'}
          </PageSubtitle>
        </PageHeader>

        {isLoading ? (
          <LoadingState>Analyse des profils en cours...</LoadingState>
        ) : erreur ? (
          <EmptyState>{erreur}</EmptyState>
        ) : (
          <>
            <StatsRow>
              <StatCard>
                <StatValue>{donnees.total}</StatValue>
                <StatLabel>Candidats retenus</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{donnees.candidatsEvalues}</StatValue>
                <StatLabel>Profils analysés</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{donnees.competencesExigees.length}</StatValue>
                <StatLabel>Compétences exigées</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{donnees.candidats[0]?.score ?? '—'}</StatValue>
                <StatLabel>Meilleur score</StatLabel>
              </StatCard>
            </StatsRow>

            {donnees.competencesExigees.length > 0 && (
              <CandidatureCard style={{ marginBottom: 24 }}>
                <OffreTitre style={{ fontSize: 15 }}>Compétences exigées par l&apos;offre</OffreTitre>
                <CardMeta style={{ marginTop: 10 }}>
                  {donnees.competencesExigees.map(c => (
                    <MetaItem key={c.nom}>
                      {c.nom}
                      {c.estObligatoire ? ' (obligatoire)' : ''}
                    </MetaItem>
                  ))}
                </CardMeta>
              </CandidatureCard>
            )}

            <PageTitle style={{ fontSize: 19 }}>
              Profils par ordre de correspondance
            </PageTitle>

            <FiltersBar>
              {TRIS.map(t => (
                <FilterButton
                  key={t.cle}
                  $actif={tri === t.cle}
                  onClick={() => setTri(t.cle)}
                >
                  {t.libelle}
                </FilterButton>
              ))}
            </FiltersBar>

            {candidats.length === 0 ? (
              <EmptyState>
                Aucun profil ne correspond suffisamment à cette offre pour le moment.
                Les étudiants ayant déjà postulé figurent dans vos candidatures.
              </EmptyState>
            ) : (
              <CandidatureList>
                {candidats.map((c) => {
                  const proximite = c.raisons?.find(r => r.texte.includes('proche de'))
                  const meilleurScore = c.score === Math.max(...candidats.map(x => x.score))
                  return (
                    <CandidatureCard key={c.idEtudiant}>
                      <CardHeader>
                        <div>
                          <OffreTitre>{c.prenomEtudiant} {c.nomEtudiant}</OffreTitre>
                          <EntrepriseNom>
                            <GraduationCap size={14} strokeWidth={2} />
                            {c.specialisation || c.filiere || 'Filière non précisée'}
                            {c.niveauAcademique ? ` — ${c.niveauAcademique}` : ''}
                          </EntrepriseNom>
                        </div>
                        <ScoreBadge>
                          {meilleurScore && <Sparkles size={13} strokeWidth={2.5} />}
                          {c.score} / 100
                        </ScoreBadge>
                      </CardHeader>

                      {c.nomUniversite && (
                        <CardMeta>
                          <MetaItem>
                            <Landmark size={13} strokeWidth={2} />
                            {c.sigleUniversitaire
                              ? `${c.sigleUniversitaire} — ${c.nomUniversite}`
                              : c.nomUniversite}
                          </MetaItem>
                        </CardMeta>
                      )}

                      {/* Explication du rapprochement : sans elle, l'entreprise
                          ne comprendrait pas pourquoi un profil ne possédant pas
                          la compétence exigée lui est proposé. */}
                      {c.raisons?.length > 0 && (
                        <CardMeta style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                          {c.raisons.slice(0, 3).map((r, i) => (
                            <MetaItem key={i} style={{ fontWeight: r.fort ? 600 : 400 }}>
                              • {r.texte}
                            </MetaItem>
                          ))}
                        </CardMeta>
                      )}

                      <CardFooter>
                        {proximite ? (
                          <MetaItem>
                            <Info size={13} strokeWidth={2} />
                            Compétence approchante retenue
                          </MetaItem>
                        ) : <span />}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {c.idUtilisateurEtudiant && (
                            <ActionButton
                              onClick={() =>
                                router.push(`/pages/messages?destinataire=${c.idUtilisateurEtudiant}`)
                              }
                            >
                              <MessageSquare size={13} strokeWidth={2} />
                              Contacter
                            </ActionButton>
                          )}
                          <ActionButton
                            onClick={() => router.push(`/pages/etudiantProfil/${c.idEtudiant}`)}
                          >
                            Voir le profil
                            <ArrowRight size={13} strokeWidth={2.5} />
                          </ActionButton>
                        </div>
                      </CardFooter>
                    </CandidatureCard>
                  )
                })}
              </CandidatureList>
            )}

            <CardFooter style={{ marginTop: 24, borderTop: 'none' }}>
              <ActionButton onClick={() => router.push('/pages/entrepriseDashboard')}>
                <ArrowLeft size={13} strokeWidth={2} />
                Retour au tableau de bord
              </ActionButton>
              <span />
            </CardFooter>
          </>
        )}
      </PageContainer>
    </>
  )
}
